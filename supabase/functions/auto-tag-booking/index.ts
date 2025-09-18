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

    const body = await req.json();
    const { referral_id } = body || {};

    if (!referral_id) {
      return new Response(JSON.stringify({ error: 'Missing referral_id' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch the referral/booking
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referral_id)
      .single();

    if (referralError || !referral) {
      return new Response(JSON.stringify({ error: 'Referral not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Skip if already tagged to an open chair
    if (referral.open_chair_id) {
      return new Response(JSON.stringify({ 
        message: 'Referral already tagged to an open chair',
        tagged: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find active open chair sessions for this stylist
    const { data: liveChairs, error: chairError } = await supabase
      .from('open_chairs')
      .select('*')
      .eq('receiver_pro_id', referral.receiving_pro)
      .eq('status', 'live');

    if (chairError || !liveChairs || liveChairs.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No active open chair sessions found',
        tagged: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if booking matches any live session criteria
    let matchedChair = null;
    const bookingDateTime = referral.appointment_datetime ? new Date(referral.appointment_datetime) : new Date();

    for (const chair of liveChairs) {
      const startTime = chair.start_at ? new Date(chair.start_at) : null;
      const endTime = chair.end_at ? new Date(chair.end_at) : null;

      // Check time window
      const inTimeWindow = startTime && endTime && 
        bookingDateTime >= startTime && 
        bookingDateTime <= endTime;

      // Check location match (simple string contains check)
      const locationMatch = !referral.location_address || 
        !chair.location || 
        referral.location_address.toLowerCase().includes(chair.location.toLowerCase()) ||
        chair.location.toLowerCase().includes(referral.location_address.toLowerCase());

      if (inTimeWindow && locationMatch) {
        matchedChair = chair;
        break;
      }

      // Also tag if it's within the session window but no specific appointment time
      if (!referral.appointment_datetime && startTime && endTime) {
        const now = new Date();
        if (now >= startTime && now <= endTime && locationMatch) {
          matchedChair = chair;
          break;
        }
      }
    }

    if (!matchedChair) {
      return new Response(JSON.stringify({ 
        message: 'Booking does not match active session criteria',
        tagged: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tag the booking to the open chair
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        open_chair_id: matchedChair.id,
        booking_source: 'open_chair'
      })
      .eq('id', referral_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to tag booking' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Booking successfully tagged to open chair session',
      tagged: true,
      open_chair_id: matchedChair.id,
      location: matchedChair.location,
      host_pct: matchedChair.host_pct
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('auto-tag-booking error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});