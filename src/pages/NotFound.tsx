import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShoppingCart, Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        {/* Animated Cart Icon */}
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="p-6 bg-primary/10 rounded-full">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
        </div>

        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
            404
          </h1>
        </motion.div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-2">
          Looks like you took a wrong turn on your learning journey!
        </p>
        <p className="text-base text-muted-foreground mb-8">
          The page you're looking for doesn't exist, but our workshops do. Let's get you back on track.
        </p>

        {/* Navigation Hints */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8 border border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Lost? Try checking:
          </p>
          <ul className="text-left space-y-2 text-sm text-muted-foreground">
            <li>✓ The URL spelling</li>
            <li>✓ Use the navigation menu</li>
            <li>✓ Check back on the home page</li>
          </ul>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/#faq")}
            className="gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Visit FAQ
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground mt-8">
          Error Code: 404 | Attempted URL: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
