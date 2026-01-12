# Quicklyway

A modern freelance platform built as a robust, single-repository Next.js application. This project features a high-quality, responsive frontend designed with Tailwind CSS and Shadcn UI, tightly integrated with serverless API routes for a seamless full-stack experience.

## 🎨 Design System & UI

The application follows a modern, clean aesthetic characterized by a "Box/Card" layout and deeply rounded corners, resembling the friendly yet professional vibe of platforms like Fiverr or Upwork but with a distinct identity.

- **UI Library**: [Shadcn UI](https://ui.shadcn.com/) (based on Radix Primitives).
- **Styling**: Tailwind CSS with custom configuration.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Typography**: Geist Sans & Geist Mono (Next.js fonts).

### Visual Identity
- **Primary Color**: Emerald Green - Managed via `--color-primary` in `globals.css`.
- **Surface**: Clean white backgrounds (`bg-card`/`bg-background`) on a soft neutral-gray canvas (`bg-secondary`/`bg-muted`).
- **Shape**: Consistent usage of `rounded-[2.5rem]` for main content containers and `rounded-[1.5rem]` for secondary elements.

---

## 🧩 Core Features

### 1. Authentication
Secure email/password authentication flow with JWT tokens.
- **Routes**: `/login`, `/signup`, `/forgot-password`.
- **API**: Internal Next.js API routes (`/api/auth/*`) handling secure sessions.

### 2. Service Discovery
- **Home Page**: Global search, category filters, and service listings.
- **Service Details**: Detailed service pages with galleries, reviews, and provider info.

### 3. Freelancer & Client Portals
- **Workspaces**: Dedicated dashboard views for managing projects, proposals, and orders.
- **Seller Application**: Capability for users to apply to become sellers.

### 4. Admin Dashboard
A comprehensive management interface for platform administrators to moderate services, manage users, and oversee platform health.

---

## 🏗 Architecture

Quicklyway uses a **Single-Repo, Full-Stack Next.js** architecture.

- **Frontend**: Next.js App Router (`frontend/app`).
- **Backend**: Next.js API Routes (`frontend/app/api`).
- **Database**: MongoDB with Mongoose (Models located in `frontend/lib/models`).
- **Deployment**: Optimized for Vercel or any Node.js hosting.

### File Structure
```bash
frontend/
├── app/
│   ├── api/            # Backend API routes (Auth, Users, Services)
│   ├── admin/          # Admin dashboard pages
│   └── (routes)/       # Public pages (Login, Home, Service)
├── components/         # Reusable UI components
├── lib/
│   ├── db.js           # Database connection
│   ├── models/         # Mongoose models (User, Project, etc.)
│   └── utils/          # Shared utilities (JWT, Email)
└── public/             # Static assets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 20.9.0)
- npm (>= 10.0.0)
- MongoDB Connection URI

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env.local` file in the `frontend` directory:
   ```env
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=/api

   # Database
   MONGODB_URI=mongodb+srv://...

   # Secrets
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret

   # Email Service (Resend)
   RESEND_API_KEY=re_...
   EMAIL_FROM=Quicklyway <onboarding@resend.dev>
   ```

### Development

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

To create a production build:
```bash
npm run build
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB + Mongoose
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI (Radix UI)
- **Email**: Resend
- **Auth**: JWT (Custom Implementation)

## License
MIT
