# Police Emulation Scoring System

## Overview
This web application digitizes and streamlines the evaluation process for the Vietnamese People's Public Security force's "Vì An ninh Tổ quốc" emulation program. It manages self-scoring, cluster-level review, and final approval workflows across different organizational units. The system aims to ensure transparency, accuracy, and ease of data aggregation for competitive evaluations. The system supports multiple evaluation periods per year with cluster-specific criteria, allowing for flexible, period-based evaluation cycles.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-11-17: Implemented Hierarchical Scoring Logic
- **Feature**: Smart self-scoring column that distinguishes between parent/branch nodes and leaf nodes
- **Logic**:
  - **Parent/Branch nodes** (items with children): Display sum of children's self-scores (read-only, not clickable)
  - **Leaf nodes** (items without children): Display "Chấm điểm" button for user input
- **Implementation**:
  - Added `hasChildren()` helper to detect if a criteria item has child items based on level hierarchy
  - Added `calculateChildrenTotal()` helper to sum scores of all leaf descendants
  - Modified rendering logic to conditionally show button vs. calculated total
  - Only leaf nodes are directly scorable; parent nodes automatically aggregate children's scores
- **Technical Details**:
  - Uses level-based tree traversal to identify parent-child relationships
  - Prevents double-counting by only summing leaf node scores for parent totals
  - Filtered criteria list passed to helper functions for accurate index-based lookups
- **Impact**: Users only score leaf criteria; parent/branch totals are automatically calculated, preventing errors and simplifying the scoring workflow

### 2025-11-17: Fixed Evaluation Criteria Table Display
- **Problem**: Evaluation criteria table in "Kỳ thi đua" page showing incorrect totals (double-counting issue) and displaying parent container rows without codes.
- **Root Cause**: 
  1. The `calculateGroupTotal` function was summing **all criteria items** in a group, including both parent containers (without codes) and actual scoring criteria (with codes)
  2. Parent container rows were being displayed in the table even though they have no code field
- **Solution**: 
  1. Updated `calculateGroupTotal` to only sum **items with codes** (actual scoring criteria), filtering out parent containers
  2. Added `.filter(item => item.code?.trim())` to display logic to hide parent container rows
- **Technical Details**:
  - Modified both calculation and display logic to consistently filter by `item.code?.trim()`
  - Parent containers (e.g., "Coong tac tham mau" without code) are now hidden
  - Only scoring criteria (e.g., "A Coong tac tham mau" with code "A") are displayed and counted
  - This ensures totals reflect only actual scoring items, not container placeholders
- **Impact**: Table now displays only scoring criteria with codes, and totals correctly reflect the sum of those items only

### 2025-11-17: Resolved Production Database Authentication Issues
- **Problem**: Users unable to login to production deployment with credentials that worked in development.
- **Root Causes**:
  1. **Whitespace in usernames**: Manual data entry via Database Pane included trailing/leading spaces (e.g., `"admin "` instead of `"admin"`), causing username lookups to fail
  2. **Plain-text passwords**: Manual user creation stored passwords as plain text (e.g., `"admin123"`), but authentication requires bcrypt hashes (e.g., `"$2b$10$..."`). The `bcrypt.compare()` function expects hashed passwords and fails when comparing against plain text
  3. **Session persistence**: Sessions not maintained after login due to reverse proxy configuration - Express needed to trust proxy headers for secure cookies to work properly
- **Solutions**:
  1. **Username cleanup**: Remove all trailing/leading whitespace from username columns in Production Database
  2. **Password hashing**: Use the utility endpoint `POST /api/util/hash-password` to generate bcrypt hashes, then update password column in Production Database with the hashed value
  3. **Trust proxy setting**: Added `app.set('trust proxy', 1)` to ensure Express properly handles HTTPS connections behind Replit's reverse proxy
- **Technical Details**:
  - Created temporary utility endpoint `/api/util/hash-password` for password hashing (deleted after setup)
  - Bcrypt hash format: `$2b$10$<salt><hash>`, approximately 60 characters
  - Each hash is unique due to random salt, but all validate against the same plain-text password
  - Added session debug middleware to track session lifecycle and authentication state
  - Trust proxy setting enables secure cookies to work correctly with Replit's infrastructure
- **Production Database Best Practices**:
  - Always trim whitespace when manually entering data
  - Never store plain-text passwords - use bcrypt hashing (10 rounds)
  - Verify data integrity before deployment using seed scripts in development
- **Impact**: Production authentication now works correctly with proper bcrypt password validation and session persistence through reverse proxy

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript, using Vite.
- **UI:** Shadcn/ui (Radix UI primitives), Material Design 3 principles, Tailwind CSS, Vietnamese localization.
- **State Management:** TanStack Query for server state, React hooks for local state, session-based authentication.
- **Routing:** Wouter.
- **Design Decisions:** Shadcn/ui for accessibility and customization, Material Design 3 for professional data-intensive applications, Tailwind for rapid development and consistency. The UX flow prioritizes selecting an evaluation period first, then a cluster, aligning with administrative workflows. Auto-selection logic for user's cluster and unit ensures appropriate criteria display upon login.

### Backend Architecture
- **Runtime:** Node.js with Express.js.
- **Language:** TypeScript (ESM modules).
- **API Pattern:** RESTful API with session-based authentication.
- **Authentication:** Passport.js (Local Strategy), bcrypt for password hashing, express-session with PostgreSQL store.
- **Design Decisions:** Session-based authentication for enhanced security and audit trails in government systems, Passport.js for robust authentication. File attachments are served securely via protected routes with proper session cookie handling.

### Data Layer
- **Database:** PostgreSQL (Neon serverless).
- **ORM:** Drizzle ORM.
- **Schema:**
    - `users`: Role-based access (admin, cluster_leader, user).
    - `clusters`: Evaluation cluster groups.
    - `units`: Police units within clusters.
    - `criteria_groups`: Evaluation criteria categories.
    - `criteria`: Specific evaluation criteria with max scores, includes `level` and `code` for hierarchical trees.
    - `evaluation_periods`: Annual/periodic evaluation cycles, with many-to-many relationship to `clusters`.
    - `evaluations`: Self-scoring submissions.
    - `scores`: Granular scoring data.
- **Key Relationships:** Users belong to Units, Units to Clusters. Criteria are scoped by `periodId` and optionally `clusterId`. Evaluations contain Scores.
- **Design Decisions:** Drizzle ORM for type-safety and lightweight control, Neon for serverless scalability, normalized schema for flexible criteria and historical data, supporting multiple evaluation periods per year and cluster-specific criteria.

## External Dependencies
- **Database:** Neon PostgreSQL (`@neondatabase/serverless`).
- **Authentication:** `passport`, `passport-local`, `bcryptjs`.
- **Session Management:** `express-session`, `connect-pg-simple`.
- **UI Components:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `lucide-react`.
- **Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.