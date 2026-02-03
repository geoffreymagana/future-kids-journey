import { motion } from 'framer-motion';
import { Users, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SocialProofSectionProps {
  totalParents: number;
  totalShares: number;
}

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const incrementTime = (duration * 1000) / end;
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

export const SocialProofSection = ({ totalParents, totalShares }: SocialProofSectionProps) => {
  return (
    <section className="section-padding bg-soft-navy text-background">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Parents Are Taking Action
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-background/10 backdrop-blur-sm rounded-2xl p-8"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                <AnimatedCounter value={totalParents} />
              </div>
              <p className="text-lg text-background/80">
                Parents who have joined
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-background/10 backdrop-blur-sm rounded-2xl p-8"
            >
              <div className="w-16 h-16 bg-soft-purple/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-soft-purple" />
              </div>
              <div className="text-5xl md:text-6xl font-bold text-soft-purple mb-2">
                <AnimatedCounter value={totalShares} />
              </div>
              <p className="text-lg text-background/80">
                Parents who have shared this
              </p>
            </motion.div>
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-lg text-background/70 italic"
          >
            Parents are inviting other parents — because this matters.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
