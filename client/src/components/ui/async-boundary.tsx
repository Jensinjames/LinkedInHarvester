import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "./error-boundary";
import LoadingSpinner from "./loading-spinner";
import ErrorFallback from "./error-fallback";

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  context?: string;
  resetKeys?: Array<string | number>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Combined Error + Suspense boundary for async components
 * Handles both loading states and error states in one component
 */
export default function AsyncBoundary({
  children,
  fallback,
  errorFallback,
  context = "component",
  resetKeys,
  onError,
  onReset
}: AsyncBoundaryProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" message="Loading..." />
    </div>
  );

  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      onReset={onReset}
      fallback={
        errorFallback || (
          <ErrorFallback
            error={new Error("Component failed to load")}
            context={context}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        )
      }
    >
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}