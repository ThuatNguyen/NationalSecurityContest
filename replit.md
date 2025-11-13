# Police Emulation Scoring System

## Overview
This web application digitizes and streamlines the evaluation process for the Vietnamese People's Public Security force's "Vì An ninh Tổ quốc" emulation program. It manages self-scoring, cluster-level review, and final approval workflows across different organizational units. The system aims to ensure transparency, accuracy, and ease of data aggregation for competitive evaluations.

## Recent Changes

### 2025-01-13: Fixed File Attachment Access Issue
- **Problem**: Users clicking file attachment icons got "file not found" error in new browser tab
- **Root Cause**: Using `window.open()` to open files caused session cookies to not be sent properly in certain contexts
- **Solution**: 
  - Changed from programmatic `window.open()` to native `<a>` tag with `target="_blank"`
  - Browsers handle authentication better with anchor-based navigation
  - Session cookies (sameSite='lax') are properly sent with same-site anchor navigation
  - Kept `/uploads` route protected with `requireAuth` middleware for security
- **Security Note**: Avoided `sameSite='none'` which would introduce CSRF vulnerability
- **Impact**: Users can now view file attachments correctly without authentication errors
- **Test Result**: Verified with e2e test - authenticated file access works, returns 200 OK with proper Content-Type

### 2025-01-13: Fixed Cluster-Period Mismatch Issue
- **Problem**: Admin selecting "Khối hậu cần" cluster saw criteria from different clusters because evaluation periods weren't filtered by selected cluster
- **Root Cause**: `filteredPeriods` only filtered by year and user role, not by admin's selected cluster
- **Solution**: 
  - Added cluster-based filtering for admin role in `filteredPeriods` memoization
  - Improved empty state message to guide users when no periods exist for selected cluster/year
  - Ensures criteria displayed always match the selected cluster filter
- **Impact**: Admin and cluster leaders now see criteria consistent with their cluster selection

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript, using Vite.
- **UI:** Shadcn/ui (Radix UI primitives), Material Design 3 principles, Tailwind CSS, Vietnamese localization.
- **State Management:** TanStack Query for server state, React hooks for local state, session-based authentication.
- **Routing:** Wouter.
- **Design Decisions:** Shadcn/ui for accessibility and customization, Material Design 3 for professional data-intensive applications, Tailwind for rapid development and consistency.

### Backend Architecture
- **Runtime:** Node.js with Express.js.
- **Language:** TypeScript (ESM modules).
- **API Pattern:** RESTful API with session-based authentication.
- **Authentication:** Passport.js (Local Strategy), bcrypt for password hashing, express-session with PostgreSQL store.
- **Design Decisions:** Session-based auth for enhanced security and audit trails in government systems, Passport.js for robust authentication.

### Data Layer
- **Database:** PostgreSQL (Neon serverless).
- **ORM:** Drizzle ORM.
- **Schema:**
    - `users`: Role-based access (admin, cluster_leader, user).
    - `clusters`: Evaluation cluster groups.
    - `units`: Police units within clusters.
    - `criteria_groups`: Evaluation criteria categories by cluster and year.
    - `criteria`: Specific evaluation criteria with max scores.
    - `evaluation_periods`: Annual/periodic evaluation cycles.
    - `evaluations`: Self-scoring submissions.
    - `scores`: Granular scoring data.
- **Key Relationships:** Users belong to Units, Units to Clusters. Criteria Groups scoped to Clusters/Years. Evaluations contain Scores.
- **Design Decisions:** Drizzle ORM for type-safety and lightweight control, Neon for serverless scalability, normalized schema for flexible criteria and historical data.

## External Dependencies
- **Database:** Neon PostgreSQL (`@neondatabase/serverless`).
- **Authentication:** `passport`, `passport-local`, `bcryptjs`.
- **Session Management:** `express-session`, `connect-pg-simple`.
- **UI Components:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `lucide-react`.
- **Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Development Tools:** `@replit/vite-plugin-*`, `drizzle-kit`.