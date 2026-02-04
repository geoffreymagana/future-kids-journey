import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FlipCounterProps {
  value: number;
  duration?: number;
}

export const FlipCounter = ({ value, duration = 0.6 }: FlipCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      setDisplayValue(Math.floor(startValue + diff * easeOutQuad));

      if (progress === 1) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, displayValue]);

  return (
    <motion.span
      key={displayValue}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-block"
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
};
