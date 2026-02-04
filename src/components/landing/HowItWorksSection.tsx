import { motion } from 'framer-motion';
import { MessageCircle, Users, GraduationCap, Heart } from 'lucide-react';
import { WaveDivider } from './WaveDivider';

const steps = [
  {
    icon: MessageCircle,
    number: "01",
    title: "Explain the Philosophy",
    description: "We explain the learning philosophy and structure for future-ready development."
  },
  {
    icon: Users,
    number: "02",
    title: "Walk Through the Approach",
    description: "See how children are guided at different stages, age by age."
  },
  {
    icon: GraduationCap,
    number: "03",
    title: "Answer Your Questions",
    description: "We respond to real parent questions about implementation and outcomes."
  },
  {
    icon: Heart,
    number: "04",
    title: "Next Steps",
    description: "Interested parents can choose to explore the program further, no pressure."
  }
];

export const HowItWorksSection = ({ id }: { id: string }) => {
  return (
    <section id={id} className="relative section-padding bg-muted pt-24 md:pt-32">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-soft-navy mb-4">
            How the workshop works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A short, focused session designed for engaged parents who want clarity and understanding.
          </p>
        </motion.div>
        
        <div className="relative">
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="relative"
              >
                {/* Connector line to next step - desktop only */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-1 bg-gradient-to-r from-soft-purple/50 to-transparent -translate-y-1/2 z-0" style={{ width: 'calc(100% + 2rem)' }} />
                )}

                {/* Step circle and content */}
                <div className="text-center relative z-12">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-background rounded-2xl shadow-card flex items-center justify-center mx-auto border-2 border-soft-purple/20 relative z-10">
                      <step.icon className="w-8 h-8 text-soft-purple" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-card z-20">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-soft-navy mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Wave divider */}
      <WaveDivider fillColor="hsl(var(--soft-navy))" />
    </section>
  );
};
