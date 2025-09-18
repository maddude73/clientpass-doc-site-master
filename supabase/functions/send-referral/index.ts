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
    const { referralData } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check caller coverage mode
    const { data: callerProfile } = await supabaseClient
      .from('users')
      .select('id, full_name, coverage_mode')
      .eq('id', user.id)
      .maybeSingle()

    // Resolve service name for recording service_type
    let serviceName = null as string | null
    if (referralData.serviceId) {
      const { data: svc } = await supabaseClient
        .from('services')
        .select('name')
        .eq('id', referralData.serviceId)
        .maybeSingle()
      serviceName = svc?.name ?? null
    }

    // If coverage mode ON -> assign to self immediately, no timer
    if (callerProfile?.coverage_mode) {
      const { data: referral, error } = await supabaseClient
        .from('referrals')
        .insert({
          sender_id: user.id,
          receiver_id: user.id,
          created_by: user.id,
          assigned_to: user.id,
          client_name: referralData.clientName,
          client_phone: referralData.clientPhone,
          service_type: serviceName,
          commission_pct: referralData.commissionPercent,
          notes: referralData.notes,
          source: referralData.isSameDay ? 'sameday' : 'manual',
          expires_at: null,
          status: 'assigned',
          attempted_users: [user.id]
        })
        .select()
        .single()

      if (error) throw error

      await sendNotification(supabaseClient, {
        userId: user.id,
        title: 'Referral assigned to you',
        message: `Referral for ${referral.client_name || referralData.clientName} assigned directly (coverage mode).`,
        type: 'referral_assigned_self',
        referralId: referral.id
      })

      return new Response(
        JSON.stringify({ success: true, referral, receiver: { id: user.id, name: callerProfile.full_name } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Else: marketplace matching
    const receiver = await findBestReceiver(supabaseClient, {
      senderId: user.id,
      serviceId: referralData.serviceId,
    })

    if (!receiver) {
      return new Response(
        JSON.stringify({ 
          error: 'No available professionals found. Please try again later or contact support.',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

      // Create the referral with 10-minute timer (1 min in staging via DB trigger if configured)
      const timerExpiry = new Date(Date.now() + 10 * 60 * 1000)

      const { data: referral, error } = await supabaseClient
        .from('referrals')
        .insert({
          sender_id: user.id,
          receiver_id: receiver.id,
          created_by: user.id,
          assigned_to: receiver.id,
          client_name: referralData.clientName,
          client_phone: referralData.clientPhone,
          service_type: serviceName,
          commission_pct: referralData.commissionPercent,
          notes: referralData.notes,
          contact_source: referralData.contactSource,
          same_day: referralData.isSameDay,
          manual_payment: referralData.manualPayment,
          manual_fee_applied: referralData.manualFeeApplied,
          service_price_estimate: referralData.servicePrice,
          location_zip: referralData.locationZip,
          deposit_amount: referralData.depositAmount,
          expires_at: timerExpiry.toISOString(),
          status: 'pending',
          attempted_users: [receiver.id]
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Create client referral link
      const { data: clientLink } = await supabaseClient
        .from('client_referral_links')
        .insert({
          referral_id: referral.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single()

      // Log notifications
      await sendNotification(supabaseClient, {
        userId: receiver.id,
        title: 'New Referral!',
        message: `New referral for ${referral.client_name || referralData.clientName}. Accept within 10 minutes.`,
        type: 'new_referral',
        referralId: referral.id
      })

      await sendNotification(supabaseClient, {
        userId: user.id,
        title: 'Referral Sent!',
        message: `Your referral for ${referral.client_name || referralData.clientName} has been sent.`,
        type: 'referral_sent',
        referralId: referral.id
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          referral,
          receiver: { id: receiver.id, name: receiver.full_name },
          clientUrl: clientLink ? `/client/${clientLink.client_token}` : null
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

async function findBestReceiver(supabaseClient: any, params: {
  senderId: string,
  serviceId?: string,
}) {
  // Get sender's trusted network first
  const { data: senderData } = await supabaseClient
    .from('users')
    .select('trusted_partners')
    .eq('id', params.senderId)
    .single()

  // Try trusted network first if available
  if (senderData?.trusted_partners && senderData.trusted_partners.length > 0) {
    const { data: trustedUsers } = await supabaseClient
      .from('users')
      .select('id, full_name, active_mode, is_available_now, membership_tier')
      .in('id', senderData.trusted_partners)
      .eq('active_mode', true)
      .eq('is_available_now', true)

    if (trustedUsers && trustedUsers.length > 0) {
      // Sort Pro first within trusted network
      trustedUsers.sort((a: any, b: any) => (b.membership_tier === 'pro' ? 1 : 0) - (a.membership_tier === 'pro' ? 1 : 0))
      return trustedUsers[0]
    }
  }

  // Fallback to general marketplace matching
  const { data: users, error } = await supabaseClient
    .from('users')
    .select('id, full_name, active_mode, is_available_now, coverage_mode, coverage_list, membership_tier')
    .neq('id', params.senderId)
    .eq('active_mode', true)

  if (error) {
    console.error('findBestReceiver error:', error)
    return null
  }

  // Filter for immediately available users
  const available = (users || []).filter((u: any) => u.is_available_now)

  // Sort Pro first
  available.sort((a: any, b: any) => (b.membership_tier === 'pro' ? 1 : 0) - (a.membership_tier === 'pro' ? 1 : 0))

  if (available.length === 0) return null

  // If top candidate has coverage_mode, try their backups
  const candidate = available[0]
  if (candidate.coverage_mode && candidate.coverage_list && candidate.coverage_list.length > 0) {
    const { data: backups } = await supabaseClient
      .from('users')
      .select('id, full_name, active_mode, is_available_now, membership_tier')
      .in('id', candidate.coverage_list)
      .eq('active_mode', true)
      .eq('is_available_now', true)
    
    if (backups && backups.length > 0) {
      backups.sort((a: any, b: any) => (b.membership_tier === 'pro' ? 1 : 0) - (a.membership_tier === 'pro' ? 1 : 0))
      return backups[0]
    }
  }

  return candidate
}

async function sendNotification(supabaseClient: any, notification: {
  userId: string,
  title: string,
  message: string,
  type: string,
  referralId?: string
}) {
  try {
    await supabaseClient
      .from('message_logs')
      .insert({
        user_id: notification.userId,
        message_type: notification.type,
        recipient_type: 'user',
        message_content: `${notification.title} - ${notification.message}`,
        status: 'sent'
      })
  } catch (e) {
    console.log('Notification log failed', e)
  }
}