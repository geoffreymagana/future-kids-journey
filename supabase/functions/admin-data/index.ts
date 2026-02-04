import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'fallback-secret';

async function verifyToken(authHeader: string | null): Promise<{ valid: boolean; payload?: any }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify admin token
    const authResult = await verifyToken(req.headers.get('authorization'));
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'overview';

    let responseData: any = {};

    switch (endpoint) {
      case 'overview': {
        // Get summary counts
        const { count: parentCount } = await supabase
          .from('parent_interests')
          .select('*', { count: 'exact', head: true });

        const { count: shareCount } = await supabase
          .from('share_events')
          .select('*', { count: 'exact', head: true });

        // Get recent submissions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentParents } = await supabase
          .from('parent_interests')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        const { count: recentShares } = await supabase
          .from('share_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Get referral stats
        const { data: referralData } = await supabase
          .from('parent_interests')
          .select('referred_by')
          .not('referred_by', 'is', null);

        const referralCount = referralData?.length || 0;

        responseData = {
          totalParents: parentCount || 0,
          totalShares: shareCount || 0,
          recentParents: recentParents || 0,
          recentShares: recentShares || 0,
          totalReferrals: referralCount,
          conversionRate: parentCount && shareCount 
            ? ((referralCount / (shareCount || 1)) * 100).toFixed(1) 
            : '0',
        };
        break;
      }

      case 'submissions': {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { data: submissions, count } = await supabase
          .from('parent_interests')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        responseData = {
          submissions: submissions || [],
          total: count || 0,
          page,
          totalPages: Math.ceil((count || 0) / limit),
        };
        break;
      }

      case 'shares': {
        // Get share breakdown by platform
        const { data: shares } = await supabase
          .from('share_events')
          .select('platform, created_at');

        const platformCounts: Record<string, number> = {};
        shares?.forEach((share: any) => {
          platformCounts[share.platform] = (platformCounts[share.platform] || 0) + 1;
        });

        // Get daily share trend (last 14 days)
        const dailyShares: Record<string, number> = {};
        shares?.forEach((share: any) => {
          const date = new Date(share.created_at).toISOString().split('T')[0];
          dailyShares[date] = (dailyShares[date] || 0) + 1;
        });

        responseData = {
          platformBreakdown: Object.entries(platformCounts).map(([platform, count]) => ({
            platform,
            count,
          })),
          dailyTrend: Object.entries(dailyShares)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-14)
            .map(([date, count]) => ({ date, count })),
        };
        break;
      }

      case 'referrals': {
        // Get top referrers
        const { data: referrers } = await supabase
          .from('parent_interests')
          .select('referred_by')
          .not('referred_by', 'is', null);

        const referrerCounts: Record<string, number> = {};
        referrers?.forEach((r: any) => {
          referrerCounts[r.referred_by] = (referrerCounts[r.referred_by] || 0) + 1;
        });

        const topReferrers = Object.entries(referrerCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([referralId, count]) => ({ referralId, count }));

        // Get age range distribution
        const { data: ageData } = await supabase
          .from('parent_interests')
          .select('age_range');

        const ageRangeCounts: Record<string, number> = {};
        ageData?.forEach((a: any) => {
          ageRangeCounts[a.age_range] = (ageRangeCounts[a.age_range] || 0) + 1;
        });

        responseData = {
          topReferrers,
          ageDistribution: Object.entries(ageRangeCounts).map(([range, count]) => ({
            range,
            count,
          })),
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
