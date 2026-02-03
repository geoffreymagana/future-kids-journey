import { motion, useScroll, useTransform } from 'framer-motion';
import { BookOpen, HelpCircle, Shield } from 'lucide-react';
import { useRef } from 'react';
import { WaveDivider } from './WaveDivider';

const problems = [
  {
    icon: BookOpen,
    text: "The curriculum feels outdated"
  },
  {
    icon: HelpCircle,
    text: "I don't know how to prepare my child"
  },
  {
    icon: Shield,
    text: "I want early exposure, not pressure"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const ParentProblemSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const cardsY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section ref={sectionRef} className="relative section-padding bg-muted pt-24 md:pt-32">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-soft-navy mb-4">
            Most parents feel unsure — not careless.
          </h2>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          style={{ y: cardsY }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-background rounded-2xl p-8 shadow-card text-center hover:shadow-elevated transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-soft-purple/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <problem.icon className="w-7 h-7 text-soft-purple" />
              </div>
              <p className="text-lg font-medium text-soft-navy">
                "{problem.text}"
              </p>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-xl text-muted-foreground font-medium"
        >
          You're not alone. And you don't need to panic.
        </motion.p>
      </div>
      
      {/* Wave divider */}
      <WaveDivider fillColor="hsl(var(--background))" />
    </section>
  );
};
