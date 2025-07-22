// Enhanced error handling and retry utilities

export interface ErrorInfo {
  title: string;
  description: string;
  action?: string;
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  retryable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Map common errors to user-friendly messages
export function getUserFriendlyErrorMessage(error: Error): ErrorInfo {
  const message = error.message?.toLowerCase() || '';
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      title: 'Connection Problem',
      description: 'Unable to connect to our servers. Please check your internet connection.',
      action: 'Try again in a moment or refresh the page.',
      type: 'network',
      retryable: true,
      priority: 'high'
    };
  }
  
  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized') || message.includes('token')) {
    return {
      title: 'Authentication Required',
      description: 'Your session has expired or you\'re not logged in.',
      action: 'Please log in again to continue.',
      type: 'auth',
      retryable: false,
      priority: 'critical'
    };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('400')) {
    return {
      title: 'Invalid Input',
      description: 'There was a problem with the information provided.',
      action: 'Please check your input and try again.',
      type: 'validation',
      retryable: true,
      priority: 'medium'
    };
  }
  
  // Server errors
  if (message.includes('500') || message.includes('server') || message.includes('internal')) {
    return {
      title: 'Server Error',
      description: 'Something went wrong on our end. Our team has been notified.',
      action: 'Please try again later or contact support if the problem persists.',
      type: 'server',
      retryable: true,
      priority: 'high'
    };
  }
  
  // Rate limiting
  if (message.includes('429') || message.includes('rate limit') || message.includes('too many')) {
    return {
      title: 'Too Many Requests',
      description: 'You\'ve made too many requests. Please slow down.',
      action: 'Wait a moment before trying again.',
      type: 'server',
      retryable: true,
      priority: 'medium'
    };
  }
  
  // File upload errors
  if (message.includes('file') || message.includes('upload') || message.includes('size')) {
    return {
      title: 'File Upload Problem',
      description: 'There was an issue uploading your file.',
      action: 'Check the file size and format, then try again.',
      type: 'validation',
      retryable: true,
      priority: 'medium'
    };
  }
  
  // Default fallback
  return {
    title: 'Unexpected Error',
    description: 'Something unexpected happened. We apologize for the inconvenience.',
    action: 'Try refreshing the page or contact support if the problem continues.',
    type: 'unknown',
    retryable: true,
    priority: 'medium'
  };
}

// Retry function with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry non-retryable errors
      const errorInfo = getUserFriendlyErrorMessage(lastError);
      if (!errorInfo.retryable) {
        break;
      }
      
      // Call retry callback
      onRetry?.(attempt + 1, lastError);
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Debounce function for search and input
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = undefined;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Check if error is recoverable
export function isRecoverableError(error: Error): boolean {
  const errorInfo = getUserFriendlyErrorMessage(error);
  return errorInfo.retryable && errorInfo.type !== 'auth';
}

// Format error for logging
export function formatErrorForLogging(error: Error, context?: Record<string, any>) {
  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    context,
  };
}