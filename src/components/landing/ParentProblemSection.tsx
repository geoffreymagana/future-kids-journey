import { motion, useScroll, useTransform } from 'framer-motion';
import { BookOpen, Brain, Shield } from 'lucide-react';
import { useRef } from 'react';
import { WaveDivider } from './WaveDivider';

const problems = [
  {
    icon: BookOpen,
    title: "Confidence when engaging with new ideas",
    description: "Children develop self-assurance in exploring unfamiliar concepts"
  },
  {
    icon: Brain,
    title: "Problem-solving and reasoning skills",
    description: "Critical thinking becomes natural, not forced"
  },
  {
    icon: Shield,
    title: "Curiosity without anxiety",
    description: "Learning is introduced as a process, not a performance"
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
            We are preparing children for a future we have not yet seen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            The world children will grow into will look very different from the one their parents grew up in.
            Technology and artificial intelligence are already shaping how people learn, work, and solve problems.
          </p>
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
              className="bg-background rounded-2xl p-8 shadow-card text-left hover:shadow-elevated transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-soft-purple/10 rounded-xl flex items-center justify-center mb-4">
                <problem.icon className="w-7 h-7 text-soft-purple" />
              </div>
              <h3 className="text-lg font-semibold text-soft-navy mb-2">
                {problem.title}
              </h3>
              <p className="text-muted-foreground">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Our focus is not on predicting the future, but on helping children develop the confidence 
          and thinking skills they will need to navigate it. This workshop helps parents understand what 
          that preparation can look like, starting early and done well.
        </motion.p>
      </div>
      
      {/* Wave divider */}
      <WaveDivider fillColor="hsl(var(--background))" />
    </section>
  );
};
