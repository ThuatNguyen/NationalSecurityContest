# Police Emulation Scoring System

## Overview
This web application digitizes and streamlines the evaluation process for the Vietnamese People's Public Security force's "Vì An ninh Tổ quốc" emulation program. It manages self-scoring, cluster-level review, and final approval workflows across different organizational units. The system aims to ensure transparency, accuracy, and ease of data aggregation for competitive evaluations.

## Recent Changes

### 2025-11-16: Migrated Criteria System from Year-Based to Period-Based Filtering
- **Problem**: Criteria management used year-based filtering, but business requirement is one year can have multiple evaluation periods with different criteria sets per cluster. Year-based approach was inadequate.
- **Root Cause**: 
  - Schema had `year` column in `criteria`, `criteriaTargets`, and `criteriaResults` tables
  - Backend storage and API routes filtered by year parameter
  - Frontend pages (CriteriaTreeManagement, CriteriaScoring, CriteriaManagement) used year dropdowns
  - No way to distinguish between different periods within same year
- **Solution**:
  - **Schema Migration**: Dropped `year` column, made `periodId` NOT NULL with composite indexes `(periodId, clusterId, ...)`
  - **Backend Refactor**: Updated `CriteriaTreeStorage.getCriteria(periodId, clusterId?)` signature and all API endpoints to require `periodId` parameter
  - **Frontend Refactor**: 
    - Added period dropdown to all criteria management pages
    - Replaced year state with selectedPeriodId
    - Auto-fetch periods based on selected cluster
    - Auto-select first available period
    - Updated all queries and mutations to use periodId instead of year
  - **Data Migration**: Assigned existing criteria without periodId to first evaluation period of their cluster via SQL
- **Technical Details**:
  - Files changed: `shared/schema.ts`, `server/criteriaTreeStorage.ts`, `server/criteriaTreeRoutes.ts`, `client/src/pages/CriteriaTreeManagement.tsx`, `client/src/pages/CriteriaScoring.tsx`, `client/src/pages/CriteriaManagement.tsx`
  - Migration approach: Manual SQL execution to avoid interactive prompts
  - LSP errors resolved: Fixed clusterId type checking, removed year variable references
  - All pages now have consistent (Cluster → Period) filter pattern
- **Impact**: System now supports multiple evaluation periods per year with cluster-specific criteria, enabling flexible period-based evaluation cycles

### 2025-11-16: Refactored Period Filter from Year-Based to Period Name-Based
- **Problem**: User requirement - one year can have multiple evaluation periods for multiple clusters, each with different criteria. Year-based filtering was ambiguous.
- **Root Cause**: 
  - Frontend filtered by year then auto-selected first period
  - When user changed period, stale cluster/unit selections persisted
  - Summary query loaded invalid data (cluster/unit not in new period)
- **Solution**:
  - Removed `selectedYear` state and `availableYears` memoization
  - Changed filter UI from "Năm thi đua" (Year) to "Kỳ thi đua" (Period Name) dropdown
  - Added Step 1b: Reset cluster/unit to empty when period changes
  - Enhanced Step 2: Validate selected cluster exists in new period's clusters array
  - Enhanced Step 3: Validate selected unit exists in new cluster's units array
  - Auto-selection now properly falls back to first valid cluster/unit
- **Technical Details**:
  - Direct period selection via dropdown showing period names
  - Auto-selection flow: period change → reset cluster/unit → validate & auto-select → load summary
  - Architect-reviewed validation logic prevents stale data issues
- **Impact**: Users can now clearly select specific evaluation periods, supporting multiple periods per year with different cluster assignments

### 2025-11-16: Fixed Period Filtering to Support Many-to-Many with Clusters
- **Problem**: Backend was filtering periods incorrectly, not respecting the many-to-many relationship via `evaluationPeriodClusters` junction table
- **Root Cause**: 
  - Backend `storage.getEvaluationPeriods(clusterId)` used old direct `period.clusterId` field
  - Frontend interface had incorrect `period.clusterId` property
  - Frontend `filteredPeriods` was trying to filter by cluster (should only filter by year)
- **Solution**:
  - Updated `storage.getEvaluationPeriods()` to use drizzle's `inArray` with evaluationPeriodClusters JOIN
  - Admin (no clusterId): returns ALL periods
  - Non-admin (with clusterId): returns only periods assigned via junction table
  - Removed `period.clusterId` from frontend EvaluationSummary interface
  - Updated `filteredPeriods` to only filter by year (backend handles cluster filtering)
- **Security**: Route guard at lines 915-917 ensures non-admin users without clusterId get 403 before calling storage
- **Technical Details**:
  - Backend query: `SELECT * FROM evaluation_periods WHERE id IN (SELECT period_id FROM evaluation_period_clusters WHERE cluster_id = ?)`
  - Frontend auto-selection now respects backend-filtered periods
  - LSP errors resolved by adding `inArray` import from drizzle-orm
- **Impact**: Periods now correctly filtered by cluster assignment, supporting multiple clusters per period

### 2025-11-16: Refactored EvaluationPeriods Component with Auto-Selection Logic
- **Problem**: Unit users needed auto-detection of their cluster and unit to display appropriate criteria table for self-scoring
- **Root Cause**: State initialization lacked proper dependency order, causing race conditions and incorrect auto-selection
- **Solution**: 
  - Added `level` and `code` fields to Criteria interface for hierarchical criteria tree support
  - Added `selectedYear` state (initialized to current year) for better year-based filtering
  - Consolidated duplicate `evaluation-periods` queries into single source of truth
  - Refactored auto-selection logic with clear step-by-step initialization:
    - Step 1: Auto-select year based on available periods
    - Step 2: Auto-select period ID when periods change
    - Step 3: Auto-select cluster based on user role (admin can change, unit users locked to their cluster)
    - Step 4: Auto-select unit based on user role (admin can change, unit users locked to their unit)
  - Filters are read-only for unit users, ensuring they only see their own unit's criteria
  - Summary query fires only when both period and unit are ready, ensuring immediate criteria table load
- **Technical Details**:
  - Removed `EvaluationPeriodsNew.tsx` (unused legacy component)
  - Updated `App.tsx` to import from `EvaluationPeriods.tsx`
  - All LSP errors resolved
  - Architect review passed with recommendations for future regression tests
- **Impact**: Unit users can now login and immediately see their appropriate criteria table without manual filter selection

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