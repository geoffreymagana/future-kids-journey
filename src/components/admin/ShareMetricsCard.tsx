import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Share2, Eye, MousePointerClick, RefreshCw } from 'lucide-react';

interface ShareMetricsData {
  _id: string;
  parentName: string;
  shareMetrics?: {
    clicks?: Array<{ platform: string; timestamp: string; ip?: string }>;
    intents?: Array<{ platform: string; timestamp: string }>;
    visits?: Array<{ code: string; timestamp: string; ip?: string; userAgent?: string }>;
  };
}

interface ShareMetricsProps {
  isSuperAdmin: boolean;
}

export const ShareMetricsCard = ({ isSuperAdmin }: ShareMetricsProps) => {
  const [submissions, setSubmissions] = useState<ShareMetricsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalClicks: 0,
    totalIntents: 0,
    totalVisits: 0,
    topPlatforms: {} as { [key: string]: number }
  });

  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await apiService.getSubmissions({ limit: 1000 });
        if (response.success && response.data) {
          const data = response.data as {submissions: ShareMetricsData[]};
          const subs = data.submissions || [];
          setSubmissions(subs);

          // Calculate metrics
          let totalClicks = 0;
          let totalIntents = 0;
          let totalVisits = 0;
          const platformCounts: { [key: string]: number } = {};

          subs.forEach((submission: ShareMetricsData) => {
            if (submission.shareMetrics) {
              const { clicks = [], intents = [], visits = [] } = submission.shareMetrics;
              
              totalClicks += clicks.length;
              totalIntents += intents.length;
              totalVisits += visits.length;

              clicks.forEach(click => {
                platformCounts[click.platform] = (platformCounts[click.platform] || 0) + 1;
              });
            }
          });

          setMetrics({
            totalClicks,
            totalIntents,
            totalVisits,
            topPlatforms: platformCounts
          });
        }
      } catch (error) {
        console.error('Failed to fetch share metrics:', error);
        toast.error('Failed to load share metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30 * 1000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return null;
  }

  const topPlatformsArray = Object.entries(metrics.topPlatforms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Share Clicks */}
      <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sky-900 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Share Button Clicks
          </CardTitle>
          <CardDescription className="text-xs text-sky-700">
            Raw button clicks (includes duplicates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-sky-700">
            {metrics.totalClicks}
          </div>
          <p className="text-xs text-sky-600 mt-2">
            High engagement indicator
          </p>
        </CardContent>
      </Card>

      {/* Share Intents (Deduplicated) */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-indigo-900 flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Intents
          </CardTitle>
          <CardDescription className="text-xs text-indigo-700">
            Deduplicated (no double-clicks)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-indigo-700">
            {metrics.totalIntents}
          </div>
          <p className="text-xs text-indigo-600 mt-2">
            Unique sharing actions
          </p>
        </CardContent>
      </Card>

      {/* Referral Visits */}
      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-teal-900 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Referral Visits
          </CardTitle>
          <CardDescription className="text-xs text-teal-700">
            Actual clicks on shared links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-teal-700">
            {metrics.totalVisits}
          </div>
          <p className="text-xs text-teal-600 mt-2">
            True conversion rate
          </p>
        </CardContent>
      </Card>

      {/* Top Platforms */}
      <Card className="lg:col-span-3 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-amber-900">
            Top Sharing Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPlatformsArray.length > 0 ? (
            <div className="space-y-2">
              {topPlatformsArray.map(([platform, count], idx) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-900 capitalize">
                      #{idx + 1} {platform}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-amber-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(count / Math.max(...Object.values(metrics.topPlatforms))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="font-semibold text-amber-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700">No sharing data available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
