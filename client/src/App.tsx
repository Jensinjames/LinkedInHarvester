import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Dashboard from "@/pages/dashboard";
import AIAssistant from "@/pages/ai-assistant";
import NavigationHeader from "@/components/navigation-header";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-bg-light">
      <NavigationHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/ai-assistant" component={AIAssistant} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
