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

    const nowIso = new Date().toISOString()

    // Find referrals that have expired and are still pending
    const { data: expired, error } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('status', 'pending')
      .lte('expires_at', nowIso)

    if (error) throw error

    const results: any[] = []

    for (const ref of expired || []) {
      try {
        const attempted = Array.isArray(ref.attempted_users) ? ref.attempted_users : []
        const alreadyTried = [...attempted, ref.receiver_id].filter(Boolean)
        const next = await findNextReceiver(supabaseClient, ref.sender_id, alreadyTried)

        if (next) {
          const newExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()
          const newAttempted = [...attempted, ref.receiver_id].filter(Boolean)

          await supabaseClient
            .from('referrals')
            .update({
              receiver_id: next.id,
              assigned_to: next.id,
              expires_at: newExpiry,
              attempted_users: newAttempted,
              status: 'pending',
            })
            .eq('id', ref.id)

          await logNotification(supabaseClient, next.id, 'referral_assigned', `New referral reassigned. Accept within 10 minutes.`)
          await logNotification(supabaseClient, ref.sender_id, 'referral_reassigned', `Your referral was reassigned to another professional.`)

          results.push({ id: ref.id, action: 'reassigned', receiver: next.id })
        } else {
          // No more available pros - mark as declined and void deposit authorization
          await supabaseClient
            .from('referrals')
            .update({ 
              status: 'declined',
              deposit_status: 'voided' 
            })
            .eq('id', ref.id)

          await logNotification(supabaseClient, ref.sender_id, 'referral_declined', `No available professionals found. Referral declined and deposit authorization voided.`)
          results.push({ id: ref.id, action: 'declined' })
        }
      } catch (e: any) {
        console.error('Error processing referral', ref.id, e)
        results.push({ id: ref.id, action: 'error', error: e.message })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})

async function findNextReceiver(supabaseClient: any, senderId: string, excludeIds: string[]) {
  const { data: users } = await supabaseClient
    .from('users')
    .select('id, active_mode, membership_tier')
    .neq('id', senderId)

  const pool = (users || [])
    .filter((u: any) => u.active_mode && !excludeIds.includes(u.id))
    .sort((a: any, b: any) => (b.membership_tier === 'pro' ? 1 : 0) - (a.membership_tier === 'pro' ? 1 : 0))

  return pool[0] || null
}

async function logNotification(supabaseClient: any, userId: string, type: string, message: string) {
  try {
    await supabaseClient.from('message_logs').insert({
      user_id: userId,
      message_type: type,
      recipient_type: 'user',
      message_content: message,
      status: 'sent',
    })
  } catch (_) {}
}
