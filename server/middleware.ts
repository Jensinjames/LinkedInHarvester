import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { verifyAccessToken } from './auth';
import type { TokenPayload } from './auth';
import { z } from 'zod';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Input validation schemas
export const jobIdSchema = z.coerce.number().positive().int();
export const paginationSchema = z.object({
  page: z.coerce.number().positive().int().default(1),
  limit: z.coerce.number().positive().int().max(100).default(10),
  search: z.string().optional(),
});

// Input sanitization middleware
export function validateAndSanitize(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize request body, params, and query
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = schema.parse(req.body);
      }
      if (req.params && Object.keys(req.params).length > 0) {
        // For params, we typically validate specific ones
        if (req.params.id) {
          req.params.id = jobIdSchema.parse(req.params.id).toString();
        }
      }
      if (req.query && Object.keys(req.query).length > 0) {
        req.query = paginationSchema.parse(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
}

// JWT Authentication Middleware with enhanced security
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN' 
    });
  }

  // Validate token format (basic check)
  if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
    return res.status(401).json({ 
      error: 'Invalid token format',
      code: 'INVALID_TOKEN_FORMAT' 
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    const errorMessage = error.message.includes('expired') 
      ? 'Token expired' 
      : 'Invalid token';
    
    return res.status(403).json({ 
      error: errorMessage,
      code: error.message.includes('expired') ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
}

// Optional authentication middleware (for routes that work with or without auth)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch (error) {
      // Token is invalid but we continue anyway
      console.log('Optional auth failed:', error);
    }
  }

  next();
}

// Enhanced rate limiting configurations
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Different limits based on authentication status
    return req.user ? 200 : 100; // Higher limit for authenticated users
  },
  message: {
    error: 'Too many requests from this IP',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: () => process.env.NODE_ENV !== 'production',
  keyGenerator: (req: Request) => {
    // Use user ID for authenticated requests, IP for anonymous
    if (req.user) {
      return `user:${req.user.userId}`;
    }
    // Use req.ip which is handled by express and rate limiter correctly
    return req.ip;
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Strict limit for auth attempts
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Skip rate limiting in development
  skip: () => process.env.NODE_ENV !== 'production',
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => {
    // Premium users might have higher limits
    return 20; // Base limit
  },
  message: {
    error: 'Upload limit exceeded',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: () => process.env.NODE_ENV !== 'production',
});

// Enhanced security headers middleware
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Vite dev
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket for Vite HMR
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
}

// CSRF-like protection through origin validation
export function validateOrigin(req: Request, res: Response, next: NextFunction) {
  // Skip for GET requests and in development
  if (req.method === 'GET' || process.env.NODE_ENV !== 'production') {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');
  const host = req.get('host');
  
  // Check if request is from same origin
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return res.status(403).json({ 
        error: 'Request blocked: Invalid origin',
        code: 'INVALID_ORIGIN' 
      });
    }
  } else if (referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      return res.status(403).json({ 
        error: 'Request blocked: Invalid referer',
        code: 'INVALID_REFERER' 
      });
    }
  } else {
    // No origin or referer header - might be suspicious
    console.warn('Request without origin/referer headers', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path
    });
  }
  
  next();
}

// Error handling middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log error (in production, use proper logging)
  console.error('API Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }

  // In development, return detailed error info
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'UNKNOWN_ERROR',
    stack: err.stack
  });
}