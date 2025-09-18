import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { inviteEmail } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error('Unauthorized');

    // Create an invite record
    const { data: invite, error: inviteError } = await supabase
      .from('docs_invites')
      .insert({ invitee_email: inviteEmail, sender_id: user.id })
      .select()
      .single();

    if (inviteError) throw inviteError;

    const inviteLink = `${Deno.env.get('SITE_URL')}/auth?invite_token=${invite.token}`;

    // Send email
    await resend.emails.send({
      from: 'docs@clientpass.com',
      to: inviteEmail,
      subject: 'You are invited to the ClientPass Documentation',
      html: `<h1>Invitation to ClientPass Docs</h1><p>You have been invited to access the ClientPass documentation site.</p><p><a href="${inviteLink}">Click here to accept your invitation and sign up.</a></p>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
