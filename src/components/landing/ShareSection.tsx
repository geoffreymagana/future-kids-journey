import { Button } from '@/components/ui/button';
import { Check, Copy, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebook,
  faWhatsapp,
  faSquareXTwitter,
  faTelegram,
  faReddit,
  faLinkedin,
  faInstagram
} from '@fortawesome/free-brands-svg-icons';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import shareLinkImage from '@/assets/share_link.png';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ShareSectionProps {
  parentName: string;
  referralLink: string;
  userShares?: number;
  onShare?: (platform: string) => void;
}

interface RecentParent {
  _id: string;
  parentName: string;
  submittedAt: string;
}

export const ShareSection = ({ parentName, referralLink, userShares = 0, onShare }: ShareSectionProps) => {
  const [copied, setCopied] = useState(false);
  const [recentParents, setRecentParents] = useState<RecentParent[]>([]);
  const [currentParentIndex, setCurrentParentIndex] = useState(0);

  // Fetch recently joined parents
  useEffect(() => {
    const fetchRecentParents = async () => {
      try {
        const submissionResponse = await apiService.request<{ submissions: RecentParent[] }>(
          'GET',
          '/forms/recent?limit=5'
        );
        
        if (submissionResponse.success && submissionResponse.data?.submissions) {
          setRecentParents(submissionResponse.data.submissions);
        }
      } catch (error) {
        console.error('Failed to fetch recent parents:', error);
      }
    };

    fetchRecentParents();
  }, []);

  // Rotating animation for rolling credits
  useEffect(() => {
    if (recentParents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentParentIndex((prev) => (prev + 1) % recentParents.length);
    }, 4000); // 4 seconds per parent (1s fade in + 2s display + 1s fade out)

    return () => clearInterval(interval);
  }, [recentParents.length]);

  // Centralized share tracking function
  const trackShare = async (platform: string) => {
    onShare?.(platform);

    try {
      const submissionId = sessionStorage.getItem('currentSubmissionId');
      if (!submissionId) return;

      await apiService.recordShare(submissionId, platform);
    } catch (error) {
      console.error(`Failed to track ${platform} share:`, error);
    }
  };

  const shareMessage = encodeURIComponent(
    `I just joined a program to help prepare my child for the future with AI and technology thinking. Check it out: ${referralLink}`
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      await trackShare('copy');

      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    trackShare('whatsapp');
    window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
  };

  const handleFacebookShare = () => {
    trackShare('facebook');
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleTwitterShare = () => {
    trackShare('twitter');
    const text = encodeURIComponent('I just joined a program preparing children for the future with AI.');
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleLinkedInShare = () => {
    trackShare('linkedin');
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleTelegramShare = () => {
    trackShare('telegram');
    const text = encodeURIComponent('Check this out!');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const handleRedditShare = () => {
    trackShare('reddit');
    const title = encodeURIComponent('A program for children and AI literacy');
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(referralLink)}&title=${title}`, '_blank');
  };

  const handleInstagramShare = async () => {
    await handleCopyLink();
    toast("Instagram doesn't support direct sharing. Paste the link in your story!");
  };

  return (
    <section className="section-padding bg-muted">
      <div className="container-narrow">
        <div className="bg-background rounded-3xl p-8 md:p-12 shadow-elevated">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>

          {/* Thank You Text */}
          <h2 className="text-3xl md:text-4xl font-bold text-soft-navy text-center mb-2">
            Thank you, {parentName}!
          </h2>

          {/* Share Modal */}
          <div className="bg-muted rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto mt-12">
            {/* Link Icon - Image */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm overflow-hidden">
              <img src={shareLinkImage} alt="Share Link" className="w-8 h-8" />
            </div>

            {/* Share Heading */}
            <h3 className="text-2xl md:text-3xl font-bold text-soft-navy mb-2">
              Share with Friends
            </h3>
            <p className="text-base text-muted-foreground mb-6">
              Learning is more effective when you connect with friends!
            </p>

            {/* Recently Joined Parents - Rolling Credits Animation (one at a time) */}
            {recentParents.length > 0 && (
              <div className="mb-8 h-12 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentParentIndex}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{
                      duration: 0.6,
                      ease: 'easeOut'
                    }}
                    className="text-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">{recentParents[currentParentIndex].parentName}</span>
                      <span> just joined!</span>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Share Your Link */}
            <div className="mb-8 text-left">
              <label className="text-sm font-semibold text-soft-navy mb-3 block">
                Share your link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono text-muted-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onClick={handleCopyLink}
                />
                <Button
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Share To Section - Mobile & Desktop Responsive */}
            <div className="text-left">
              <p className="text-sm font-semibold text-soft-navy mb-4">
                Share to
              </p>
              
              {/* Desktop View - All icons in one row */}
              <div className="hidden md:flex gap-3 flex-wrap justify-center md:justify-start">
                {/* Facebook */}
                <button
                  onClick={handleFacebookShare}
                  className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on Facebook"
                >
                  <FontAwesomeIcon icon={faFacebook} className="text-lg" />
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on WhatsApp"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />
                </button>

                {/* LinkedIn */}
                <button
                  onClick={handleLinkedInShare}
                  className="w-10 h-10 bg-[#0A66C2] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on LinkedIn"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="text-lg" />
                </button>

                {/* Twitter/X */}
                <button
                  onClick={handleTwitterShare}
                  className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on Twitter"
                >
                  <FontAwesomeIcon icon={faSquareXTwitter} className="text-lg" />
                </button>

                {/* Telegram */}
                <button
                  onClick={handleTelegramShare}
                  className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on Telegram"
                >
                  <FontAwesomeIcon icon={faTelegram} className="text-lg" />
                </button>

                {/* Reddit */}
                <button
                  onClick={handleRedditShare}
                  className="w-10 h-10 bg-[#FF4500] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on Reddit"
                >
                  <FontAwesomeIcon icon={faReddit} className="text-lg" />
                </button>

                {/* Instagram */}
                <button
                  onClick={handleInstagramShare}
                  className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Share on Instagram"
                >
                  <FontAwesomeIcon icon={faInstagram} className="text-lg" />
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 bg-soft-navy rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  title="Copy Link"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile View - 3 icons + More button */}
              <div className="md:hidden flex gap-3 justify-center items-center">
                {/* Facebook */}
                <button
                  onClick={handleFacebookShare}
                  className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
                  title="Share on Facebook"
                >
                  <FontAwesomeIcon icon={faFacebook} className="text-xl" />
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
                  title="Share on WhatsApp"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
                </button>

                {/* LinkedIn */}
                <button
                  onClick={handleLinkedInShare}
                  className="w-12 h-12 bg-[#0A66C2] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
                  title="Share on LinkedIn"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="text-xl" />
                </button>

                {/* More Button with Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-soft-navy hover:scale-105 transition-transform">
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-3">
                    <div className="flex flex-wrap gap-3 justify-center">
                      {/* Twitter/X */}
                      <button
                        onClick={handleTwitterShare}
                        className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                        title="Share on Twitter"
                      >
                        <FontAwesomeIcon icon={faSquareXTwitter} className="text-lg" />
                      </button>

                      {/* Telegram */}
                      <button
                        onClick={handleTelegramShare}
                        className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                        title="Share on Telegram"
                      >
                        <FontAwesomeIcon icon={faTelegram} className="text-lg" />
                      </button>

                      {/* Reddit */}
                      <button
                        onClick={handleRedditShare}
                        className="w-10 h-10 bg-[#FF4500] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                        title="Share on Reddit"
                      >
                        <FontAwesomeIcon icon={faReddit} className="text-lg" />
                      </button>

                      {/* Instagram */}
                      <button
                        onClick={handleInstagramShare}
                        className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                        title="Share on Instagram"
                      >
                        <FontAwesomeIcon icon={faInstagram} className="text-lg" />
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={handleCopyLink}
                        className="w-10 h-10 bg-soft-navy rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                        title="Copy Link"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Shares Count */}
          {userShares > 0 && (
            <p className="text-center mt-8 text-muted-foreground">
              You've helped <span className="font-semibold text-soft-navy">{userShares}</span> other parent{userShares !== 1 ? 's' : ''} discover this.
            </p>
          )}
        </div>
      </div>

    </section>
  );
};

export default ShareSection;
