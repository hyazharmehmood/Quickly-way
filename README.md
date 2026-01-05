# Quicklyway Monorepo

A modern freelance platform built with a monorepo architecture using npm workspaces and Turborepo.

## Project Structure

```
quicklyway/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── shared/            # Shared JavaScript utilities, constants, and schemas
└── package.json       # Root package.json with workspaces
```

## Prerequisites

- Node.js (>= 18.0.0)
- npm (>= 9.0.0)
- MongoDB (for backend)

## Getting Started

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

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Build

Build all packages:

```bash
npm run build
```

### Linting

Lint all packages:

```bash
npm run lint
```

### Formatting

Format all code:

```bash
npm run format
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **Axios** - HTTP client
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development server
- **ESLint** - Linting
- **Prettier** - Code formatting

### Shared
- JavaScript utilities, constants, and validation schemas

## Turborepo

This monorepo uses Turborepo for managing builds and scripts with intelligent caching. The configuration is in `turbo.json`.

## Workspace Scripts

### Root Level
- `npm run dev` - Run both frontend and backend
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format all code

### Frontend
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start with Nodemon
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Git

The repository is initialized with proper `.gitignore` files. Make your initial commit:

```bash
git add .
git commit -m "Initial commit: Monorepo setup with Turborepo"
```

## License

MIT

