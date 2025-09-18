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

    // Fetch the open chair
    const { data: openChair, error: fetchError } = await supabase
      .from('open_chairs')
      .select('*')
      .eq('id', open_chair_id)
      .single();

    if (fetchError || !openChair) {
      return new Response(JSON.stringify({ error: 'Open chair not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if already accepted or locked
    if (openChair.status !== 'posted') {
      return new Response(JSON.stringify({ error: `Open chair is already ${openChair.status}` }), { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if there's an active acceptance lock
    const now = new Date();
    if (openChair.acceptance_lock_until && new Date(openChair.acceptance_lock_until) > now) {
      const lockOwner = openChair.receiver_pro_id === userId ? 'you' : 'another stylist';
      return new Response(JSON.stringify({ 
        error: `Open chair is currently being reviewed by ${lockOwner}. Try again in a few minutes.` 
      }), { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Set 10-minute acceptance lock
    const lockExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    const { error: lockError } = await supabase
      .from('open_chairs')
      .update({
        receiver_pro_id: userId,
        acceptance_lock_until: lockExpiry.toISOString(),
      })
      .eq('id', open_chair_id)
      .eq('status', 'posted'); // Ensure it's still available

    if (lockError) {
      return new Response(JSON.stringify({ error: 'Failed to secure acceptance lock' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Notify the host
    const { data: hostData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    const stylistName = hostData?.full_name || 'A stylist';

    await supabase.from('messages').insert({
      user_id: openChair.user_id,
      kind: 'open_chair_pending',
      title: 'Open Chair Acceptance Pending',
      body: `${stylistName} is reviewing your open chair posting. They have 10 minutes to confirm.`,
      status: 'unread',
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'You have 10 minutes to confirm this open chair acceptance.',
      lock_expires_at: lockExpiry.toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('accept-open-chair error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});