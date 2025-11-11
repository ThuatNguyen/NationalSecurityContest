# Design Guidelines: Police Emulation Scoring System

## Design Approach

**System Selected**: Material Design 3 with enterprise customization  
**Rationale**: Data-intensive administrative application requiring clarity, hierarchy, and professional credibility. Material Design provides robust patterns for complex tables, forms, and multi-level navigation while maintaining accessibility and consistency.

## Core Design Principles

1. **Data Clarity First**: Information hierarchy optimized for scanning large datasets
2. **Role-Based Visual Distinction**: Clear UI differences between Admin, Cluster Leader, and Unit User interfaces
3. **Vietnamese Language Optimization**: Typography and spacing adjusted for Vietnamese diacritics
4. **Trust & Authority**: Professional aesthetic appropriate for government administrative systems

---

## Typography

**Font Family**: 
- Primary: 'Inter' (Vietnamese diacritic support, excellent readability)
- Fallback: system-ui, -apple-system

**Hierarchy**:
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card/Panel Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Table Headers: text-sm font-semibold uppercase tracking-wide (14px)
- Table Data: text-sm (14px)
- Helper Text: text-xs (12px)

---

## Layout System

**Spacing Units**: Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, mt-8)

**Structure**:
- **Sidebar Navigation**: Fixed width (w-64), full-height for role-based menu
- **Main Content Area**: Fluid with max-w-screen-2xl container, px-6 py-8
- **Dashboard Cards**: Grid layout using grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Data Tables**: Full-width within containers, horizontal scroll on mobile
- **Forms**: Max-w-3xl centered for scoring inputs

---

## Component Library

### Navigation & Layout

**Top Header Bar**:
- Height: h-16
- Contains: Logo/System title (left), User profile menu with role badge (right)
- Sticky position for context retention

**Sidebar Navigation** (Role-specific menus):
- Admin: Dashboard, Quản lý đơn vị, Quản lý cụm, Tiêu chí thi đua, Kỳ thi đua, Báo cáo
- Cluster Leader: Dashboard, Đơn vị của tôi, Chấm điểm cụm, Báo cáo cụm
- Unit User: Dashboard, Tự chấm điểm, Kết quả, Lịch sử
- Active state: Subtle filled background, left border accent
- Spacing: py-3 px-4 per item, gap-1 between items

### Data Tables (Critical Component)

**Scoring Table Structure**:
```
Columns: STT | Nhóm tiêu chí | Tiêu chí cụ thể | Điểm tối đa | Tự chấm | Cụm chấm | Điểm duyệt | Nhận xét
```

**Table Design**:
- Header: Sticky (sticky top-0), medium background contrast
- Rows: Alternating subtle background (even rows slightly darker)
- Cell padding: px-4 py-3
- Borders: Border-b between rows (not vertical borders)
- Input fields within cells: Borderless with focus ring, w-20 for score inputs
- Comments column: Expandable textarea, min w-48

**Row Groups** (by Criteria Group):
- Group headers with slightly bolder background
- Indent criteria rows with pl-8

### Dashboard Cards

**Statistics Cards**:
- Elevation: shadow-md with subtle border
- Padding: p-6
- Structure: Icon + Label + Value + Trend indicator
- Layout: Flex column, items-start

**Progress Cards**:
- Show evaluation completion status
- Progress bars: h-2 rounded-full
- Percentage display: text-sm font-medium

### Forms & Inputs

**Input Fields**:
- Height: h-10 for text inputs
- Padding: px-3
- Border: Border with focus ring (ring-2 on focus)
- Labels: Above input, text-sm font-medium mb-2

**Select Dropdowns**:
- Height: h-10
- Full-width within form context
- Clear visual hierarchy for nested options (Cluster → Units)

**Buttons**:
- Primary Action: h-10 px-6 font-medium rounded-md
- Secondary: Outlined variant
- Icon buttons: w-10 h-10 squared or rounded-full for actions

**Filter Panel**:
- Horizontal layout on desktop, vertical on mobile
- Gap-4 between filter controls
- Grouped by logical sections (Period, Cluster, Unit, Status)

### Modal Dialogs

**Criteria Management Modal**:
- Max-w-4xl centered
- Header with title + close button
- Body with scrollable content (max-h-[70vh])
- Footer with action buttons (Cancel/Save)

**Confirmation Dialogs**:
- Max-w-md
- Clear action distinction (destructive actions in red tone)

---

## Role-Based Visual Indicators

- **Admin**: Accent color for nav items, "Quản trị viên" badge
- **Cluster Leader**: Different accent, "Cụm trưởng" badge, cluster name display
- **Unit User**: Different accent, "Đơn vị" badge, unit name display

Badges: Rounded-full px-3 py-1 text-xs font-medium

---

## Images

**Dashboard Illustrations** (Optional enhancement):
- Empty states: Friendly illustrations for "Chưa có dữ liệu" (no data)
- Success states: Checkmark illustrations for completed evaluations
- Placement: Center of empty data tables or card content areas
- Style: Line art, minimal, professional

**No hero images** - This is a data application, not marketing content.

---

## Responsive Behavior

- **Desktop (lg:)**: Full sidebar + main content
- **Tablet (md:)**: Collapsible sidebar, stacked dashboard cards (2 columns)
- **Mobile (base:)**: Hidden sidebar (hamburger menu), single column layout, horizontal scroll tables

---

## Accessibility

- Form labels explicitly associated with inputs
- ARIA labels for icon-only buttons
- Keyboard navigation for table rows
- Focus visible styles on all interactive elements
- Sufficient contrast ratios for text (WCAG AA minimum)

---

## Key Screens Overview

1. **Login Page**: Centered card (max-w-md), logo, username/password fields, role selection optional
2. **Admin Dashboard**: 4-column stats grid + recent activity table + quick actions
3. **Scoring Interface**: Filter bar + comprehensive data table (main focus)
4. **Criteria Management**: Nested list with expand/collapse + CRUD modals
5. **Reports Page**: Filter controls + data visualization + export buttons

This system prioritizes **data density, clarity, and efficient workflows** over visual flourish, appropriate for government administrative software.