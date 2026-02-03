import { useState, useRef } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { ParentProblemSection } from '@/components/landing/ParentProblemSection';
import { ApproachSection } from '@/components/landing/ApproachSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { InterestFormSection } from '@/components/landing/InterestFormSection';
import { ShareSection } from '@/components/landing/ShareSection';
import { Footer } from '@/components/landing/Footer';
import { useReferral } from '@/hooks/useReferral';

const Index = () => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [parentName, setParentName] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  const {
    totalParents,
    totalShares,
    userShares,
    getReferralLink,
    trackShare,
    incrementParentCount,
  } = useReferral();

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = (data: { name: string; whatsapp: string; ageRange: string }) => {
    setParentName(data.name);
    setHasSubmitted(true);
    incrementParentCount();
    
    // Scroll to share section
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-background">
      <HeroSection 
        onScrollToForm={scrollToForm} 
        onScrollToHowItWorks={scrollToHowItWorks}
      />
      
      <ParentProblemSection />
      
      <ApproachSection />
      
      <div ref={howItWorksRef}>
        <HowItWorksSection id="how-it-works" />
      </div>
      
      <SocialProofSection 
        totalParents={totalParents} 
        totalShares={totalShares} 
      />
      
      <div ref={formRef}>
        {!hasSubmitted ? (
          <InterestFormSection 
            id="interest-form" 
            onSubmit={handleFormSubmit}
          />
        ) : (
          <ShareSection
            parentName={parentName}
            referralLink={getReferralLink()}
            userShares={userShares}
            onShare={trackShare}
          />
        )}
      </div>
      
      <Footer />
    </main>
  );
};

export default Index;
