import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-soft-navy text-background py-12 px-4">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            Future-Ready Kids
          </h3>
          <p className="text-background/70 mb-6 max-w-lg mx-auto">
            Helping parents prepare their children for a technology-driven future — 
            with confidence, care, and the right guidance.
          </p>
          
          <a
            href="https://wa.me/254700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            Contact us on WhatsApp
          </a>
          
          <div className="mt-8 pt-8 border-t border-background/10">
            <p className="text-sm text-background/50">
              In collaboration with trusted learning partners
            </p>
            <p className="text-xs text-background/30 mt-4">
              © {new Date().getFullYear()} Future-Ready Kids. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
