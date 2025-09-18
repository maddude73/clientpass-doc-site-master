import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    console.log('=== Inbox Action Function Called ===');
    
    const body = await req.json();
    console.log('Request body:', body);
    const { referral_id, action } = body;

    if (!referral_id || !action) {
      console.log('Missing referral_id or action:', { referral_id, action });
      throw new Error('Missing referral_id or action');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Identify caller
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log('Auth error:', userError);
      throw new Error('Unauthorized: ' + (userError?.message || 'No user found'));
    }
    
    console.log('User authenticated:', user.id);

    // Fetch referral - bypass RLS with service role
    const { data: ref, error: refErr } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referral_id)
      .maybeSingle();
      
    console.log('Referral query result:', { ref: !!ref, refErr, referral_id });
    
    if (refErr) {
      console.log('Referral fetch error:', refErr);
      throw new Error('Database error: ' + refErr.message);
    }
    
    if (!ref) {
      console.log('Referral not found for ID:', referral_id);
      throw new Error('Referral not found');
    }

    console.log('Processing action:', action, 'for referral:', ref.id, 'status:', ref.status);

    if (action === 'accept') {
      // Check if referral is still pending
      if (ref.status !== 'pending') {
        console.log('Referral status is not pending:', ref.status);
        if (ref.status === 'accepted') {
          throw new Error('This referral was just taken by another pro.');
        } else if (ref.status === 'expired') {
          throw new Error('This referral has expired.');
        } else {
          throw new Error('This referral is no longer available.');
        }
      }

      // Check if referral has expired
      if (ref.expires_at && new Date(ref.expires_at) < new Date()) {
        console.log('Referral has expired:', ref.expires_at);
        throw new Error('This referral has expired.');
      }

      // Create booking with snapshot data
      const bookingData = {
        referral_id: referral_id,
        receiving_pro: user.id,
        status: 'accepted',
        service_name_snapshot: ref.service_type || ref.service_title || 'Service',
        service_price_cents_snapshot: ref.service_price_estimate ? Math.round(ref.service_price_estimate * 100) : 0,
        service_duration_min_snapshot: 60,
        deposit_pct_snapshot: 20,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minute hold
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating booking with:', bookingData);

      const updateData = { 
        status: 'accepted', 
        accepted_at: new Date().toISOString(), 
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minute hold
        assigned_to: user.id, 
        receiver_id: user.id,
        receiving_pro: user.id,
        service_name_snapshot: bookingData.service_name_snapshot,
        service_price_cents_snapshot: bookingData.service_price_cents_snapshot,
        service_duration_min_snapshot: bookingData.service_duration_min_snapshot,
        deposit_pct_snapshot: bookingData.deposit_pct_snapshot
      };
      
      console.log('Updating referral with:', updateData);
      
      const { error, data: updateResult } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referral_id)
        .eq('status', 'pending') // Ensure concurrent update safety
        .select();
        
      console.log('Update result:', { error, updated: !!updateResult });
        
      if (error) {
        console.log('Update error:', error);
        throw new Error('Failed to update referral: ' + error.message);
      }

      if (!updateResult || updateResult.length === 0) {
        console.log('No rows updated - likely concurrent modification');
        throw new Error('This referral was just taken by another pro.');
      }

      console.log('Referral accepted successfully');
      
      await logMessage(supabase, user.id, 'inapp', 'Appointment Accepted', `Deposit request sent to the client.`);
      if (ref.sender_id) {
        await logMessage(supabase, ref.sender_id, 'inapp', 'Referral Accepted', `Your referral was accepted by a professional.`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'accepted',
        booking_id: referral_id,
        message: 'Appointment accepted. Deposit request sent to the client.'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (action === 'decline') {
      console.log('Attempting to reassign referral');
      const { data, error } = await supabase.functions.invoke('reassign-referral', { 
        body: { referralId: referral_id } 
      });
      
      if (error) {
        console.log('Reassign error:', error);
        throw new Error('Failed to reassign: ' + (error.message || 'Unknown error'));
      }
      
      await logMessage(supabase, user.id, 'inapp', 'Referral declined', `Referral ${referral_id} declined, reassignment attempted`);
      
      return new Response(JSON.stringify({ success: true, status: 'reassigned', data }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log('Invalid action:', action);
    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    });
    
  } catch (e: any) {
    console.error('Function error:', e);
    
    // Return appropriate HTTP status based on error type
    let status = 500;
    if (e.message.includes('just taken by another pro') || 
        e.message.includes('expired') || 
        e.message.includes('no longer available')) {
      status = 409; // Conflict
    } else if (e.message.includes('Unauthorized') || e.message.includes('No authorization')) {
      status = 401;
    } else if (e.message.includes('not found')) {
      status = 404;
    }
    
    return new Response(JSON.stringify({ error: e.message ?? 'Unknown error' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status 
    });
  }
});

async function logMessage(supabase: any, userId: string, kind: string, title: string, body: string) {
  try {
    await supabase.from('messages').insert({ user_id: userId, kind, title, body, status: 'sent' });
  } catch (_) {}
}
