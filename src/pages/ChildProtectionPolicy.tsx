import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const ChildProtectionPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container-wide mx-auto px-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container-narrow mx-auto max-w-4xl"
        >
          <div className="prose prose-invert max-w-none dark:prose-invert">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-soft-navy" />
              <h1 className="text-4xl font-bold text-soft-navy m-0">Child Protection Policy</h1>
            </div>

            <p className="text-lg text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">1. Our Commitment</h2>
              <p className="text-muted-foreground mb-4">
                Future-Ready Kids is deeply committed to safeguarding the welfare and safety of children. We recognize that children have fundamental rights and deserve protection from harm. This policy outlines our commitment to creating a safe, inclusive, and protective environment for all children who interact with our organization.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">2. Scope</h2>
              <p className="text-muted-foreground mb-4">
                This policy applies to all staff, volunteers, contractors, partners, and stakeholders who come into contact with children through our programs and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">3. Core Principles</h2>
              <p className="text-muted-foreground mb-4">Our child protection is founded on the following core principles:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Best Interests of the Child:</strong> All decisions prioritize the child's wellbeing and welfare</li>
                <li><strong>Prevention:</strong> We implement preventive measures to minimize risks to children</li>
                <li><strong>Accountability:</strong> We maintain transparent and accountable systems</li>
                <li><strong>Zero Tolerance:</strong> We have zero tolerance for child abuse, exploitation, or neglect</li>
                <li><strong>Child-Centred:</strong> We empower children and listen to their voices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">4. Data Collection and Privacy</h2>
              <p className="text-muted-foreground mb-4">
                We collect only essential information about children and their families for program delivery. All personal data is:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Collected with explicit parental/guardian consent</li>
                <li>Stored securely with restricted access</li>
                <li>Protected with appropriate safeguards against unauthorized disclosure</li>
                <li>Retained only for as long as necessary</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">5. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">The following behaviors are strictly prohibited:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Physical, sexual, emotional, or psychological abuse</li>
                <li>Exploitation or trafficking of children</li>
                <li>Neglect or failure to provide basic needs</li>
                <li>Inappropriate contact or communication with children</li>
                <li>Sharing of personal information without consent</li>
                <li>Discrimination or bullying based on any characteristic</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">6. Reporting and Investigation</h2>
              <p className="text-muted-foreground mb-4">
                Anyone who becomes aware of child abuse, exploitation, or a violation of this policy must report it immediately to our safeguarding team. All reports will be:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Treated seriously and confidentially</li>
                <li>Investigated thoroughly and promptly</li>
                <li>Reported to relevant authorities as required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">7. Staff Training and Recruitment</h2>
              <p className="text-muted-foreground mb-4">
                We ensure all staff and volunteers receive training on child protection policies and procedures. New staff undergo appropriate vetting, background checks, and reference verification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">8. Digital Safety</h2>
              <p className="text-muted-foreground mb-4">
                We protect children's online safety by:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Obtaining consent before collecting any digital information</li>
                <li>Not publishing identifying information about children without consent</li>
                <li>Using secure platforms for communications</li>
                <li>Monitoring and restricting age-inappropriate content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">9. Continuous Improvement</h2>
              <p className="text-muted-foreground mb-4">
                This policy is regularly reviewed and updated to reflect best practices and changing circumstances. We welcome feedback and suggestions for improvement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">10. Contact and Support</h2>
              <p className="text-muted-foreground mb-4">
                For concerns regarding child protection or to report a violation, please contact:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold text-soft-navy">Future-Ready Kids - Safeguarding Team</p>
                <p className="text-muted-foreground">Luxe Apartments, Meru, 60200, Kenya</p>
                <p className="text-muted-foreground">Email: safeguarding@edcet.co.ke</p>
                <p className="text-muted-foreground">Phone: +254 708 788 026</p>
                <p className="text-muted-foreground mt-4 text-sm italic">
                  In case of emergency, please contact local authorities immediately.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChildProtectionPolicy;
