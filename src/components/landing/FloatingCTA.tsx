import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingCTAProps {
  onScrollToForm: () => void;
}

export const FloatingCTA = ({ onScrollToForm }: FloatingCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past 80vh (roughly past hero)
      const scrollThreshold = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
        >
          {/* Scroll to top button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-muted text-muted-foreground shadow-card flex items-center justify-center hover:bg-muted/80 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
          
          {/* Main CTA */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="hero"
              size="lg"
              onClick={onScrollToForm}
              className="shadow-elevated"
            >
              Join Interest List
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
