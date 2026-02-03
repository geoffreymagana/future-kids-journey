import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import childExploringImage from '@/assets/child-exploring.png';

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  whatsapp: z.string().trim().min(10, "Please enter a valid WhatsApp number").max(15),
  ageRange: z.string().min(1, "Please select an age range"),
});

type FormData = z.infer<typeof formSchema>;

interface InterestFormSectionProps {
  id: string;
  onSubmit: (data: FormData) => void;
}

export const InterestFormSection = ({ id, onSubmit }: InterestFormSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    ageRange: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = formSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 800));
      onSubmit(result.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id={id} className="section-padding bg-background">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="bg-muted rounded-3xl p-8 md:p-10 shadow-card">
              <h2 className="text-2xl md:text-3xl font-bold text-soft-navy mb-2">
                Join the Parent Interest List
              </h2>
              <p className="text-muted-foreground mb-8">
                No spam. Just a calm conversation.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-soft-navy font-medium">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 h-12 bg-background border-border focus:ring-primary"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="whatsapp" className="text-soft-navy font-medium">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="e.g. +254 712 345 678"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="mt-2 h-12 bg-background border-border focus:ring-primary"
                  />
                  {errors.whatsapp && (
                    <p className="text-destructive text-sm mt-1">{errors.whatsapp}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-soft-navy font-medium">
                    Child's Age Range
                  </Label>
                  <Select
                    value={formData.ageRange}
                    onValueChange={(value) => setFormData({ ...formData, ageRange: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 bg-background border-border">
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-7">5-7 years</SelectItem>
                      <SelectItem value="8-10">8-10 years</SelectItem>
                      <SelectItem value="11-14">11-14 years</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.ageRange && (
                    <p className="text-destructive text-sm mt-1">{errors.ageRange}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "I'm Interested"}
                </Button>
              </form>
            </div>
          </motion.div>
          
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2 text-center"
          >
            <img
              src={childExploringImage}
              alt="Child exploring and learning"
              className="w-full max-w-sm mx-auto rounded-3xl shadow-elevated"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <h3 className="text-2xl font-bold text-soft-navy mb-2">
                Curiosity is the starting point.
              </h3>
              <p className="text-muted-foreground">
                We nurture it with structure and care.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
