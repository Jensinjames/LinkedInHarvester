import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import PageTransition from "@/components/ui/page-transition";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("@/pages/dashboard"));
const AIAssistant = lazy(() => import("@/pages/ai-assistant"));
const Login = lazy(() => import("@/pages/login"));
const NavigationHeader = lazy(() => import("@/components/navigation-header"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Enhanced loading fallback
const PageFallback = () => (
  <div className="min-h-screen bg-bg-light flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-text-light animate-pulse">Loading...</p>
    </div>
  </div>
);

// Navigation fallback - lighter version
const NavFallback = () => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-azure-blue rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </header>
);

// Enhanced protected route with error boundaries
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-light">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return (
    <ErrorBoundary resetMessage="Return to Dashboard">
      <Suspense fallback={<PageFallback />}>
        <PageTransition>
          {children}
        </PageTransition>
      </Suspense>
    </ErrorBoundary>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  // Preload critical routes when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Preload dashboard and navigation components
      const preloadDashboard = () => import("@/pages/dashboard");
      const preloadNav = () => import("@/components/navigation-header");
      
      // Use requestIdleCallback for better performance
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          preloadDashboard();
          preloadNav();
        });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(() => {
          preloadDashboard();
          preloadNav();
        }, 100);
      }
    }
  }, [isAuthenticated]);
  
  return (
    <div className="min-h-screen bg-bg-light">
      {isAuthenticated && (
        <ErrorBoundary 
          resetMessage="Reload Navigation"
          fallback={<NavFallback />}
        >
          <Suspense fallback={<NavFallback />}>
            <NavigationHeader />
          </Suspense>
        </ErrorBoundary>
      )}
      
      <main className={isAuthenticated ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        <ErrorBoundary resetMessage="Go to Login">
          <Switch>
            <Route path="/login">
              <Suspense fallback={<PageFallback />}>
                <PageTransition>
                  <Login />
                </PageTransition>
              </Suspense>
            </Route>
            
            <Route path="/">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            
            <Route path="/ai-assistant">
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            </Route>
            
            <Route>
              <Suspense fallback={<PageFallback />}>
                <PageTransition>
                  <NotFound />
                </PageTransition>
              </Suspense>
            </Route>
          </Switch>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary resetMessage="Restart Application">
            <Toaster />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;