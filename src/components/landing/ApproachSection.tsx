import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, Brain, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import parentChildImage from '@/assets/parent-child-learning.png';
import { WaveDivider } from './WaveDivider';

const pillars = [
  {
    icon: Zap,
    title: "Curiosity",
    description: "Children are guided to ask questions and explore naturally"
  },
  {
    icon: Brain,
    title: "Logical Thinking",
    description: "Problem-solving skills built through guided exploration"
  },
  {
    icon: ShieldCheck,
    title: "Comfort with Technology",
    description: "Steady, age-appropriate exposure without pressure"
  }
];

export const ApproachSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={sectionRef} className="relative section-padding bg-background pt-24 md:pt-32">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image with parallax */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            style={{ y: imageY }}
            className="order-2 lg:order-1"
          >
            <img
              src={parentChildImage}
              alt="Parent and child learning together"
              className="w-full max-w-md mx-auto lg:mx-0 rounded-3xl shadow-elevated"
            />
          </motion.div>
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-soft-navy mb-8">
              A guided approach to early technology and AI learning
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Children do not need to be rushed into advanced tools or complex systems.
              They benefit most from guided exposure that builds:
            </p>
            
            <div className="space-y-6 mb-8">
              {pillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <pillar.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-soft-navy mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <p className="text-lg text-muted-foreground">
              In our approach to early learning, we emphasise understanding, exploration, and steady development 
              rather than acceleration. The goal is not to replace school learning, but to complement it thoughtfully.
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Wave divider */}
      <WaveDivider fillColor="hsl(var(--muted))" />
    </section>
  );
};
