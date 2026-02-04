import { useState, useEffect, useCallback } from 'react';

interface ReferralData {
  referralId: string;
  totalParents: number;
  totalShares: number;
  userShares: number;
}

const generateReferralId = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const useReferral = () => {
  const [referralData, setReferralData] = useState<ReferralData>({
    referralId: '',
    totalParents: 247,
    totalShares: 89,
    userShares: 0,
  });

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

    // Get stored counts
    const storedParents = localStorage.getItem('totalParents');
    const storedShares = localStorage.getItem('totalShares');
    const storedUserShares = localStorage.getItem('userShares');

    // If came from referral, increment parent count
    if (refParam && !localStorage.getItem('hasJoinedViaRef')) {
      localStorage.setItem('hasJoinedViaRef', 'true');
      const newTotal = (parseInt(storedParents || '247') + 1);
      localStorage.setItem('totalParents', newTotal.toString());
    }

    setReferralData({
      referralId: storedId,
      totalParents: parseInt(storedParents || '247'),
      totalShares: parseInt(storedShares || '89'),
      userShares: parseInt(storedUserShares || '0'),
    });
  }, []);

  const getReferralLink = useCallback(() => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?ref=${referralData.referralId}`;
  }, [referralData.referralId]);

  const trackShare = useCallback((platform: string) => {
    setReferralData(prev => {
      const newUserShares = prev.userShares + 1;
      const newTotalShares = prev.totalShares + 1;
      
      localStorage.setItem('userShares', newUserShares.toString());
      localStorage.setItem('totalShares', newTotalShares.toString());
      
      return {
        ...prev,
        userShares: newUserShares,
        totalShares: newTotalShares,
      };
    });

    console.log(`Share tracked: ${platform}`);
  }, []);

  const incrementParentCount = useCallback(() => {
    setReferralData(prev => {
      const newTotal = prev.totalParents + 1;
      localStorage.setItem('totalParents', newTotal.toString());
      return {
        ...prev,
        totalParents: newTotal,
      };
    });
  }, []);

  return {
    ...referralData,
    getReferralLink,
    trackShare,
    incrementParentCount,
  };
};
