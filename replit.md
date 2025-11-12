# Police Emulation Scoring System

## Overview

This is a web application for scoring competitive evaluations in the Vietnamese People's Public Security force, specifically for the "Vì An ninh Tổ quốc" (For National Security) emulation program. The system manages self-scoring, cluster-level review, and final approval workflows across different organizational units.

**Primary Purpose:** Digitize and streamline the evaluation process for police units, ensuring transparency, accuracy, and ease of data aggregation across multiple evaluation criteria and organizational clusters.

**Key Features:**
- Role-based access control (Admin, Cluster Leader, Unit User)
- Multi-stage evaluation workflow (self-scoring → cluster review → final approval)
- Criteria management per evaluation cluster
- Annual evaluation periods
- Comprehensive reporting and analytics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript, using Vite as the build tool

**UI Component System:** 
- Shadcn/ui component library with Radix UI primitives
- Material Design 3 principles with enterprise customization
- Tailwind CSS for styling with custom design tokens
- Vietnamese language optimization (Inter font family)

**State Management:**
- TanStack Query (React Query) for server state
- React hooks for local component state
- Session-based authentication state via Express sessions

**Routing:** Wouter (lightweight client-side routing)

**Design Decisions:**
- **Why Shadcn/ui:** Provides accessible, customizable components built on Radix UI primitives, allowing fine-grained control over styling while maintaining accessibility standards
- **Why Material Design 3:** Data-intensive administrative applications require clear visual hierarchy and professional credibility; MD3 provides robust patterns for complex tables and forms
- **Why Tailwind:** Rapid UI development with design consistency through utility classes and custom CSS variables for theming

### Backend Architecture

**Runtime:** Node.js with Express.js server framework

**Language:** TypeScript (ESM modules)

**API Pattern:** RESTful API with session-based authentication

**Authentication Strategy:**
- Passport.js with Local Strategy
- Password hashing via bcrypt
- Session management using express-session with PostgreSQL session store (connect-pg-simple)
- Session cookies (7-day expiration, httpOnly, secure in production)

**Design Decisions:**
- **Why session-based auth:** Government administrative systems benefit from server-side session management for better security control and audit trails compared to JWT tokens
- **Why Passport.js:** Industry-standard authentication middleware with extensive strategy support and good TypeScript integration

### Data Layer

**Database:** PostgreSQL (via Neon serverless connector)

**ORM:** Drizzle ORM with type-safe schema definitions

**Schema Structure:**
- `users` - User accounts with role-based access (admin, cluster_leader, user)
- `clusters` - Evaluation cluster groups (5 main clusters)
- `units` - Police units within clusters
- `criteria_groups` - Evaluation criteria categories by cluster and year
- `criteria` - Specific evaluation criteria with max scores
- `evaluation_periods` - Annual or periodic evaluation cycles
- `evaluations` - Self-scoring submissions by units
- `scores` - Granular scoring data linked to criteria and evaluations

**Key Relationships:**
- Users belong to Units, Units belong to Clusters
- Cluster Leaders oversee Units within their Cluster
- Criteria Groups are scoped to Clusters and Years
- Evaluations contain multiple Scores (one per Criteria)

**Design Decisions:**
- **Why Drizzle ORM:** Type-safe schema-first approach with excellent TypeScript inference, lightweight compared to TypeORM, and better raw SQL control when needed
- **Why Neon Serverless:** Serverless PostgreSQL with WebSocket support, automatic scaling, and good developer experience for Replit deployments
- **Why normalized schema:** Allows flexible criteria configuration per cluster/year while maintaining data integrity and supporting multi-year historical data

### External Dependencies

**Database Service:** Neon PostgreSQL (serverless)
- Connection via `@neondatabase/serverless` package
- WebSocket-based connectivity for serverless environments

**Authentication:**
- `passport` - Authentication middleware
- `passport-local` - Username/password strategy
- `bcryptjs` - Password hashing

**Session Management:**
- `express-session` - Session middleware
- `connect-pg-simple` - PostgreSQL session store

**UI Component Libraries:**
- `@radix-ui/*` - Headless UI primitives (20+ component packages)
- `class-variance-authority` - Component variant management
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Icon library

**Form Handling:**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Validation resolvers
- `zod` - Schema validation

**Development Tools:**
- `@replit/vite-plugin-*` - Replit-specific development plugins
- `drizzle-kit` - Database migration and schema management CLI

**Design Rationale:**
- All dependencies chosen for TypeScript-first support and modern React patterns
- Preference for lightweight, composable libraries over monolithic frameworks
- Session storage in PostgreSQL ensures session persistence across server restarts