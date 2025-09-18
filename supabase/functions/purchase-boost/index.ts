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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader?.replace('Bearer ', '') || '';
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    
    if (userErr) throw userErr;
    if (!user) throw new Error('Unauthorized');

    // Get user's current membership and free boosts
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('membership, free_boosts_used_this_month, free_boosts_reset_date')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Reset free boosts if it's a new month
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    const resetDate = userProfile.free_boosts_reset_date;
    const resetMonth = resetDate ? resetDate.substring(0, 7) : null;

    let freeBoostsUsed = userProfile.free_boosts_used_this_month || 0;

    if (resetMonth !== currentMonth) {
      freeBoostsUsed = 0;
      await supabase
        .from('users')
        .update({
          free_boosts_used_this_month: 0,
          free_boosts_reset_date: now.toISOString().split('T')[0]
        })
        .eq('id', user.id);
    }

    const isPro = userProfile.membership === 'pro';
    const maxFreeBoosts = 4;
    const hasFreeBooststLeft = isPro && freeBoostsUsed < maxFreeBoosts;

    // Check for existing active boost
    const { data: existingBoost, error: existingError } = await supabase
      .from('boosts')
      .select('*')
      .eq('pro_id', user.id)
      .eq('status', 'active')
      .gte('end_at', now.toISOString())
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    const startAt = new Date();
    const duration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let endAt: Date;

    if (existingBoost) {
      // Extend existing boost by 24 hours
      endAt = new Date(new Date(existingBoost.end_at).getTime() + duration);
      
      const { data: updatedBoost, error: updateError } = await supabase
        .from('boosts')
        .update({ end_at: endAt.toISOString() })
        .eq('id', existingBoost.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('Boost extended successfully:', updatedBoost);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          boost: updatedBoost,
          message: 'Boost extended by 24 hours!',
          extended: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      // Create new boost
      endAt = new Date(startAt.getTime() + duration);

      const boostData: any = {
        pro_id: user.id,
        boost_type: '24h',
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: 'active',
        used_free_credit: hasFreeBooststLeft,
        amount_paid: hasFreeBooststLeft ? 0 : (isPro ? 3 : 5)
      };

      const { data: boost, error: boostError } = await supabase
        .from('boosts')
        .insert(boostData)
        .select()
        .single();

      if (boostError) throw boostError;

      // Update free boosts counter if used
      if (hasFreeBooststLeft) {
        await supabase
          .from('users')
          .update({ free_boosts_used_this_month: freeBoostsUsed + 1 })
          .eq('id', user.id);
      }

      console.log('Boost purchased successfully:', boost);

      return new Response(
        JSON.stringify({ 
          success: true, 
          boost,
          message: hasFreeBooststLeft 
            ? 'Free boost activated for 24 hours!' 
            : 'Boost purchased for 24 hours!',
          usedFreeBoost: hasFreeBooststLeft
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error: any) {
    console.error('Purchase boost error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to purchase boost' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});