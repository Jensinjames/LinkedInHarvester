import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data);
      navigate("/");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to login");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      return response.json();
    },
    onSuccess: (data) => {
      login(data);
      navigate("/");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to register");
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    setError(null);
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>LinkedIn Data Extractor</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2" role="tablist">
              <TabsTrigger 
                value="login" 
                role="tab"
                aria-selected="true"
                aria-controls="login-panel"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                role="tab" 
                aria-selected="false"
                aria-controls="register-panel"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" id="login-panel" role="tabpanel">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-username">Username</FormLabel>
                        <FormControl>
                          <Input 
                            id="login-username"
                            placeholder="Enter your username" 
                            autoComplete="username"
                            aria-describedby={loginForm.formState.errors.username ? "login-username-error" : undefined}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage id="login-username-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-password">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password" 
                              autoComplete="current-password"
                              aria-describedby={loginForm.formState.errors.password ? "login-password-error" : undefined}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage id="login-password-error" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    aria-describedby={loginMutation.isPending ? "login-loading" : undefined}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    <span>{loginMutation.isPending ? "Signing In..." : "Sign In"}</span>
                    {loginMutation.isPending && (
                      <span id="login-loading" className="sr-only">Loading</span>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" id="register-panel" role="tabpanel">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-username">Username</FormLabel>
                        <FormControl>
                          <Input 
                            id="register-username"
                            placeholder="Choose a username" 
                            autoComplete="username"
                            aria-describedby={registerForm.formState.errors.username ? "register-username-error" : undefined}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage id="register-username-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-email">Email</FormLabel>
                        <FormControl>
                          <Input 
                            id="register-email"
                            type="email" 
                            placeholder="Enter your email" 
                            autoComplete="email"
                            aria-describedby={registerForm.formState.errors.email ? "register-email-error" : undefined}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage id="register-email-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-password">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="register-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Choose a password" 
                              autoComplete="new-password"
                              aria-describedby={registerForm.formState.errors.password ? "register-password-error" : undefined}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage id="register-password-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-confirm-password">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="register-confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password" 
                              autoComplete="new-password"
                              aria-describedby={registerForm.formState.errors.confirmPassword ? "register-confirm-password-error" : undefined}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage id="register-confirm-password-error" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    aria-describedby={registerMutation.isPending ? "register-loading" : undefined}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    <span>{registerMutation.isPending ? "Creating Account..." : "Create Account"}</span>
                    {registerMutation.isPending && (
                      <span id="register-loading" className="sr-only">Loading</span>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}