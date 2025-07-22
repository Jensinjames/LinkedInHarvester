import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, XCircle, Info, Loader2 } from "lucide-react";

// Enhanced toast utilities with better UX
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 4000,
    className: "border-green-200 bg-green-50 text-green-900",
    action: (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ),
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 6000,
    variant: "destructive",
    action: (
      <XCircle className="h-5 w-5 text-red-600" />
    ),
  });
};

export const showWarningToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 5000,
    className: "border-orange-200 bg-orange-50 text-orange-900",
    action: (
      <AlertCircle className="h-5 w-5 text-orange-600" />
    ),
  });
};

export const showInfoToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 4000,
    className: "border-blue-200 bg-blue-50 text-blue-900",
    action: (
      <Info className="h-5 w-5 text-blue-600" />
    ),
  });
};

export const showLoadingToast = (title: string, description?: string) => {
  return toast({
    title,
    description,
    duration: Infinity, // Keep until dismissed
    className: "border-gray-200 bg-gray-50 text-gray-900",
    action: (
      <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
    ),
  });
};

// Progress toast that updates
export const createProgressToast = (title: string) => {
  let progress = 0;
  let toastId: any;

  const updateProgress = (newProgress: number, description?: string) => {
    progress = Math.min(100, Math.max(0, newProgress));
    
    if (toastId) {
      toastId.dismiss();
    }

    toastId = toast({
      title: `${title} (${progress}%)`,
      description: description || `${progress}% complete`,
      duration: progress >= 100 ? 3000 : Infinity,
      className: progress >= 100 ? "border-green-200 bg-green-50 text-green-900" : "border-blue-200 bg-blue-50 text-blue-900",
      action: progress >= 100 ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ),
    });

    return toastId;
  };

  return { updateProgress, dismiss: () => toastId?.dismiss() };
};