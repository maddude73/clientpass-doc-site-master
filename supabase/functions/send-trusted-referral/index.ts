import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReferralRequest {
  client_name: string;
  client_phone: string;
  client_email: string;
  service_type: string;
  location_address: string;
  appointment_datetime: string;
  service_price_estimate: number;
  notes?: string;
  send_to_trusted_first?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const referralData: SendReferralRequest = await req.json();
    console.log('Processing referral:', referralData);

    // Get sender's profile
    const { data: senderProfile, error: senderError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (senderError || !senderProfile) {
      console.error('Error fetching sender profile:', senderError);
      return new Response(JSON.stringify({ error: 'Sender profile not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Determine target audience
    let targetReceivers = [];
    const sendToTrustedFirst = referralData.send_to_trusted_first !== false; // Default true

    if (sendToTrustedFirst) {
      console.log('Sending to trusted network first');
      // Get trusted partners
      const { data: trustedPartners, error: trustedError } = await supabaseClient
        .from('trusted_network')
        .select(`
          partner_id,
          users:partner_id (
            id,
            full_name,
            active_mode,
            is_available_now,
            zip_code,
            city
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'active');

      if (!trustedError && trustedPartners) {
        targetReceivers = trustedPartners
          .map(tp => tp.users)
          .filter(Boolean)
          .filter(u => u.active_mode === true);
      }

      console.log(`Found ${targetReceivers.length} trusted partners`);
    }

    // If no trusted partners or not sending to trusted first, expand to broader network
    if (targetReceivers.length === 0) {
      console.log('No trusted partners available, expanding to broader network');
      const { data: allReceivers, error: receiversError } = await supabaseClient
        .from('users')
        .select('id, full_name, active_mode, is_available_now, zip_code, city')
        .eq('role', 'member')
        .eq('active_mode', true)
        .neq('id', user.id)
        .limit(10);

      if (!receiversError) {
        targetReceivers = allReceivers || [];
      }
    }

    if (targetReceivers.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No available professionals found',
        message: sendToTrustedFirst 
          ? 'No trusted partners available. Please add partners to your trusted network or try broadcasting to all stylists.'
          : 'No available professionals in your area at this time.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Select best receiver (first available for now)
    const selectedReceiver = targetReceivers[0];

    // Create the referral
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const responseDeadline = new Date();
    responseDeadline.setMinutes(responseDeadline.getMinutes() + 10); // 10 minutes to respond

    const { data: newReferral, error: referralError } = await supabaseClient
      .from('referrals')
      .insert({
        sender_id: user.id,
        sender_pro: user.id,
        receiving_pro: selectedReceiver.id,
        receiver_id: selectedReceiver.id,
        receiver_email: 'placeholder@clientpass.com', // This should be updated to actual email
        client_name: referralData.client_name,
        client_phone: referralData.client_phone,
        client_email: referralData.client_email,
        service_type: referralData.service_type,
        location_address: referralData.location_address,
        appointment_datetime: referralData.appointment_datetime,
        service_price_estimate: referralData.service_price_estimate,
        notes: referralData.notes || '',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        response_deadline: responseDeadline.toISOString(),
        timer_duration_minutes: 10,
        commission_pct: senderProfile.referral_commission_pct || 20,
        source: sendToTrustedFirst ? 'trusted_referral' : 'general_referral'
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return new Response(JSON.stringify({ error: 'Failed to create referral' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Send notification to receiver
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        user_id: selectedReceiver.id,
        title: 'New Referral Available',
        body: `${referralData.client_name} needs ${referralData.service_type} service. Respond within 10 minutes to accept.`,
        kind: 'referral'
      });

    if (messageError) {
      console.warn('Error sending notification:', messageError);
    }

    // Create client referral link
    const { data: clientLink, error: linkError } = await supabaseClient
      .from('client_referral_links')
      .insert({
        referral_id: newReferral.id
      })
      .select()
      .single();

    if (linkError) {
      console.warn('Error creating client link:', linkError);
    }

    console.log('Referral created successfully:', newReferral.id);

    return new Response(JSON.stringify({ 
      success: true, 
      referral: newReferral,
      receiver: selectedReceiver,
      client_link: clientLink?.client_token,
      message: sendToTrustedFirst 
        ? `Referral sent to trusted partner ${selectedReceiver.full_name}` 
        : `Referral sent to ${selectedReceiver.full_name}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-trusted-referral function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);