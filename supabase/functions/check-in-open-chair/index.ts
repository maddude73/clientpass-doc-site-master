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

    // Fetch the open chair and verify it's accepted by this user
    const { data: openChair, error: fetchError } = await supabase
      .from('open_chairs')
      .select('*')
      .eq('id', open_chair_id)
      .eq('receiver_pro_id', userId)
      .eq('status', 'accepted')
      .single();

    if (fetchError || !openChair) {
      return new Response(JSON.stringify({ error: 'Open chair not found or not accepted by you' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const now = new Date();
    
    // Check if we're within the allowed time window (can check in up to 30 mins early)
    const startTime = openChair.start_at ? new Date(openChair.start_at) : null;
    const earlyCheckinAllowed = startTime ? new Date(startTime.getTime() - 30 * 60 * 1000) : null;
    
    if (earlyCheckinAllowed && now < earlyCheckinAllowed) {
      const minutesEarly = Math.ceil((earlyCheckinAllowed.getTime() - now.getTime()) / 60000);
      return new Response(JSON.stringify({ 
        error: `Check-in not allowed yet. You can check in ${minutesEarly} minutes from now.` 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Update status to 'live' - this starts the active session
    const { error: updateError } = await supabase
      .from('open_chairs')
      .update({
        status: 'live',
        // If start_at is null or in future, set it to now (early arrival)
        start_at: startTime && startTime <= now ? openChair.start_at : now.toISOString()
      })
      .eq('id', open_chair_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to check in' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Notify the host that stylist has checked in
    const { data: stylistData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    const stylistName = stylistData?.full_name || 'Stylist';

    await supabase.from('messages').insert({
      user_id: openChair.user_id,
      kind: 'open_chair_checkin',
      title: 'Stylist Checked In',
      body: `${stylistName} has checked in for the open chair session at ${openChair.location}. Session is now live.`,
      status: 'unread',
    });

    // Notify stylist that session is live
    await supabase.from('messages').insert({
      user_id: userId,
      kind: 'session_live',
      title: 'Session Live',
      body: `Your open chair session is now live at ${openChair.location}. All services during this window will count toward the ${openChair.host_pct || 20}% host commission.`,
      status: 'unread',
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Successfully checked in! Your session is now live.',
      session_data: {
        id: openChair.id,
        location: openChair.location,
        time_window: openChair.time_window,
        host_pct: openChair.host_pct,
        status: 'live',
        start_at: startTime && startTime <= now ? openChair.start_at : now.toISOString(),
        end_at: openChair.end_at
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('check-in-open-chair error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});