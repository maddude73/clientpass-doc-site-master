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

    const body = await req.json();
    const { referralId } = body;

    if (!referralId) {
      return new Response(JSON.stringify({ error: 'Missing referral ID' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get the referral
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (refError || !referral) {
      return new Response(JSON.stringify({ error: 'Referral not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if user can decline this referral
    if (referral.receiver_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized to decline this referral' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Find next available professional
    const attempted = Array.isArray(referral.attempted_users) ? referral.attempted_users : [];
    const alreadyTried = [...attempted, referral.receiver_id].filter(Boolean);
    
    const next = await findNextReceiver(supabase, referral.sender_id, alreadyTried);

    if (next) {
      // Reassign to next professional
      const newExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const newAttempted = [...attempted, referral.receiver_id].filter(Boolean);

      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          receiver_id: next.id,
          assigned_to: next.id,
          expires_at: newExpiry,
          attempted_users: newAttempted,
          status: 'pending',
        })
        .eq('id', referralId);

      if (updateError) throw updateError;

      // Send notifications
      await logNotification(
        supabase, 
        next.id, 
        'referral_assigned', 
        `New referral reassigned from another stylist. Accept within 10 minutes.`
      );
      
      await logNotification(
        supabase, 
        referral.sender_id, 
        'referral_reassigned', 
        `Your referral was reassigned to ${next.full_name}.`
      );

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'reassigned', 
        newReceiver: { id: next.id, name: next.full_name } 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // No more available professionals - mark as declined
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ 
          status: 'declined',
          expires_at: null
        })
        .eq('id', referralId);

      if (updateError) throw updateError;

      await logNotification(
        supabase, 
        referral.sender_id, 
        'referral_declined', 
        `No available professionals found for your referral. Please try again later.`
      );

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'declined', 
        message: 'No available professionals found' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    console.error('reassign-referral error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function findNextReceiver(supabaseClient: any, senderId: string, excludeIds: string[]) {
  const { data: users } = await supabaseClient
    .from('users')
    .select('id, full_name, active_mode, is_available_now, membership_tier')
    .neq('id', senderId)
    .eq('active_mode', true);

  const pool = (users || [])
    .filter((u: any) => !excludeIds.includes(u.id))
    .sort((a: any, b: any) => {
      // Prioritize available users first
      if (a.is_available_now !== b.is_available_now) {
        return b.is_available_now ? 1 : -1;
      }
      // Then sort by membership tier (pro first)
      return (b.membership_tier === 'pro' ? 1 : 0) - (a.membership_tier === 'pro' ? 1 : 0);
    });

  return pool[0] || null;
}

async function logNotification(supabaseClient: any, userId: string, type: string, message: string) {
  try {
    await supabaseClient.from('message_logs').insert({
      user_id: userId,
      message_type: type,
      recipient_type: 'user',
      message_content: message,
      status: 'sent',
    });
  } catch (_) {
    // Notification logging is non-critical
  }
}
