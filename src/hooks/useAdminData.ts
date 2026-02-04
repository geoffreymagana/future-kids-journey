import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from './useAdminAuth';

interface OverviewData {
  totalParents: number;
  totalShares: number;
  recentParents: number;
  recentShares: number;
  totalReferrals: number;
  conversionRate: string;
}

interface Submission {
  id: string;
  name: string;
  whatsapp: string;
  age_range: string;
  referral_id: string;
  referred_by: string | null;
  created_at: string;
}

interface SubmissionsData {
  submissions: Submission[];
  total: number;
  page: number;
  totalPages: number;
}

interface SharesData {
  platformBreakdown: { platform: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

interface ReferralsData {
  topReferrers: { referralId: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
}

export const useAdminData = () => {
  const { token } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async <T,>(endpoint: string, params?: Record<string, string>): Promise<T | null> => {
    if (!token) {
      setError('Not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({ endpoint, ...params });
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired');
          return null;
        }
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setError('Failed to load data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchOverview = useCallback(() => fetchData<OverviewData>('overview'), [fetchData]);
  
  const fetchSubmissions = useCallback((page = 1, limit = 20) => 
    fetchData<SubmissionsData>('submissions', { page: String(page), limit: String(limit) }), 
    [fetchData]
  );
  
  const fetchShares = useCallback(() => fetchData<SharesData>('shares'), [fetchData]);
  
  const fetchReferrals = useCallback(() => fetchData<ReferralsData>('referrals'), [fetchData]);

  return {
    isLoading,
    error,
    fetchOverview,
    fetchSubmissions,
    fetchShares,
    fetchReferrals,
  };
};
