---
layout: default
title: Home
---

# LinkedIn Harvester Documentation

Welcome to the LinkedIn Harvester documentation. This tool is a professional LinkedIn API integration application built with React and Express.

## Overview

LinkedIn Harvester is a comprehensive tool that provides legitimate access to LinkedIn profile data through official APIs. It features:

- **Professional Interface**: Azure Portal-inspired design with modern UI components
- **Batch Processing**: Upload Excel files containing LinkedIn URLs for bulk processing
- **OAuth Authentication**: Secure LinkedIn OAuth integration
- **Real-time Progress**: Live tracking of job processing with comprehensive statistics
- **Data Export**: Export results in various formats
- **Database Integration**: PostgreSQL database with Drizzle ORM for persistent storage

## Quick Start

1. **Authentication**: Connect your LinkedIn account through OAuth
2. **Upload Data**: Upload an Excel file containing LinkedIn profile URLs
3. **Process**: Start the extraction job and monitor progress
4. **Export**: Download your results in Excel format

## Architecture

### Frontend
- React 18 with TypeScript
- Radix UI components with shadcn/ui design system
- Tailwind CSS for styling
- TanStack Query for state management

### Backend
- Express.js with TypeScript
- PostgreSQL database
- Custom job processing queue
- LinkedIn OAuth integration

## Getting Started

To get started with LinkedIn Harvester, please refer to our [setup guide](setup/) and [API documentation](api/).