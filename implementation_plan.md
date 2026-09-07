# Smart Government Grievance Portal — Implementation Plan

## Overview

Build a complete, production-quality **Smart Government Grievance Portal** UI using React + Vite + Tailwind CSS + shadcn/ui. The application will serve four user roles: **Citizens, Officers, Department Admins, and Super Admins**, each with dedicated dashboards and workflows.

The design philosophy is **Modern Government Digital Service** — professional, trustworthy, accessible, flat UI with navy/white/saffron palette.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React + Vite | Framework & build tool |
| Tailwind CSS v3 | Utility-first styling |
| shadcn/ui + Radix UI | Headless accessible components |
| Lucide React | Icon system |
| Recharts | Analytics charts |
| React Leaflet | Map integration |
| React Hook Form + Zod | Form validation |
| TanStack Table | Data tables |
| React Router v6 | Client-side routing |
| i18next | Internationalization (EN/MR/HI) |
| Sonner | Toast notifications |

---

## Architecture

```
src/
├── assets/              # Static assets
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── layout/          # AppShell, Header, Sidebar
│   ├── complaint/       # Complaint cards, timeline, status badges
│   ├── forms/           # Reusable form fields
│   ├── tables/          # TanStack table wrappers
│   ├── charts/          # Recharts wrappers
│   ├── maps/            # Leaflet map components
│   ├── notifications/   # Notification center
│   └── modals/          # Confirmation dialogs
├── pages/
│   ├── public/          # Landing, About, Services, FAQ
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── citizen/         # Dashboard, Complaints, Profile
│   ├── officer/         # Officer dashboard & complaint management
│   └── admin/           # Admin dashboard, reports, management
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, validators, constants
├── services/            # API service layer (mock, ready for real API)
├── store/               # Context/state management
├── i18n/                # Translations (en, mr, hi)
├── types/               # TypeScript-style JSDoc types
└── data/                # Mock data (easily replaceable)
```

---

## Routes

| Path | Component | Role |
|---|---|---|
| `/` | LandingPage | Public |
| `/about` | AboutPage | Public |
| `/services` | ServicesPage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/forgot-password` | ForgotPasswordPage | Public |
| `/track` | TrackComplaintPage | Public |
| `/dashboard` | CitizenDashboard | Citizen |
| `/complaints` | ComplaintListPage | Citizen |
| `/complaints/new` | NewComplaintPage | Citizen |
| `/complaints/:id` | ComplaintDetailPage | Citizen |
| `/notifications` | NotificationsPage | Citizen |
| `/profile` | ProfilePage | Citizen |
| `/help` | HelpPage | Public |
| `/faq` | FAQPage | Public |
| `/officer` | OfficerDashboard | Officer |
| `/officer/complaints` | OfficerComplaintList | Officer |
| `/officer/complaints/:id` | OfficerComplaintDetail | Officer |
| `/officer/profile` | OfficerProfile | Officer |
| `/admin` | AdminDashboard | Admin |
| `/admin/complaints` | AdminComplaintList | Admin |
| `/admin/departments` | DepartmentManagement | Admin |
| `/admin/officers` | OfficerManagement | Admin |
| `/admin/categories` | CategoryManagement | Admin |
| `/admin/sla` | SLAManagement | Admin |
| `/admin/reports` | ReportsPage | Admin |
| `/admin/analytics` | AnalyticsPage | Admin |
| `/admin/settings` | SettingsPage | Admin |

---

## Color System (CSS Variables)

```css
--color-primary: #123B63;      /* Deep Navy Blue */
--color-secondary: #1D5D91;    /* Government Blue */
--color-accent: #E67E22;       /* Saffron/Orange */
--color-success: #2E7D32;
--color-warning: #ED6C02;
--color-danger: #C62828;
--color-bg: #F5F7FA;
--color-surface: #FFFFFF;
--color-text-primary: #17202A;
--color-text-secondary: #5F6B76;
--color-border: #D9DEE5;
```

---

## Pages to Build (Priority Order)

### Phase 1 — Foundation
1. Project scaffold (Vite + Tailwind + shadcn setup)
2. Design system & CSS variables
3. AppShell (Header + Sidebar + Layout)
4. i18n setup (EN/MR/HI)
5. Mock data layer + service stubs

### Phase 2 — Public Pages
6. Landing Page (Hero + Quick Services + How It Works + Stats)
7. About Page
8. Services Page
9. Login Page
10. Register Page
11. Forgot Password Page
12. Track Complaint (public)
13. Help / FAQ Page

### Phase 3 — Citizen Pages
14. Citizen Dashboard
15. Complaint List Page
16. New Complaint (multi-step form)
17. Complaint Detail + Timeline
18. Notifications Page
19. Profile Page
20. Feedback Page

### Phase 4 — Officer Pages
21. Officer Dashboard
22. Officer Complaint List
23. Officer Complaint Detail (with actions)
24. Officer Profile

### Phase 5 — Admin Pages
25. Admin Dashboard (charts + KPIs)
26. Admin Complaint List
27. Department Management
28. Officer Management
29. Category Management
30. SLA Management
31. Reports Page
32. Analytics Page
33. Settings Page

### Phase 6 — Map & AI
34. Government Map Dashboard
35. AI Analysis UI (integrated into complaint pages)

---

## Key Design Decisions

- **No gradients** — flat color backgrounds only
- **Border radius**: 8px on cards, 6px on inputs, 4px on badges
- **Shadows**: single subtle shadow `0 1px 3px rgba(0,0,0,0.08)`
- **Font**: Inter from Google Fonts (with Noto Sans Devanagari fallback for MR/HI)
- **Sidebar**: 240px wide, collapsible on desktop, drawer on mobile
- **Status badges**: always text + color, never color-only (WCAG compliance)
- **Tables**: TanStack Table with server-ready pagination interface
- **Forms**: React Hook Form + Zod, inline validation
- **Toasts**: Sonner, bottom-right, subtle styling

---

## Verification Plan

### Automated
- `npm run build` — ensure zero build errors
- `npm run dev` — smoke test all routes

### Manual
- Check all routes resolve correctly
- Verify responsive layout on 320px, 768px, 1280px widths
- Confirm color contrast ratios meet WCAG AA
- Verify multi-step complaint form flow works end-to-end
- Confirm officer and admin dashboards show correct mock data
- Test language switcher (EN/MR/HI)
- Test skeleton loading states
- Test empty states
- Test error states
