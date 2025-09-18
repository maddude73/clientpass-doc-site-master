// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommissionRequest {
  referral_id: string;
  service_price: number;
  manual_payment?: boolean;
  outside_referrer_id?: string;
}

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

    const body: CommissionRequest = await req.json();
    const { referral_id, service_price, manual_payment = false, outside_referrer_id } = body;

    if (!referral_id || !service_price) {
      return new Response(JSON.stringify({ error: 'Missing referral_id or service_price' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get the referral and associated open chair
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select(`
        *,
        open_chairs!inner(*)
      `)
      .eq('id', referral_id)
      .single();

    if (refError || !referral) {
      return new Response(JSON.stringify({ error: 'Referral or associated open chair not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const openChair = referral.open_chairs;
    if (!openChair) {
      return new Response(JSON.stringify({ error: 'No open chair associated with this referral' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Calculate fees and commissions
    const hostPct = openChair.host_pct || 20;
    let hostAmount = service_price * (hostPct / 100);
    
    // Platform fees
    const platformFee = service_price < 100 ? 3 : 5;
    const proUser = true; // Would check membership
    const actualPlatformFee = proUser ? (service_price < 100 ? 2 : 3) : platformFee;
    
    // Manual payment surcharge
    const manualSurcharge = manual_payment ? 3 : 0;
    
    // Outside referrer commission (10% from host share, not added on top)
    let referrerAmount = 0;
    if (outside_referrer_id) {
      referrerAmount = service_price * 0.1;
      hostAmount -= referrerAmount; // Subtract from host, don't double-tax stylist
    }
    
    // Remainder to stylist
    const stylistAmount = service_price - hostAmount - actualPlatformFee - manualSurcharge;

    // Create commission records
    const commissions = [];
    
    // Host commission
    commissions.push({
      booking_id: referral_id,
      payee_id: openChair.user_id,
      role: 'host',
      percentage: hostPct - (outside_referrer_id ? 10 : 0), // Adjusted percentage
      amount: hostAmount,
      basis_amount: service_price,
    });

    // Outside referrer commission (if applicable)
    if (outside_referrer_id && referrerAmount > 0) {
      commissions.push({
        booking_id: referral_id,
        payee_id: outside_referrer_id,
        role: 'referrer',
        percentage: 10,
        amount: referrerAmount,
        basis_amount: service_price,
      });
    }

    // Insert commissions
    const { error: commissionError } = await supabase
      .from('commissions')
      .insert(commissions);

    if (commissionError) {
      console.error('Commission insert error:', commissionError);
      return new Response(JSON.stringify({ error: 'Failed to create commission records' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Update referral with pricing info
    await supabase
      .from('referrals')
      .update({
        service_price_actual: service_price,
        total_service_amount: service_price,
        platform_fee_applied: actualPlatformFee,
        manual_payment: manual_payment,
        manual_fee_applied: manual_payment,
      })
      .eq('id', referral_id);

    // Update user earnings
    await supabase.rpc('update_user_earnings', {
      user_id: openChair.user_id,
      amount: hostAmount,
    });

    if (outside_referrer_id) {
      await supabase.rpc('update_user_earnings', {
        user_id: outside_referrer_id,
        amount: referrerAmount,
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      settlement: {
        service_price,
        host_amount: hostAmount,
        host_percentage: hostPct - (outside_referrer_id ? 10 : 0),
        referrer_amount: referrerAmount,
        platform_fee: actualPlatformFee,
        manual_surcharge: manualSurcharge,
        stylist_amount: stylistAmount,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('settle-open-chair-commission error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});