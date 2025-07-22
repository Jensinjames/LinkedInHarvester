import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { getUserFriendlyErrorMessage } from "@/lib/retry-utils";

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  showDetails?: boolean;
  context?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
    icon?: React.ReactNode;
  }>;
}

export default function ErrorFallback({
  error,
  resetError,
  showDetails = false,
  context = "application",
  actions = []
}: ErrorFallbackProps) {
  const errorInfo = getUserFriendlyErrorMessage(error);
  
  const defaultActions = [
    ...(resetError && errorInfo.retryable ? [{
      label: "Try Again",
      onClick: resetError,
      variant: "default" as const,
      icon: <RefreshCw className="w-4 h-4" />
    }] : []),
    {
      label: "Go Home",
      onClick: () => window.location.href = "/",
      variant: "outline" as const,
      icon: <Home className="w-4 h-4" />
    },
    {
      label: "Refresh Page",
      onClick: () => window.location.reload(),
      variant: "outline" as const,
      icon: <RefreshCw className="w-4 h-4" />
    }
  ];
  
  const allActions = [...actions, ...defaultActions];
  
  // Different styling based on error priority
  const priorityStyles = {
    critical: {
      borderColor: "border-red-200",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      titleColor: "text-red-900"
    },
    high: {
      borderColor: "border-orange-200", 
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      titleColor: "text-orange-900"
    },
    medium: {
      borderColor: "border-yellow-200",
      bgColor: "bg-yellow-50", 
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900"
    },
    low: {
      borderColor: "border-gray-200",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600", 
      titleColor: "text-gray-900"
    }
  };
  
  const styles = priorityStyles[errorInfo.priority];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-[400px] flex items-center justify-center p-4"
    >
      <Card className={`max-w-lg w-full ${styles.borderColor}`}>
        <CardContent className={`p-6 ${styles.bgColor}`}>
          <div className="text-center space-y-4">
            {/* Error Icon with Animation */}
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <AlertTriangle className={`w-16 h-16 ${styles.iconColor}`} />
            </motion.div>
            
            {/* Error Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className={`text-xl font-semibold ${styles.titleColor}`}>
                {errorInfo.title}
              </h2>
            </motion.div>
            
            {/* Error Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-700">
                {errorInfo.description}
              </p>
              {errorInfo.action && (
                <p className="text-sm text-gray-600 mt-2">
                  {errorInfo.action}
                </p>
              )}
              {context && (
                <p className="text-xs text-gray-500 mt-2">
                  Error in: {context}
                </p>
              )}
            </motion.div>
            
            {/* Error Details (Development) */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-left"
              >
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  <Bug className="w-4 h-4 inline mr-2" />
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                  {error.stack || error.message}
                </pre>
              </motion.details>
            )}
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 pt-4"
            >
              {allActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </motion.div>
            
            {/* Help Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <a
                href="/help"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Need help? Visit our support page
              </a>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}