import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find expired referrals that are still pending
    const { data: expiredReferrals, error: fetchError } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (fetchError) throw fetchError

    let processed = 0
    let expired = 0

    for (const referral of expiredReferrals || []) {
      // Try to find next available stylist
      const { data: availableStylists } = await supabaseClient
        .from('users')
        .select('id, full_name')
        .eq('role', 'stylist')
        .eq('is_available_now', true)
        .not('id', 'in', `(${referral.attempted_users?.join(',') || ''})`)
        .neq('id', referral.sender_id)
        .limit(1)

      if (availableStylists && availableStylists.length > 0) {
        const nextStylist = availableStylists[0]
        
        // Assign to next stylist with new 10-minute timer
        const newDeadline = new Date(Date.now() + 10 * 60 * 1000)
        
        await supabaseClient
          .from('referrals')
          .update({
            receiver_id: nextStylist.id,
            expires_at: newDeadline.toISOString(),
            attempted_users: [...(referral.attempted_users || []), nextStylist.id]
          })
          .eq('id', referral.id)

        // Log notification
        await supabaseClient
          .from('message_logs')
          .insert({
            user_id: nextStylist.id,
            message_type: 'referral_reassigned',
            recipient_type: 'user',
            message_content: `Referral reassigned: ${referral.client_name} - 10 minutes to accept`,
            status: 'sent'
          })

        processed++
      } else {
        // No more available stylists - mark as expired
        await supabaseClient
          .from('referrals')
          .update({ status: 'expired' })
          .eq('id', referral.id)

        // Notify sender
        await supabaseClient
          .from('message_logs')
          .insert({
            user_id: referral.sender_id,
            message_type: 'referral_expired',
            recipient_type: 'user', 
            message_content: `Referral expired: ${referral.client_name} - No available stylists`,
            status: 'sent'
          })

        expired++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        expired,
        total: expiredReferrals?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})