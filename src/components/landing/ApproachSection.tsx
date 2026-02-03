import { motion } from 'framer-motion';
import { Zap, Brain, ShieldCheck } from 'lucide-react';
import parentChildImage from '@/assets/parent-child-learning.png';

const pillars = [
  {
    icon: Zap,
    title: "Early Advantage",
    description: "Start before it becomes stressful"
  },
  {
    icon: Brain,
    title: "Future-Ready Thinking",
    description: "Beyond exams"
  },
  {
    icon: ShieldCheck,
    title: "Safe Guidance",
    description: "Structured, age-appropriate learning"
  }
];

export const ApproachSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
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
              Guided exposure, not acceleration.
            </h2>
            
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
              We give parents the confidence to guide their children through 
              technology and AI — without being tech experts themselves.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
