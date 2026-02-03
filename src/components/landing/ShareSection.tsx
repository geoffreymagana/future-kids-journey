import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareSectionProps {
  parentName: string;
  referralLink: string;
  userShares: number;
  onShare: (platform: string) => void;
}

export const ShareSection = ({ parentName, referralLink, userShares, onShare }: ShareSectionProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareMessage = encodeURIComponent(
    `I just joined a program to help prepare my child for the future with AI and technology thinking. No pressure, just guided learning. Check it out: ${referralLink}`
  );
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      onShare('copy');
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  };
  
  const handleWhatsAppShare = () => {
    onShare('whatsapp');
    window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
  };
  
  const handleWhatsAppStatus = () => {
    onShare('whatsapp-status');
    // WhatsApp status sharing - opens WhatsApp with the message
    window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
    toast.info('Share this message to your WhatsApp Status!');
  };

  return (
    <section className="section-padding bg-muted">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-background rounded-3xl p-8 md:p-12 shadow-elevated text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-primary" />
          </motion.div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-soft-navy mb-2">
            Thank you, {parentName}!
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Many parents are sharing this with friends they trust.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Button
              variant="whatsapp"
              size="lg"
              className="w-full"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Share via WhatsApp
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copy Link
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleWhatsAppStatus}
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share to Status
            </Button>
          </div>
          
          {userShares > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground"
            >
              You've helped <span className="font-semibold text-soft-navy">{userShares}</span> other parent{userShares !== 1 ? 's' : ''} discover this.
            </motion.p>
          )}
          
          <div className="mt-8 p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-2">Your personal referral link:</p>
            <code className="text-xs bg-background px-3 py-2 rounded-lg block overflow-x-auto">
              {referralLink}
            </code>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
