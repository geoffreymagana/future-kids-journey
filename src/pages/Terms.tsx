import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
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
            <h1 className="text-4xl font-bold mb-8 text-soft-navy">Terms of Service</h1>

            <p className="text-lg text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">2. Use License</h2>
              <p className="text-muted-foreground mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on Future-Ready Kids' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">3. Disclaimer</h2>
              <p className="text-muted-foreground mb-4">
                The materials on Future-Ready Kids' website are provided on an 'as is' basis. Future-Ready Kids makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">4. Limitations</h2>
              <p className="text-muted-foreground mb-4">
                In no event shall Future-Ready Kids or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Future-Ready Kids' website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">5. Accuracy of Materials</h2>
              <p className="text-muted-foreground mb-4">
                The materials appearing on Future-Ready Kids' website could include technical, typographical, or photographic errors. Future-Ready Kids does not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">6. Links</h2>
              <p className="text-muted-foreground mb-4">
                Future-Ready Kids has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Future-Ready Kids of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">7. Modifications</h2>
              <p className="text-muted-foreground mb-4">
                Future-Ready Kids may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">8. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These terms and conditions are governed by and construed in accordance with the laws of Kenya, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-soft-navy mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold text-soft-navy">Future-Ready Kids</p>
                <p className="text-muted-foreground">Luxe Apartments, Meru, 60200, Kenya</p>
                <p className="text-muted-foreground">Email: info@edcet.co.ke</p>
                <p className="text-muted-foreground">Phone: +254 708 788 026</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
