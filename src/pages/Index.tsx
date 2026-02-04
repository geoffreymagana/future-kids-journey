import { useState, useRef } from 'react';
import { TopNav } from '@/components/landing/TopNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { ParentProblemSection } from '@/components/landing/ParentProblemSection';
import { ApproachSection } from '@/components/landing/ApproachSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { InterestFormSection } from '@/components/landing/InterestFormSection';
import { ShareSection } from '@/components/landing/ShareSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { FloatingCTA } from '@/components/landing/FloatingCTA';
import { useReferral } from '@/hooks/useReferral';

const Index = () => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [parentName, setParentName] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  
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
    
    // Scroll to FAQ section
    setTimeout(() => {
      faqRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <TopNav />
      <HeroSection 
        onScrollToForm={scrollToForm} 
        onScrollToHowItWorks={scrollToHowItWorks}
      />
      
      <ParentProblemSection />
      
      <ApproachSection />
      
      <div ref={howItWorksRef}>
        <HowItWorksSection id="how-it-works" />
      </div>
      
      <SocialProofSection />
      
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
      
      <div ref={faqRef}>
        <FAQSection />
      </div>
      
      <Footer />
      
      {/* Floating CTA */}
      <FloatingCTA onScrollToForm={scrollToForm} />
    </main>
  );
};

export default Index;
