import { motion } from 'framer-motion';
import { MessageCircle, Users, GraduationCap, Heart } from 'lucide-react';
import { WaveDivider } from './WaveDivider';

const steps = [
  {
    icon: MessageCircle,
    number: "01",
    title: "Express Interest",
    description: "Parent fills a simple form — just your name, WhatsApp, and child's age."
  },
  {
    icon: Users,
    number: "02",
    title: "Join a Short Session",
    description: "Parent joins a brief forum or introductory session to understand the approach."
  },
  {
    icon: GraduationCap,
    number: "03",
    title: "Child Begins Learning",
    description: "Child starts guided, age-appropriate learning with our structured program."
  },
  {
    icon: Heart,
    number: "04",
    title: "Join the Community",
    description: "Parent becomes part of a learning community of like-minded families."
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
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple, conversation-first approach to getting started.
          </p>
        </motion.div>
        
        <div className="relative">
          {/* Connection line - desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-background rounded-2xl shadow-card flex items-center justify-center mx-auto border-2 border-soft-purple/20">
                    <step.icon className="w-8 h-8 text-soft-purple" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-soft-navy mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
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
