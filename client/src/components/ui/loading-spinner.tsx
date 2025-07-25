import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

export default function LoadingSpinner({ 
  size = "md", 
  className,
  message 
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 
        className={cn(
          "animate-spin text-azure-blue",
          sizeClasses[size],
          className
        )}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-neutral-gray animate-pulse">
          {message}
        </p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}