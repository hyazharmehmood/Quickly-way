# Quicklyway Monorepo

A modern freelance platform built with a monorepo architecture using npm workspaces and Turborepo. This project features a high-quality, responsive frontend designed with Next.js, Tailwind CSS, and Shadcn UI.

## 🎨 Design System & UI

The application follows a modern, clean aesthetic characterized by a "Box/Card" layout and deeply rounded corners, resembling the friendly yet professional vibe of platforms like Fiverr or Upwork but with a distinct identity.

- **UI Library**: [Shadcn UI](https://ui.shadcn.com/) (based on Radix Primitives).
- **Styling**: Tailwind CSS with custom configuration.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Typography**: Geist Sans & Geist Mono (Next.js fonts).

### Visual Identity
- **Primary Color**: Emerald Green - Managed via `--color-primary` in `globals.css` and applied using the `text-primary` or `bg-primary` utility classes.
- **Surface**: Clean white backgrounds (`bg-card`/`bg-background`) on a soft neutral-gray canvas (`bg-secondary`/`bg-muted`).
- **Shape**: Consistent usage of `rounded-[2.5rem]` for main content containers and `rounded-[1.5rem]` for secondary elements like cards and buttons.
- **Shadows**: Soft, subtle shadows (`shadow-sm`, `shadow-md`) to lift content off the page.

---
<!-- Email: admin@quicklyway.com
Password: adminPassword123 -->
## 🧩 Core Features & Components

### 1. Authentication (`/login`, `/signup`)
A robust authentication flow featuring varying layouts and validation.
- **Components**: `components/auth/Login.jsx`, `components/auth/Signup.jsx`, `components/auth/ForgotPassword.jsx`.
- **Design**:
  - Uses Shadcn `Input` and `Button` for accessible, styled forms.
  - Interactive "Show Password" toggles.
  - Form validation with visual feedback.
  - Routing managed via `next/navigation`.

### 2. Service Discovery (Home)
The landing page allows users to find services quickly.
- **Global Header**: Fixed sticky header with Search, Navigation, and Auth actions.
- **Category Filter**: Horizontal scrollable list of service categories styles as pills.
- **Service Grid**: Responsive grid layout displaying `ServiceCard` components.

### 3. Service Details (`/service/[id]`)
A dynamic, data-rich page displaying full details of a specific service.
- **Layout**: 
  - **Grid System**: 2-column layout (Main Content + Sticky Sidebar) on large screens.
  - **Boxy/Card Architecture**: Every section (Header, Description, Gallery, Reviews) is wrapped in a Shadcn `Card` with `rounded-[2.5rem]` to maintain consistency.
- **Key Sections**:
  - **Provider Header**: Avatar, status (online/offline), rating summary, and "Favorite" action.
  - **Gallery**: Interactive image carousel with thumbnail navigation.
  - **Sidebar**: Sticky sidebar containing Price, Working Hours, Payment Methods, and Complaint actions.
  - **Reviews**: Detailed review list with rating distribution bars.
- **Interactivity**: 
  - **Modals**: Custom Shadcn `Dialog` components for "Contact Me", "Report Service", and "Write a Review".

---

### 4. Admin Dashboard (`/admin`)
A comprehensive management interface for platform administrators.
- **Architecture**: Features a consolidated file-based routing system (`frontend/app/admin`) where each section's logic is embedded directly in its route page, eliminating intermediate component layers.
- **Design & Layout**:
  - **Fixed Shell**: Persistent `Sidebar` and `AdminHeader` components with a scrollable main content area.
  - **Unified Aesthetics**: Every page follows the "Box/Card" design using Shadcn `Card` widgets and semantic color variables.
- **Key Modules**:
  - **Dashboard**: High-level metrics and platform analytics.
  - **User & Admin Management**: Registry with status controls, role badges, and registration tracking.
  - **Service Moderation**: "Approvals" queue for authorizing new service listings.
  - **Operational Control**: Orders ledger, Dispute resolution unit, and Review moderation hub.
  - **Growth & Config**: SEO keyword tracking and a centralized System Settings panel.

---

## 🏗 Component Architecture (Frontend)

The frontend is structured to be modular and scalable (`frontend/components`).

```bash
components/
├── admin/          # Admin-specific components (Sidebar, MetricCard, etc.)
├── auth/           # Login, Signup, ForgotPwd forms
├── layout/         # Header, Footer, dynamic layouts
├── service/        # Service-related components
│   ├── ServiceCard.jsx     # Reusable card for grid/lists
│   ├── ServiceDetails.jsx  # Main details page component
│   └── modals/             # Action modals (Contact, Report, etc.)
├── ui/             # Reusable Shadcn primitives (Button, Card, Table, etc.)
└── types.js        # Shared JSDoc type definitions
```

---

## 🎨 Design System Implementation

The platform uses a unified design system that ensures consistency and theme-readability.

- **Semantic Colors**: Instead of hardcoded hex codes, components use Tailwind classes like `text-primary`, `bg-secondary`, and `border-border`, which are mapped to brand tokens in `globals.css`.
- **Absolute Imports**: Managed via `@/` alias for cleaner imports (e.g., `@/components/ui/button`).
- **Responsive Layouts**: Optimized for seamless transitions between mobile, tablet, and desktop views.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 18.0.0)
- npm (>= 9.0.0)
- MongoDB (for backend)

### Installation
Install all dependencies for frontend, backend, and shared packages:

```bash
npm install
```

### Environment Variables

#### Frontend
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Backend
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/quicklyway
JWT_SECRET=your-secret-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Development
Run both across the workspace:
```bash
npm run dev
```

### Build
```bash
npm run build
```

---

## 🛠 Tech Stack Details

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** + **Tailwind Merge**
- **Shadcn/UI** (Radix UI)
- **Lucide React** (Icons)
- **Axios** (Data Fetching)

### Backend
- **Express.js**
- **MongoDB** / **Mongoose**
- **JWT** Authentication

## Workspace Scripts
- `npm run dev` - Run full stack
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only

## License
MIT

