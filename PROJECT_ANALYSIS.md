# Project Architecture Analysis

**Quicklyway** has been refactored into a unified Next.js Full Stack application. This architecture simplifies deployment, state management, and type safety.

## Core Architecture

### Next.js App Router
The entire application resides in the `frontend` directory, utilizing Next.js 14+ App Router for both UI pages and API endpoints.

- **Pages**: Located in `app/(routes)/*` and `app/admin/*`.
- **API**: Located in `app/api/*`. These routes replace the traditional standalone Express backend.

### Database Layer
- **Mongoose**: Used for ODM (Object Data Modeling).
- **Models**: Defined in `lib/models`. These schemas define the shape of `User`, `Project`, `Proposal`, and `SellerApplication` documents.
- **Connection**: Managed via a singleton pattern in `lib/db.js` to ensure efficient connection pooling in serverless environments.

### Authentication
A custom JWT-based authentication system handles user sessions.
- **Access Tokens**: Short-lived JWTs for API authorization.
- **Refresh Tokens**: Long-lived tokens stored in the database to renew access.
- **Security**: Passwords are hashed using `bcryptjs`.

### Shared Logic
Utilities and constants previously in a separate package are now integrated into `lib/shared` and `lib/utils`.
- **Constants**: `lib/shared/constants.js` (Role definitions, Status enums).
- **Schemas**: `lib/shared/schemas.js` (Validation logic).

## Key Workflows

### 1. User Registration
`POST /api/auth/signup`
- Validates input.
- Hashes password.
- Creates User document.
- Returns Access & Refresh tokens.

### 2. Seller Application
`POST /api/seller/apply`
- Users apply to become sellers.
- Application state is tracked (`pending` -> `approved`/`rejected`).
- Admins review applications via the Admin Dashboard.

### 3. Service Management
- Sellers create services (Projects).
- Clients browse and purchase/propose on services.

## Future Improvements
- **Real-time**: Implement WebSockets (e.g., Socket.io) for chat features.
- **Caching**: Utilize Redis for caching expensive database queries.
- **Testing**: Add E2E tests with Playwright.
