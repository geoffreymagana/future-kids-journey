import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReferralData {
  referralId: string;
  totalParents: number;
  totalShares: number;
  userShares: number;
  referredBy: string | null;
}

const generateReferralId = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const useReferral = () => {
  const [referralData, setReferralData] = useState<ReferralData>({
    referralId: '',
    totalParents: 0,
    totalShares: 0,
    userShares: 0,
    referredBy: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch counts from database
  const fetchCounts = useCallback(async () => {
    try {
      // Get total parents count
      const { count: parentsCount } = await supabase
        .from('parent_interests')
        .select('*', { count: 'exact', head: true });

      // Get total shares count
      const { count: sharesCount } = await supabase
        .from('share_events')
        .select('*', { count: 'exact', head: true });

      // Get user's shares count
      const storedId = localStorage.getItem('referralId');
      let userSharesCount = 0;
      if (storedId) {
        const { count } = await supabase
          .from('share_events')
          .select('*', { count: 'exact', head: true })
          .eq('referral_id', storedId);
        userSharesCount = count || 0;
      }

      setReferralData(prev => ({
        ...prev,
        totalParents: (parentsCount || 0) + 247, // Base count for social proof
        totalShares: (sharesCount || 0) + 89, // Base count for social proof
        userShares: userSharesCount,
      }));
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, []);

  useEffect(() => {
    // Check URL for referral param
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    // Get or create user's referral ID
    let storedId = localStorage.getItem('referralId');
    if (!storedId) {
      storedId = generateReferralId();
      localStorage.setItem('referralId', storedId);
    }

    setReferralData(prev => ({
      ...prev,
      referralId: storedId!,
      referredBy: refParam,
    }));

    // Fetch initial counts
    fetchCounts().finally(() => setIsLoading(false));

    // Set up realtime subscription for live updates
    const parentChannel = supabase
      .channel('parent_interests_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'parent_interests' },
        () => {
          setReferralData(prev => ({
            ...prev,
            totalParents: prev.totalParents + 1,
          }));
        }
      )
      .subscribe();

    const shareChannel = supabase
      .channel('share_events_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'share_events' },
        () => {
          setReferralData(prev => ({
            ...prev,
            totalShares: prev.totalShares + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(parentChannel);
      supabase.removeChannel(shareChannel);
    };
  }, [fetchCounts]);

  const getReferralLink = useCallback(() => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?ref=${referralData.referralId}`;
  }, [referralData.referralId]);

  const trackShare = useCallback(async (platform: string) => {
    try {
      const { error } = await supabase
        .from('share_events')
        .insert({
          referral_id: referralData.referralId,
          platform,
        });

      if (error) {
        console.error('Error tracking share:', error);
        return;
      }

      setReferralData(prev => ({
        ...prev,
        userShares: prev.userShares + 1,
        totalShares: prev.totalShares + 1,
      }));

      console.log(`Share tracked: ${platform}`);
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }, [referralData.referralId]);

  const submitInterest = useCallback(async (data: {
    name: string;
    whatsapp: string;
    ageRange: string;
  }) => {
    try {
      const { error } = await supabase
        .from('parent_interests')
        .insert({
          name: data.name,
          whatsapp: data.whatsapp,
          age_range: data.ageRange,
          referral_id: referralData.referralId,
          referred_by: referralData.referredBy,
        });

      if (error) {
        console.error('Error submitting interest:', error);
        throw error;
      }

      setReferralData(prev => ({
        ...prev,
        totalParents: prev.totalParents + 1,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error submitting interest:', error);
      return { success: false, error };
    }
  }, [referralData.referralId, referralData.referredBy]);

  return {
    ...referralData,
    isLoading,
    getReferralLink,
    trackShare,
    submitInterest,
  };
};
