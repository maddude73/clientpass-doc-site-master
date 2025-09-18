// deno-lint-ignore-file no-explicit-any
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
      return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { 
      location, 
      start_at, 
      end_at, 
      services_allowed, 
      host_pct, 
      capacity = 1, 
      audience = 'all', 
      notes, 
      quiet_hours = true 
    } = body || {};

    if (!location || !start_at || !end_at || !services_allowed || !host_pct) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate host percentage
    if (host_pct < 15 || host_pct > 25) {
      return new Response(JSON.stringify({ error: 'Host percentage must be between 15% and 25%' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate time window
    const startTime = new Date(start_at);
    const endTime = new Date(end_at);
    const now = new Date();
    
    if (startTime <= now) {
      return new Response(JSON.stringify({ error: 'Start time must be in the future' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (endTime <= startTime) {
      return new Response(JSON.stringify({ error: 'End time must be after start time' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check 12-hour limit
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 12) {
      return new Response(JSON.stringify({ error: 'Window duration cannot exceed 12 hours' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: insertData, error: insertError } = await supabase
      .from('open_chairs')
      .insert({
        user_id: userId,
        location: location,
        zip_code: location.split(',').pop()?.trim().match(/\d{5}$/)?.[0] || '00000', // Extract ZIP from location
        start_at: startTime.toISOString(),
        end_at: endTime.toISOString(),
        services_allowed: services_allowed,
        host_pct: host_pct,
        capacity: capacity,
        audience: audience,
        status: 'open',
        notes: notes || null,
        expires_at: endTime.toISOString(),
        time_window: `${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`,
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // Determine eligible stylists based on audience
    let eligibleStylists;
    
    if (audience === 'trusted') {
      // First try trusted partners
      const { data: hostProfile } = await supabase
        .from('users')
        .select('trusted_partners')
        .eq('id', userId)
        .single();
      
      const trustedIds = hostProfile?.trusted_partners || [];
      
      if (trustedIds.length > 0) {
        const { data: trustedStylists } = await supabase
          .from('users')
          .select('id, full_name, zip_code, active_mode')
          .in('id', trustedIds)
          .eq('active_mode', true);
        
        eligibleStylists = trustedStylists || [];
      } else {
        eligibleStylists = [];
      }
      
      // After 5-10 minutes, fallback to all (would need a scheduled function)
      // For now, we'll just notify trusted or none
    } else {
      // Broadcast to all active stylists in area
      const zipCode = insertData.zip_code;
      const { data: allStylists } = await supabase
        .from('users')
        .select('id, full_name, zip_code, active_mode, open_chair_alerts_enabled')
        .eq('active_mode', true)
        .eq('open_chair_alerts_enabled', true)
        .eq('zip_code', zipCode)
        .neq('id', userId);
      
      eligibleStylists = allStylists || [];
    }

    // Send notifications
    if (eligibleStylists && eligibleStylists.length > 0) {
      const messages = eligibleStylists.map((stylist) => ({
        user_id: stylist.id,
        kind: 'open_chair_alert',
        title: `Open Chair Today at ${startTime.toLocaleTimeString()}`,
        body: `${location} • ${services_allowed.join(', ')} • Host ${host_pct}% • Capacity: ${capacity}`,
        status: 'unread',
      }));
      
      const { error: msgError } = await supabase.from('messages').insert(messages);
      if (msgError) {
        console.error('Failed to insert messages', msgError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      open_chair: insertData,
      notifications_sent: eligibleStylists?.length || 0 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('post-open-chair error', e);
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
