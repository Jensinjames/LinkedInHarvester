import { useCallback, useState } from "react";
import { retryWithBackoff, getUserFriendlyErrorMessage } from "@/lib/retry-utils";
import { showErrorToast, showLoadingToast } from "@/components/ui/toast-variants";

interface UseErrorRecoveryOptions {
  maxRetries?: number;
  showToasts?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    showToasts = true,
    onSuccess,
    onError
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);

    let loadingToast: any;
    if (showToasts && retryCount > 0) {
      loadingToast = showLoadingToast(
        "Retrying...",
        `Attempt ${retryCount + 1} of ${maxRetries + 1}`
      );
    }

    try {
      const result = await retryWithBackoff(operation, {
        maxRetries,
        onRetry: (attempt, error) => {
          setRetryCount(attempt);
          if (showToasts) {
            const errorInfo = getUserFriendlyErrorMessage(error);
            console.warn(`Retry ${attempt}/${maxRetries} for ${context || 'operation'}:`, errorInfo.title);
          }
        }
      });

      if (loadingToast) {
        loadingToast.dismiss();
      }

      setIsRetrying(false);
      setRetryCount(0);
      onSuccess?.();
      
      return result;
    } catch (error) {
      if (loadingToast) {
        loadingToast.dismiss();
      }

      setIsRetrying(false);
      
      const typedError = error as Error;
      const errorInfo = getUserFriendlyErrorMessage(typedError);
      
      if (showToasts) {
        showErrorToast(
          errorInfo.title,
          `${errorInfo.description} ${context ? `(${context})` : ''}`
        );
      }
      
      onError?.(typedError);
      throw typedError;
    }
  }, [maxRetries, showToasts, onSuccess, onError, retryCount]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    executeWithRecovery,
    isRetrying,
    retryCount,
    reset
  };
}