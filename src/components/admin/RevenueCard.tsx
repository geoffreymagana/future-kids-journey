import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, Users, Eye, RefreshCw } from 'lucide-react';

interface RevenueMetrics {
  totalSignups: number;
  totalReach: number;
  totalEnrollments: number;
  totalShowUps: number;
  totalFullyPaid: number;
  totalPartiallyPaid: number;
  totalUnpaid: number;
  enrollmentRevenue: number;
  attendanceRevenue: number;
  totalRevenue: number;
  enrollmentCommissionTotal: number;
  attendanceCommissionTotal: number;
  breakdown: {
    byStatus: { [key: string]: { count: number; commission: number } };
    byPaymentStatus: { [key: string]: { count: number; totalAmount: number; paidAmount: number } };
    byAgeGroup: { [key: string]: { count: number; totalAmount: number } };
  };
  payoutInfo: {
    nextPayoutDate: string;
    frequency: string;
    minimumAmount: number;
    pendingPayout: number;
  };
  paymentTerms: {
    enrollmentRate: number;
    attendanceRate: number;
    currency: string;
  };
}

interface RevenueCardProps {
  isSuperAdmin: boolean;
}

export const RevenueCard = ({ isSuperAdmin }: RevenueCardProps) => {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.request('GET', '/enrollments/revenue/metrics');
      if (response.success && response.data) {
        setMetrics(response.data as RevenueMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch revenue metrics:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;

    fetchMetrics();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchMetrics, 30 * 1000);
    return () => clearInterval(interval);
  }, [isSuperAdmin, fetchMetrics]);

  if (!isSuperAdmin || !metrics) {
    return null;
  }

  const { paymentTerms } = metrics;
  const currency = paymentTerms.currency;

  return (
    <>
      {/* Revenue Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue & Commission</h2>
          <p className="text-sm text-gray-600">Real-time metrics and earnings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMetrics}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Top Row: Website Visits and Sign Ups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Reach - Total Website Visits */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Website Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {metrics.totalReach.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Total reach
            </p>
          </CardContent>
        </Card>

        {/* Sign Ups - Enrollments Created */}
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sign Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-700">
              {metrics.totalEnrollments.toLocaleString()}
            </div>
            <p className="text-xs text-cyan-600 mt-2">
              Enrollments created
            </p>
          </CardContent>
        </Card>

        {/* Show Ups - Workshop Attendance */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Show Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">
              {metrics.totalShowUps.toLocaleString()}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Workshop attendees (paid)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Enrollment Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Enrollment Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {currency} {metrics.enrollmentRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-2">
              @ {paymentTerms.enrollmentRate}% rate
            </p>
          </CardContent>
        </Card>

        {/* Attendance Revenue */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Attendance Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {currency} {metrics.attendanceRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-2">
              @ {paymentTerms.attendanceRate}% rate
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {currency} {metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-red-600 mt-2">
              All commissions
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
