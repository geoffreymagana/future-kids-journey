import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef, RefObject } from 'react';

interface UseParallaxOptions {
  offset?: number;
  direction?: 'up' | 'down';
}

interface UseParallaxReturn {
  ref: RefObject<HTMLDivElement>;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
}

export const useParallax = ({ 
  offset = 50, 
  direction = 'up' 
}: UseParallaxOptions = {}): UseParallaxReturn => {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' ? [offset, -offset] : [-offset, offset]
  );
  
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.6, 1, 1, 0.6]
  );

  return { ref: ref as RefObject<HTMLDivElement>, y, opacity };
};
