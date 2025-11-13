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

## Recent Changes

**November 2025 - Evaluation Periods Filter UI Simplification**
- **Filter Streamlining:** Reduced filter fields from 4 to 3 by removing redundant "Kỳ thi đua" (Period) field
  - **Business Rule:** Each year has exactly one evaluation period, making period selector redundant
  - **New Filter Structure:** Year + Cluster + Unit (3 fields only)
  - **Backend Logic:** Unchanged - period auto-selected from filteredPeriods[0] based on selected year
- **Role-Based Filter Permissions:**
  - **Admin:** All 3 fields are dropdowns (full flexibility)
  - **Cluster Leader:** Year dropdown + Cluster read-only (locked to their cluster) + Unit dropdown (units in their cluster)
  - **User:** Year dropdown + Cluster read-only (auto-detected from unit) + Unit read-only (locked to their unit)
- **Implementation Details:**
  - useEffect sets selectedClusterId and selectedUnitId on mount based on user role
  - Admin: defaults to first cluster + first unit in that cluster
  - Cluster leader: locks to user.clusterId + defaults to first unit in cluster
  - User: auto-detects cluster from user.unitId + locks to user.unitId
  - Query summary endpoint uses selectedUnitId instead of hardcoded user.unitId
- **E2E Testing:** Verified with Playwright across all roles (admin, user roles tested)
- **Architect Notes:** Filter works correctly assuming one-period-per-year constraint; consider displaying period name in table header for transparency

**November 2025 - Null Handling Bug Fixes in Scoring Displays**
- **Critical Bug Fix:** Fixed runtime crashes caused by NULL score values calling toFixed()
  - **Root Cause:** `!== undefined` check doesn't guard against NULL in JavaScript (NULL !== undefined → true)
  - **Affected Components:** EvaluationPeriods.tsx, ReviewModal.tsx
- **EvaluationPeriods.tsx Fixes:**
  - Changed all score displays from `item.score !== undefined` to `typeof item.score === 'number'`
  - Applied to: selfScore, review1Score, review2Score, finalScore columns
  - NULL scores now safely display as "-" or "Chấm điểm" placeholders
- **ReviewModal.tsx Fix:**
  - Changed selfScore reference section check from `selfScore !== undefined` to `typeof selfScore === 'number'`
  - Prevents crash when opening review modal with NULL self-score
  - Reference section hidden when selfScore is NULL (no error overlay)
- **E2E Testing Verification:**
  - All workflows tested with Playwright using test123/admin123 account
  - Verified NULL score rendering across all columns
  - Verified scoring modal opens/closes without crashes
  - Verified user role permissions (can score, cannot review)
- **Production Ready:** Architect reviewed and approved - no latent null issues detected

**November 2025 - Cluster Leader User Creation with Restrictions**
- **Extended Permissions:** Cluster leaders can now create users within their cluster
  - Backend: POST /api/auth/register now accepts cluster_leader role
  - Cluster leaders can ONLY create users with role="user" (not admin or cluster_leader)
  - All created users must belong to a unit within the cluster leader's cluster
- **Frontend Restrictions:**
  - Role dropdown: Cluster leaders creating users see only "Người dùng" option (disabled)
  - Cluster display: Auto-filled, shown as read-only text (not editable selector)
  - Unit dropdown: Filtered to show only units within their cluster
- **Backend Validation:**
  - Forces role="user" for cluster_leader-created users
  - Forces clusterId to cluster_leader's cluster (prevents cross-cluster assignment)
  - Validates unitId exists and belongs to their cluster before creation
  - Rejects requests with missing unitId or units from other clusters
- **Auto-Scoped User Filtering:** 
  - Cluster leaders see only users in their cluster (GET /api/users filtered)
  - Context alert displays: "Bạn đang quản lý người dùng trong cụm: [cluster name]"
- **Security:**
  - All validation enforced on both frontend and backend
  - No bypass paths - cluster leaders cannot escalate privileges or cross clusters
  - Admin workflow unchanged (full flexibility retained)
- **E2E Tested:** All workflows verified with Playwright including edge cases

**November 2025 - Unified Menu with Role-Based Access Control**
- **Architecture:** Refactored navigation to single NAV_ITEMS configuration with role-based metadata
  - All roles see unified menu structure with appropriate items filtered by allowedRoles
  - Settings section dynamically shows/hides items based on user role
  - Unit users have Settings menu completely hidden
- **Route Protection:** Created ProtectedRoute component for route-level authorization
  - Checks user.role against allowedRoles before rendering page
  - Returns 403 error view for unauthorized access attempts
  - Applied to all /settings/* routes in App.tsx
- **Auto-Scoped Data Filtering:** Implemented automatic cluster/unit filtering
  - Cluster leaders: auto-select and lock to their cluster, cannot view other clusters
  - Unit users: blocked from all Settings pages
  - Context indicators (Alert badges) show active data scope: "Đang xem dữ liệu cụm: X"
- **Backend Authorization:** All Settings endpoints protected with requireRole middleware
  - /api/clusters: admin only (write), all roles (read)
  - /api/units, /api/criteria: admin + cluster_leader (write), all roles (read)
- **E2E Testing:** Verified with Playwright across all 3 roles
  - Admin: full access, no filtering
  - Cluster leader: scoped access with auto-filtering
  - Unit user: Settings access completely blocked with 403

**November 2025 - User Management Validation & UX Improvements**
- Implemented comprehensive role-based validation for user creation/updates:
  - Admin: Cannot be assigned to cluster or unit (full system access)
  - Cluster Leader: Must be assigned to a cluster
  - Unit User: Must be assigned to a unit
- Enhanced UX with context-aware helper messages and dynamic form fields
- Dual validation (frontend + backend) for security and user experience
- Auto-reset clusterId/unitId when role changes to prevent stale data
- E2E tested: all validation scenarios verified

**November 2025 - Criteria Management Implementation**
- Implemented comprehensive criteria management system with dual-level hierarchy
- Added CRUD operations for criteria groups and individual criteria
- Implemented role-based UI permissions (admin/cluster_leader can manage, users read-only)
- Fixed critical bugs: query cache invalidation, empty groups rendering, groupId validation
- Added UX improvements: alert messages, tooltips for disabled buttons
- All Vietnamese interface with Material Design 3 styling
- E2E tested with Playwright: all core workflows verified

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