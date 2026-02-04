import { useState, useRef } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { ParentProblemSection } from '@/components/landing/ParentProblemSection';
import { ApproachSection } from '@/components/landing/ApproachSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { InterestFormSection } from '@/components/landing/InterestFormSection';
import { ShareSection } from '@/components/landing/ShareSection';
import { Footer } from '@/components/landing/Footer';
import { FloatingCTA } from '@/components/landing/FloatingCTA';
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
    submitInterest,
  } = useReferral();

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = async (data: { name: string; whatsapp: string; ageRange: string }) => {
    const result = await submitInterest(data);
    if (result.success) {
      setParentName(data.name);
      setHasSubmitted(true);
      
      // Scroll to share section
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
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
      
      {/* Floating CTA */}
      <FloatingCTA onScrollToForm={scrollToForm} />
    </main>
  );
};

export default Index;
