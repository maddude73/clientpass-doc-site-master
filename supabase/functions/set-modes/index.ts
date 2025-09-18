import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    const { active_mode, coverage_mode } = body || {};

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Auth session missing!');
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Auth session missing!');
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr) {
      console.error('Auth error:', userErr);
      throw new Error('Auth session missing!');
    }
    if (!user) {
      throw new Error('Auth session missing!');
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (typeof active_mode === 'boolean') updates.active_mode = active_mode;
    if (typeof coverage_mode === 'boolean') updates.coverage_mode = coverage_mode;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('active_mode, coverage_mode')
      .maybeSingle();

    if (error) {
      console.error('set-modes update error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message } ), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!data) {
      const msg = 'Profile not found. Please complete your profile in Settings first.';
      return new Response(JSON.stringify({ success: false, error: msg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, ...data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    console.error('set-modes caught error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message ?? 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
