import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const contacts = [
  {
    city: 'Meru',
    country: 'Kenya',
    address: 'Luxe Apartments, Meru, 60200',
    whatsapp: '+254 708 788 026',
    email: 'info@edcet.co.ke',
    icon: MapPin
  }
];

export const Footer = () => {
  return (
    <footer className="bg-soft-navy text-background py-16 px-4">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-bold mb-4">
            Our Vision
          </h3>
          <p className="text-background/80 max-w-lg mx-auto">
            To support a generation of children who are confident, curious, and prepared to engage 
            thoughtfully with a technology-driven world.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-bold mb-4">
            Our Mission
          </h3>
          <p className="text-background/80 max-w-lg mx-auto">
            To guide parents and children through early exposure to technology and AI thinking in a 
            responsible, structured, and age-appropriate way that complements formal education.
          </p>
        </motion.div>

        {/* Contact Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-center mb-8">
            Reach us in your region
          </h3>
          <div className="max-w-2xl mx-auto">
            {contacts.map((contact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background/5 rounded-lg p-8 text-center"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <h4 className="font-semibold">{contact.city}, {contact.country}</h4>
                      <p className="text-sm text-background/70">{contact.address}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[\s+]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {contact.whatsapp}
                    </a>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center justify-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="text-center border-t border-background/10 pt-8">
          <a
            href="https://wa.me/254700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium mb-8"
          >
            <MessageCircle className="w-5 h-5" />
            Contact us on WhatsApp
          </a>

          {/* Legal Links */}
          <div className="mb-8 flex flex-col md:flex-row justify-center gap-6">
            <a href="/privacy" className="text-sm text-background/70 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-background/70 hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="/child-protection" className="text-sm text-background/70 hover:text-primary transition-colors">
              Child Protection Policy
            </a>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-background/50">
              In collaboration with trusted learning partners
            </p>
            <p className="text-xs text-background/30 mt-4">
              © {new Date().getFullYear()} Future-Ready Kids. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
