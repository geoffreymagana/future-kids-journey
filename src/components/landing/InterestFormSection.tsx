import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { detectTrafficSource } from '@/utils/sourceDetection';
import childExploringImage from '@/assets/child-exploring.png';

const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  whatsapp: z.string().trim().min(10, "Please enter a valid WhatsApp number").max(15),
  ageRange: z.string().min(1, "Please select an age range"),
  numberOfKids: z.number().int().min(1).max(10).optional(),
  source: z.string().optional()
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
    numberOfKids: 1,
    source: ''
  });
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    let sid = sessionStorage.getItem('formSessionId');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('formSessionId', sid);
    }
    return sid;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect traffic source on component mount
  useEffect(() => {
    const detectedSource = detectTrafficSource().source;
    setFormData(prev => ({
      ...prev,
      source: detectedSource
    }));
  }, []);

  const checkDuplicateInSession = (whatsapp: string): boolean => {
    const recentSubmissions = sessionStorage.getItem('recentSubmissions');
    if (!recentSubmissions) return false;

    try {
      const submissions: Array<{ whatsapp: string; timestamp: number }> = JSON.parse(recentSubmissions);
      const now = Date.now();
      const oneMinuteAgo = now - 60000; // 1 minute in milliseconds

      // Check if the same WhatsApp number was submitted within the last minute
      return submissions.some(
        (submission) =>
          submission.whatsapp === whatsapp && submission.timestamp > oneMinuteAgo
      );
    } catch {
      return false;
    }
  };

  const storeSubmissionInSession = (whatsapp: string) => {
    const recentSubmissions = sessionStorage.getItem('recentSubmissions');
    let submissions: Array<{ whatsapp: string; timestamp: number }> = [];

    if (recentSubmissions) {
      try {
        submissions = JSON.parse(recentSubmissions);
      } catch {
        submissions = [];
      }
    }

    // Add the new submission
    submissions.push({
      whatsapp,
      timestamp: Date.now(),
    });

    // Keep only submissions from the last 2 minutes (to be safe)
    const twoMinutesAgo = Date.now() - 120000;
    submissions = submissions.filter((s) => s.timestamp > twoMinutesAgo);

    sessionStorage.setItem('recentSubmissions', JSON.stringify(submissions));
  };

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
      const response = await apiService.submitForm({
        name: result.data.name,
        whatsapp: result.data.whatsapp,
        ageRange: result.data.ageRange,
        numberOfKids: result.data.numberOfKids || 1,
        source: result.data.source || 'direct',
        sessionId: sessionId
      });

      if (response.success) {
        // Store submission ID for tracking shares
        if (response.data?.id) {
          sessionStorage.setItem('currentSubmissionId', response.data.id);
        }

        // Store the submission in session storage for duplicate detection
        storeSubmissionInSession(result.data.whatsapp);

        // Check if this was marked as duplicate by backend
        if (response.data?.isDuplicate) {
          toast.success('We already have your information! Your referral link is ready.');
        } else {
          toast.success('Registration successful! Thank you for your interest.');
        }

        onSubmit(result.data);
      } else {
        toast.error(response.message || 'Failed to submit form');
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id={id} className="section-padding bg-background pt-24 md:pt-32">
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
                Register for the Parent Workshop
              </h2>
              <p className="text-muted-foreground mb-8">
                A focused session designed for engaged parents. This is for understanding first.
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

                <div>
                  <Label htmlFor="numberOfKids" className="text-soft-navy font-medium">
                    How Many Kids? <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Select
                    value={formData.numberOfKids?.toString() || '1'}
                    onValueChange={(value) => setFormData({ ...formData, numberOfKids: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-2 h-12 bg-background border-border">
                      <SelectValue placeholder="Select number of kids" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'kid' : 'kids'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Reserve a Spot"}
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
