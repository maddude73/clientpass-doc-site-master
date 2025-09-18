import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  inviteEmail: string
  senderName: string
  senderEmail: string
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inviteEmail, senderName, senderEmail }: InviteRequest = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader?.replace('Bearer ', '') || ''
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Generate invite URL
    const inviteUrl = `${req.headers.get('origin') || 'https://clientpass.com'}/signup?invite=${btoa(user.id + ':' + inviteEmail)}`

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "ClientPass <onboarding@resend.dev>",
      to: [inviteEmail],
      subject: `${senderName} invited you to join their Trusted Network on ClientPass`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">You're Invited!</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">${senderName} wants to add you to their Trusted Network</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px; font-size: 20px; color: #333;">What is a Trusted Network?</h2>
            <p style="margin: 0; color: #666; line-height: 1.6;">
              When ${senderName} receives referrals, you'll be prioritized to receive them first. 
              This helps build stronger professional relationships and ensures clients get connected with trusted stylists and barbers.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Join ${senderName}'s Trusted Network
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #856404; font-size: 16px;">🎉 Special Benefits</h3>
            <ul style="margin: 0; padding-left: 20px; color: #856404; line-height: 1.6;">
              <li>Priority access to referrals from ${senderName}</li>
              <li>Professional networking opportunities</li>
              <li>Grow your client base with trusted connections</li>
            </ul>
          </div>

          <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    console.log('Trusted network invite sent:', {
      to: inviteEmail,
      from: senderEmail,
      inviteUrl,
      emailResponse
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invite sent successfully',
        inviteUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in send-trusted-invite:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})