import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export const TopNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border"
    >
      <div className="container-wide flex items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo width={36} height={36} />
          <span className="font-semibold text-soft-navy hidden sm:inline">Future Kids Journey</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-sm text-muted-foreground hover:text-soft-navy transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-sm text-muted-foreground hover:text-soft-navy transition-colors"
          >
            Terms
          </Link>
        </div>

        {/* Mobile Hamburger Menu */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-soft-navy" />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="md:hidden border-t border-border bg-background"
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-soft-navy transition-colors px-2 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-soft-navy transition-colors px-2 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Terms
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};
