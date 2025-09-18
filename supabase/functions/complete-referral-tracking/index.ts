import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteTrackingRequest {
  referral_id: string;
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { referral_id }: CompleteTrackingRequest = await req.json();

    // Get referral details
    const { data: referral, error: referralError } = await supabaseClient
      .from('referrals')
      .select('sender_pro, receiving_pro, status')
      .eq('id', referral_id)
      .single();

    if (referralError || !referral) {
      return new Response(JSON.stringify({ error: 'Referral not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Only track for completed referrals
    if (referral.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Referral not completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Update auto suggest tracking for both sender and receiver
    const trackingPromises = [];

    // Track completion for sender -> receiver relationship
    if (referral.sender_pro && referral.receiving_pro && referral.sender_pro !== referral.receiving_pro) {
      trackingPromises.push(
        updateAutoSuggestTracking(supabaseClient, referral.sender_pro, referral.receiving_pro)
      );
      trackingPromises.push(
        updateAutoSuggestTracking(supabaseClient, referral.receiving_pro, referral.sender_pro)
      );
    }

    await Promise.all(trackingPromises);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in complete-referral-tracking function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

async function updateAutoSuggestTracking(
  supabaseClient: any,
  userId: string,
  partnerId: string
) {
  try {
    // Check if tracking record exists
    const { data: existing } = await supabaseClient
      .from('auto_suggest_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('partner_id', partnerId)
      .single();

    if (existing) {
      // Increment count
      await supabaseClient
        .from('auto_suggest_tracking')
        .update({
          completed_count: existing.completed_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new tracking record
      await supabaseClient
        .from('auto_suggest_tracking')
        .insert({
          user_id: userId,
          partner_id: partnerId,
          completed_count: 1
        });
    }
  } catch (error) {
    console.error(`Error updating auto suggest tracking for ${userId} -> ${partnerId}:`, error);
  }
}

serve(handler);