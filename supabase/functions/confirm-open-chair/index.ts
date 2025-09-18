// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { open_chair_id } = body || {};

    if (!open_chair_id) {
      return new Response(JSON.stringify({ error: 'Missing open_chair_id' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch the open chair and verify lock ownership
    const { data: openChair, error: fetchError } = await supabase
      .from('open_chairs')
      .select('*')
      .eq('id', open_chair_id)
      .eq('receiver_pro_id', userId) // Must be the one who has the lock
      .single();

    if (fetchError || !openChair) {
      return new Response(JSON.stringify({ error: 'Open chair not found or not locked by you' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if lock is still valid
    const now = new Date();
    if (!openChair.acceptance_lock_until || new Date(openChair.acceptance_lock_until) <= now) {
      return new Response(JSON.stringify({ error: 'Acceptance lock has expired' }), { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Confirm the acceptance
    const { error: confirmError } = await supabase
      .from('open_chairs')
      .update({
        status: 'accepted',
        accepted_at: now.toISOString(),
        acceptance_lock_until: null, // Clear the lock
      })
      .eq('id', open_chair_id);

    if (confirmError) {
      return new Response(JSON.stringify({ error: 'Failed to confirm acceptance' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Notify both parties
    const { data: stylistData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { data: hostData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', openChair.user_id)
      .single();

    const stylistName = stylistData?.full_name || 'Stylist';
    const hostName = hostData?.full_name || 'Host';

    // Notify host
    await supabase.from('messages').insert({
      user_id: openChair.user_id,
      kind: 'open_chair_accepted',
      title: 'Open Chair Accepted!',
      body: `${stylistName} has accepted your open chair. They will be working during your posted time window.`,
      status: 'unread',
    });

    // Notify stylist
    await supabase.from('messages').insert({
      user_id: userId,
      kind: 'open_chair_confirmed',
      title: 'Open Chair Confirmed',
      body: `You've confirmed the open chair at ${openChair.location}. Time window: ${openChair.time_window}`,
      status: 'unread',
    });

    // TODO: Create calendar events for both parties
    // This would integrate with their calendar systems

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Open chair acceptance confirmed!',
      open_chair: {
        id: openChair.id,
        location: openChair.location,
        time_window: openChair.time_window,
        host_name: hostName,
        host_pct: openChair.host_pct
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('confirm-open-chair error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});