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

    // Fetch the open chair and verify it's live for this user
    const { data: openChair, error: fetchError } = await supabase
      .from('open_chairs')
      .select('*')
      .eq('id', open_chair_id)
      .eq('receiver_pro_id', userId)
      .eq('status', 'live')
      .single();

    if (fetchError || !openChair) {
      return new Response(JSON.stringify({ error: 'Open chair session not found or not live' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const now = new Date();

    // Get all bookings for this session to calculate final totals
    const { data: sessionBookings, error: bookingsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('open_chair_id', open_chair_id)
      .eq('receiving_pro', userId);

    if (bookingsError) {
      console.error('Error fetching session bookings:', bookingsError);
    }

    // Calculate session totals
    const completedBookings = sessionBookings?.filter(b => b.completed_at) || [];
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.service_price_actual || 0), 0);
    const totalServices = completedBookings.length;

    // Update open chair status to completed
    const { error: updateError } = await supabase
      .from('open_chairs')
      .update({
        status: 'completed',
        end_at: now.toISOString() // Set actual end time
      })
      .eq('id', open_chair_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to end session' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Process settlements for completed bookings
    for (const booking of completedBookings) {
      if (booking.service_price_actual && booking.service_price_actual > 0) {
        try {
          await supabase.functions.invoke('settle-open-chair-commission', {
            body: {
              referral_id: booking.id,
              service_price: booking.service_price_actual,
              manual_payment: booking.manual_payment || false
            }
          });
        } catch (error) {
          console.error('Error settling booking:', booking.id, error);
        }
      }
    }

    // Get user names for notifications
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

    // Notify host about session completion
    await supabase.from('messages').insert({
      user_id: openChair.user_id,
      kind: 'session_completed',
      title: 'Open Chair Session Completed',
      body: `${stylistName} has completed their open chair session at ${openChair.location}. ${totalServices} services completed with $${totalRevenue.toFixed(2)} total revenue.`,
      status: 'unread',
    });

    // Notify stylist about session completion
    await supabase.from('messages').insert({
      user_id: userId,
      kind: 'session_summary',
      title: 'Session Summary Ready',
      body: `Your open chair session at ${openChair.location} is complete. ${totalServices} services completed with $${totalRevenue.toFixed(2)} total revenue. Earnings have been updated.`,
      status: 'unread',
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Session ended successfully. All bookings have been settled.',
      session_summary: {
        location: openChair.location,
        total_services: totalServices,
        total_revenue: totalRevenue,
        host_pct: openChair.host_pct,
        duration: openChair.start_at ? Math.round((now.getTime() - new Date(openChair.start_at).getTime()) / 60000) : 0 // minutes
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('end-open-chair-session error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});