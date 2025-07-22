import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Linkedin, Home, Bot, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AuthStatus {
  isAuthenticated: boolean;
  user?: {
    username: string;
    linkedinConnected: boolean;
  };
}

export default function NavigationHeader() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
  });

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const linkedinAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/linkedin");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Authentication Error",
        description: "Failed to initiate LinkedIn authentication",
        variant: "destructive",
      });
    },
  });

  const handleLinkedInAuth = () => {
    linkedinAuthMutation.mutate();
  };

  const isLinkedInConnected = authStatus?.user?.linkedinConnected;

  const NavigationLinks = ({ mobile = false, onNavigate?: () => void }) => (
    <nav 
      className={mobile ? "flex flex-col space-y-2" : "hidden sm:flex sm:space-x-1"}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link href="/">
        <Button
          variant={location === "/" ? "default" : "ghost"}
          size="sm"
          className={`flex items-center space-x-2 ${mobile ? 'w-full justify-start' : ''}`}
          onClick={onNavigate}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>Dashboard</span>
        </Button>
      </Link>
      <Link href="/ai-assistant">
        <Button
          variant={location === "/ai-assistant" ? "default" : "ghost"}
          size="sm"
          className={`flex items-center space-x-2 ${mobile ? 'w-full justify-start' : ''}`}
          onClick={onNavigate}
        >
          <Bot className="h-4 w-4" aria-hidden="true" />
          <span>AI Assistant</span>
        </Button>
      </Link>
    </nav>
  );

  const ConnectionStatus = ({ mobile = false }) => (
    <div className={`flex items-center ${mobile ? 'flex-col space-y-2' : 'space-x-4'}`}>
      <div className="flex items-center space-x-2">
        <div 
          className={`w-2 h-2 rounded-full ${
            isLinkedInConnected ? 'bg-success-green' : 'bg-error-red'
          }`}
          role="img"
          aria-label={isLinkedInConnected ? 'LinkedIn Connected' : 'LinkedIn Not Connected'}
        />
        <span className="text-sm text-neutral-gray">
          {isLinkedInConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      {!isLinkedInConnected && (
        <Button
          onClick={handleLinkedInAuth}
          disabled={linkedinAuthMutation.isPending || isLoading}
          className={`bg-azure-blue text-white hover:bg-azure-dark ${mobile ? 'w-full' : ''}`}
          aria-label="Connect to LinkedIn"
        >
          <Linkedin className="mr-2 h-4 w-4" aria-hidden="true" />
          Connect LinkedIn
        </Button>
      )}
    </div>
  );

  const UserMenu = ({ mobile = false, onNavigate?: () => void }) => {
    if (!user) return null;

    if (mobile) {
      return (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">{user.username}</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              logout();
              onNavigate?.();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Log out</span>
          </Button>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2"
            aria-label={`User menu for ${user.username}`}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Linkedin className="text-azure-blue text-2xl mr-3" aria-hidden="true" />
            <h1 className="text-lg sm:text-xl font-semibold text-text-dark">
              <span className="hidden sm:inline">LinkedIn Data Extraction Tool</span>
              <span className="sm:hidden">LinkedIn Tool</span>
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <NavigationLinks />
          
          {/* Desktop Right Section */}
          <div className="hidden sm:flex items-center space-x-4">
            <ConnectionStatus />
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px]"
                id="mobile-menu"
                aria-label="Mobile navigation menu"
              >
                <SheetHeader>
                  <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                  <SheetDescription className="text-left">
                    Access your dashboard and settings
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <NavigationLinks mobile onNavigate={() => setIsMobileMenuOpen(false)} />
                  <div className="border-t pt-6">
                    <ConnectionStatus mobile />
                  </div>
                  <UserMenu mobile onNavigate={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}