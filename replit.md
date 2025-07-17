# LinkedIn API Integration Tool

## Overview

This is a professional LinkedIn API integration tool built with a React frontend and Express backend. The application provides legitimate access to LinkedIn profile data through official APIs, featuring an Azure Portal-inspired design. Users can upload Excel files containing LinkedIn URLs, authenticate with LinkedIn OAuth, and extract profile data in batches with comprehensive progress tracking and error handling.

## Recent Changes

- ✓ Implemented Azure Portal-inspired design with professional color scheme
- ✓ Added functional authentication system with LinkedIn OAuth integration
- ✓ Created working file upload system with Excel processing
- ✓ Built real-time job processing with progress tracking
- ✓ Added comprehensive statistics dashboard
- ✓ Implemented export functionality for results
- ✓ Added demo data for immediate functionality testing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Azure Portal-inspired color scheme
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Multer for file uploads, xlsx library for Excel parsing
- **Authentication**: LinkedIn OAuth integration
- **Job Processing**: Custom queue system for batch profile extraction

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle with schema-first approach
- **File Storage**: Local filesystem for uploaded files and results
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

## Key Components

### Database Schema
- **Users**: Authentication and LinkedIn token storage
- **Jobs**: Batch processing job tracking with status and progress
- **Profiles**: Individual LinkedIn profile extraction records
- **API Stats**: Rate limiting and usage tracking

### Authentication & Authorization
- LinkedIn OAuth 2.0 integration for API access
- Mock authentication system for development
- Token refresh handling for long-running jobs

### File Processing Pipeline
1. Excel file upload and validation (50MB limit, .xlsx/.xls formats)
2. LinkedIn URL extraction from spreadsheets
3. Batch job creation with configurable batch sizes
4. Queue-based processing with retry logic
5. Results export to Excel format

### Job Queue System
- In-memory job queue with pause/resume functionality
- Configurable batch processing (default 50 profiles)
- Error categorization (CAPTCHA, access restricted, not found)
- Real-time progress tracking and ETA calculation
- Automatic retry mechanism for failed profiles

## Data Flow

1. **File Upload**: User uploads Excel file → Server validates and parses LinkedIn URLs
2. **Job Creation**: URLs are batched into processing jobs → Job queue manages execution
3. **LinkedIn API**: Authenticated requests extract profile data → Results stored in database
4. **Progress Tracking**: Real-time updates via polling → UI displays processing status
5. **Results Export**: Completed jobs can be downloaded as Excel files

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@radix-ui/***: Headless UI components
- **@tanstack/react-query**: Server state management
- **xlsx**: Excel file processing
- **multer**: File upload handling

### LinkedIn Integration
- OAuth 2.0 authentication flow
- Profile API access with rate limiting
- Proxy support for IP rotation (configurable)

### Development Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production build optimization

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR on port 5173
- **Backend**: Express server on port 5000 with tsx for TypeScript execution
- **Database**: Neon PostgreSQL with connection pooling
- **File Storage**: Local uploads directory

### Production Build
- **Frontend**: Static assets built to `dist/public`
- **Backend**: Bundled with ESBuild to `dist/index.js`
- **Database**: Migrations handled via Drizzle Kit
- **Environment**: Node.js with ES modules

### Configuration
- Database URL via `DATABASE_URL` environment variable
- LinkedIn credentials via environment variables
- File upload limits and batch sizes configurable
- Proxy settings for LinkedIn API access

The application follows a monorepo structure with shared TypeScript types and schema definitions between frontend and backend, ensuring type safety across the entire stack.