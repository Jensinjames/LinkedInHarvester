import { QueryClient } from "@tanstack/react-query";

// Enhanced query client with better caching and error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Enable background refetching on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Show error toast on mutation failure by default
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Global error handling can be added here
      },
    },
  },
});

// Enhanced API request function with better error handling and caching
export async function apiRequest(
  method: string,
  endpoint: string,
  options: {
    body?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<Response> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = `${baseUrl}${endpoint}`;
  
  // Get auth token from localStorage
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).accessToken : null;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    signal: options.signal,
  };
  
  if (options.body) {
    config.body = options.body;
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle different response types
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      // Custom error for different status codes
      if (response.status === 401) {
        // Handle token expiry - try to refresh or logout
        const authData = localStorage.getItem('auth');
        if (authData) {
          const { refreshToken } = JSON.parse(authData);
          if (refreshToken) {
            try {
              const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const newTokens = await refreshResponse.json();
                const updatedAuth = { ...JSON.parse(authData), ...newTokens };
                localStorage.setItem('auth', JSON.stringify(updatedAuth));
                
                // Retry original request with new token
                return apiRequest(method, endpoint, options);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
        }
        
        // Clear auth data and redirect to login
        localStorage.removeItem('auth');
        window.location.href = '/login';
      }
      
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error) {
      // Enhanced error messages for different scenarios
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}