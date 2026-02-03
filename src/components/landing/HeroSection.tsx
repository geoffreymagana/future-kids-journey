import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useRef } from 'react';
import heroImage from '@/assets/hero-children.png';
import { WaveDivider } from './WaveDivider';

interface HeroSectionProps {
  onScrollToForm: () => void;
  onScrollToHowItWorks: () => void;
}

export const HeroSection = ({ onScrollToForm, onScrollToHowItWorks }: HeroSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const decorativeY1 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const decorativeY2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden gradient-hero-bg">
      {/* Decorative circles with parallax */}
      <motion.div 
        style={{ y: decorativeY1 }}
        className="absolute top-20 right-10 w-64 h-64 rounded-full bg-soft-purple/10 blur-3xl" 
      />
      <motion.div 
        style={{ y: decorativeY2 }}
        className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-primary/10 blur-3xl" 
      />
      
      <div className="container-wide section-padding relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-soft-navy leading-tight mb-6"
            >
              Prepare your child for the future —{' '}
              <span className="text-soft-purple">calmly, early, and confidently.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              School teaches subjects. We help children build confidence with technology, 
              problem-solving, and AI thinking — at the right age, without pressure.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button 
                variant="hero" 
                size="xl"
                onClick={onScrollToForm}
              >
                Join the Parent Interest List
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl"
                onClick={onScrollToHowItWorks}
              >
                See how it works
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Hero Image with parallax */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ y: imageY }}
            className="relative"
          >
            <div className="relative">
              <motion.img
                src={heroImage}
                alt="Children learning together"
                className="w-full h-auto rounded-3xl shadow-elevated"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Decorative badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-card font-semibold text-sm"
              >
                Ages 5-14
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-8 w-8" />
        </motion.div>
      </motion.div>
      
      {/* Wave divider */}
      <WaveDivider fillColor="hsl(var(--muted))" />
    </section>
  );
};
