import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();

    // Find expired boosts
    const { data: expiredBoosts, error: findError } = await supabase
      .from('boosts')
      .select('id, pro_id')
      .eq('status', 'active')
      .lt('end_at', now);

    if (findError) throw findError;

    if (expiredBoosts && expiredBoosts.length > 0) {
      // Update expired boosts
      const { error: updateError } = await supabase
        .from('boosts')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('end_at', now);

      if (updateError) throw updateError;

      console.log(`Expired ${expiredBoosts.length} boosts:`, expiredBoosts.map(b => b.id));

      // Optional: Send notifications to users about expired boosts
      for (const boost of expiredBoosts) {
        try {
          await supabase
            .from('notification_queue')
            .insert({
              user_id: boost.pro_id,
              type: 'boost_expired',
              title: 'Boost Expired',
              message: 'Your profile boost has ended. You are no longer Featured.',
              data: { boost_id: boost.id }
            });
        } catch (notifError) {
          console.error('Failed to create expiry notification:', notifError);
        }
      }
    }

    // Reset monthly free boosts if needed
    await supabase.rpc('reset_monthly_free_boosts');

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: expiredBoosts?.length || 0,
        message: 'Boost expiration check completed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Expire boosts error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to expire boosts' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});