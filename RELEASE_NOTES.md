# Release Notes - Quicklyway Service Provider Marketplace

## Overview
Full-featured service provider (Fiverr-like) marketplace: authentication, service discovery, real-time messaging, offers and orders, reviews, disputes, notifications, support tickets, admin dashboard, and seller onboarding. Built with Next.js, Prisma, PostgreSQL, and Socket.IO. **Branding**: Quicklyway original logo and favicon applied across the app.

---

## 🔐 Authentication

### Auth Flows
- **Login / Signup**: Email and password with JWT access and refresh tokens
- **Forgot password**: Request reset link; email sent via Resend
- **Reset password**: Token-based reset from email link; success/error feedback via toaster (fixed)
- **Change password**: Authenticated users can change password (auth and user profile)
- **Profile**: Get/update current user (auth/profile, user/profile)

### Security
- **JWT**: Access and refresh tokens; refresh rotation
- **API**: Auth routes under `/api/auth/*` (login, signup, forgot-password, reset-password, me, refresh, profile, change-password)

---

## 🛍 Service Discovery & Management

### Public Service Discovery
- **Home page**: Service listings with global search, category filters, and service cards
- **Service detail**: Full service page with gallery, description, pricing, payment methods, seller info, reviews, and “Contact” / “Order” actions
- **Search**: Full-text and filter-based search; results from public services

### Seller Service Management
- **Create service**: Sellers create services with title, description, category, subcategory, price, delivery, images/cover, skills, search tags, payment methods/region, contact visibility
- **Service post first step — add profile**: When creating a service (service post), first step can include or require profile completion so seller profile is set before listing services
- **Edit service**: Full edit from dashboard (dashboard/freelancer/services/[id]/edit)
- **List my services**: Seller’s services in dashboard with stats

### Service Data
- **Categories**: Hierarchical (main categories → subcategories); admin-managed
- **Skills**: Per-category skills; sellers attach skills to services; users can request new skills (admin approve/reject)
- **Keywords**: Admin-managed keywords (SEO); users can request keywords (admin approve/reject)
- **Search tags**: Free-form tags on services for discovery

---

## 📂 Categories, Skills & Keywords (Admin + User Requests)

### Categories
- **Admin CRUD**: Create/update/delete main categories and subcategories
- **Category tree**: Parent/child; slugs; active flag
- **Category-full-create**: Bulk create category structure
- **Skills per category**: Admin assigns or creates skills per category

### Skills
- **Approval**: PENDING (creator-only) → APPROVED (global) or REJECTED
- **User request**: Sellers request new skills via `/api/skills/request`; admin approves/rejects in admin/skills
- **Service skills**: Services link to approved (or creator’s pending) skills

### Keywords (SEO)
- **Admin**: CRUD keywords; volume, difficulty, rank, trend, active, approval
- **User request**: Users request keywords; admin approves/rejects
- **Admin SEO page**: Dedicated SEO/keyword management (admin/seo)

---

## 🔍 Search & Discovery

### Search Features
- **Search suggestions**: API suggests queries (e.g. from services, categories)
- **Trending searches**: Popular search terms (SearchKeyword model)
- **Search history**: Per-user search history support (API and lib)
- **Filters**: Category, subcategory, skills, price, and other filters on service listing

---

## 💼 Offer System (Seller to Client)

### Offer Creation
- **Seller-initiated**: Sellers can create and send offers to clients
- **Service-based**: Offers are created for seller's own services
- **Offer details**: Includes custom pricing, delivery time, revisions, scope of work, and cancellation policy
- **Initial status**: Offers start with `PENDING` status
- **No order created**: Offers do NOT create orders automatically - order is created only when client accepts
- **Real-time notifications**: Socket.IO events notify clients when new offers are received

### Offer Information
- Service details and pricing (custom or service default)
- Delivery timeline (customizable days)
- Number of revisions included
- Detailed scope of work
- Cancellation policy
- Client and seller information
- Conversation linking (if offer created from chat)

### Offer Acceptance
- **Client action**: Clients can accept offers they receive
- **Order creation**: When client accepts an offer, an order is automatically created
- **Status transition**: Offer status changes to `ACCEPTED`, order status starts as `IN_PROGRESS`
- **Direct to work**: Since offer was already accepted, order skips `PENDING_ACCEPTANCE` and goes directly to `IN_PROGRESS`
- **Order linking**: Created order is linked to the original offer
- **Real-time notifications**: Both seller and client receive notifications

### Offer Rejection
- **Client action**: Clients can reject offers with an optional reason
- **Status update**: Offer status changes to `REJECTED`
- **No order created**: Rejected offers do not create orders
- **Seller notification**: Seller is notified of the rejection
- **Rejection reason**: Optional reason can be provided by client

### Offer Workflow
1. **Seller creates offer** → Status: `PENDING`
2. **Client receives offer** → Can accept or reject
3. **If accepted** → Order created, Offer status: `ACCEPTED`, Order status: `IN_PROGRESS`
4. **If rejected** → Offer status: `REJECTED`, No order created

---

## 🛒 Order Creation

### Order Placement (Two Methods)

#### Method 1: Direct Order Creation
- **Client-initiated orders**: Clients can create orders directly from service pages
- **Order details**: Includes service selection, custom pricing (optional), delivery time, and revision count
- **Order number generation**: Unique order numbers (e.g., ORD-2024-001) automatically generated
- **Initial status**: Orders start with `PENDING_ACCEPTANCE` status
- **Real-time notifications**: Socket.IO events notify sellers when new orders are created

#### Method 2: Order from Accepted Offer
- **Automatic creation**: Orders are automatically created when client accepts a seller's offer
- **Status**: Orders from accepted offers start directly at `IN_PROGRESS` (skip acceptance step)
- **Offer linking**: Order is linked to the original offer
- **Same details**: Order inherits all details from the accepted offer (price, delivery time, revisions, etc.)

### Order Information
- Service details and pricing
- Delivery timeline (customizable days)
- Number of revisions included
- Client and seller information
- Conversation linking (if order created from chat)

---

## ✅ Order Acceptance & Workflow

### Order Acceptance
- **Seller action**: Sellers can accept or reject incoming orders
- **Status transition**: Upon acceptance, order status changes to `IN_PROGRESS`
- **Work begins**: Seller can start working on the order immediately after acceptance

### Order Rejection
- **Rejection option**: Sellers can reject orders with a reason
- **Status update**: Order status changes to `REJECTED`
- **Client notification**: Client is notified of the rejection

---

## 📦 Order Delivery System

### Initial Delivery
- **Delivery submission**: Sellers (service providers) can deliver work with files, messages, or both
- **Status change**: Order status changes to `DELIVERED` upon submission
- **Client notification**: Client receives notification of delivery
- **Waiting state**: Seller sees "Waiting for client response" message

### Revision Requests
- **Client action**: Clients can request revisions if work doesn't meet requirements
- **Revision limit**: System tracks revisions used vs. revisions included
- **Status change**: Order status changes to `REVISION_REQUESTED`
- **Seller response**: Seller can re-deliver work, status returns to `DELIVERED`
- **Revision tracking**: System automatically tracks number of revisions used

### Delivery Acceptance
- **Client approval**: Clients can accept delivery and complete the order
- **Status change**: Order status changes to `COMPLETED`
- **Completion timestamp**: System records completion date and time
- **Review prompt**: Client is prompted to review the seller

---

## ❌ Order Cancellation

### Cancellation Rules
- **Pre-delivery cancellation**: Orders can be cancelled before delivery
- **Status restriction**: Cancellation only allowed for `PENDING_ACCEPTANCE` or `IN_PROGRESS` status
- **Post-revision restriction**: Once revision is requested, cancellation is not allowed
- **Cancellation reason**: Required reason must be provided
- **Cancellation tracking**: System records who cancelled and when

---

## ⚖️ Dispute Management

### Opening Disputes
- **Post-delivery option**: Clients can open disputes after delivery
- **Dispute details**: Includes reason and description
- **Status change**: Order status changes to `DISPUTED`
- **Resolution tracking**: Disputes are tracked separately for admin review

### Dispute as Ticket & Thread
- **Dispute as ticket**: Order disputes are handled in a ticket-like flow; admin can manage from disputes area
- **Thread**: Each dispute has a thread (comments/messages) for back-and-forth between parties and admin resolution

---

## ⭐ Review System

### Review Types

#### Order-Based Reviews
- **Linked to orders**: Reviews are directly linked to completed orders
- **Service association**: Reviews also linked to the service/gig
- **Two-way reviews**: Both client and seller can review each other

#### Service-Based Reviews
- **Standalone reviews**: Reviews can be created for services without orders
- **Service rating**: Contributes to overall service rating

### Review Workflow (Fiverr-like Rules)

#### Client Review (Mandatory First)
- **Completion trigger**: Review popup appears when order is completed
- **Mandatory requirement**: Client review is required before seller can review
- **Review content**: Includes rating (1-5 stars) and optional comment
- **Skip option**: Client can skip initially, but "Create Review" button remains visible
- **One-time review**: Client reviews cannot be edited after submission
- **Profile update**: Seller's rating and review count updated automatically

#### Seller Review (Unlocked After Client Review)
- **Unlock condition**: Seller can only review after client has reviewed
- **Review content**: Includes rating (1-5 stars) and optional comment
- **Client profile update**: Client's rating and review count updated automatically
- **One-time review**: Seller reviews cannot be edited after submission

### Review Display

#### Order Detail Page
- **Review section**: Dedicated section showing all reviews for the order
- **Client view**: Shows seller's review of client (if available)
- **Seller view**: Shows client's review and can review client after client reviews

#### Service Detail Page
- **Combined reviews**: Shows both service-based and order-based reviews
- **Rating calculation**: Average rating calculated from all reviews
- **Review count**: Total review count displayed
- **Rating distribution**: Visual breakdown of ratings (5-star, 4-star, etc.)

#### Service Cards
- **Rating display**: Shows average rating and total review count
- **Quick view**: Users can see service quality at a glance

#### Seller Profile Page
- **All reviews**: Displays all reviews from all gigs/services
- **Order-based reviews**: Shows reviews linked to completed orders
- **Review details**: Includes reviewer info, rating, comment, order price, duration, and service thumbnail
- **Repeat client badge**: Highlights clients who have multiple orders

### Review Features
- **Rating system**: 1-5 star rating scale
- **Comments**: Optional text comments for detailed feedback
- **Reviewer information**: Shows reviewer's profile, name, and avatar
- **Order context**: Reviews show associated order details (price, duration, service)
- **Timestamp**: Review creation date displayed
- **Non-editable**: Reviews cannot be edited after submission (both client and seller)

---

## 📊 Order Management Features

### Order Status Tracking
- **Status flow**: PENDING_ACCEPTANCE → IN_PROGRESS → DELIVERED → COMPLETED
- **Status visibility**: Both client and seller can see current order status
- **Status history**: Order events track all status changes

### Order Filtering & Search
- **Status filter**: Filter orders by status (pending, in progress, delivered, completed, etc.)
- **Service filter**: Filter orders by specific service
- **Role-based views**: Clients see their orders, sellers see their orders
- **Pagination**: Support for large order lists

### Order Details
- **Complete information**: Service details, pricing, delivery timeline
- **Participant info**: Client and seller profiles with ratings
- **Delivery history**: All deliverables and revisions tracked
- **Event timeline**: Complete order event history
- **Dispute information**: Dispute details if applicable

---

## 💬 Messaging (Real-Time Chat)

### Overview
Real-time messaging via Socket.IO: conversations between two users, linked to offers and orders when applicable.

### Conversation & Messages
- **Conversations**: Get or create 1:1 conversation between two users (used when client contacts seller)
- **List conversations**: Socket event `get_conversations` → `conversations:fetched` with list and unread counts
- **Open conversation**: By `conversationId` or create new with `otherUserId` (e.g. from service page “Contact”)
- **Send message**: Socket `send_message`; optimistic UI; `new_message` event for delivery
- **Create conversation**: Socket `create_conversation` with `otherUserId` when starting new chat
- **Message types**: Text; support for image/video/file and offer/order context in schema

### In-Chat Offers & Orders
- **Create offer from chat**: Sellers can send offers from conversation (CreateOfferModal); offer appears in thread
- **Order from offer**: When client accepts offer, order is created and linked to conversation
- **Order in chat**: Messages can reference order (orderId); conversation linked to order for context

### UX
- **Typing indicator**: Real-time typing status
- **Read receipts**: Delivered/seen tracking (deliveredAt, seenAt, lastReadAt)
- **Unread counts**: Per-conversation unread; mark read on open
- **Messages page**: `/messages` with ChatContainer (list + thread)

---

## 🔔 Real-time Features

### Socket.IO Integration
- **Offer events**: Real-time notifications when offers are created, accepted, or rejected
- **Order events**: Real-time notifications for order status changes
- **Delivery notifications**: Instant notifications when work is delivered
- **Review notifications**: Notifications when reviews are submitted
- **Status updates**: Live order/offer status updates without page refresh
- **Messaging**: Conversations list, get/create conversation, send message, new_message, typing, read receipts
- **Presence**: Logged-in presence (full); public namespace for guest-visible freelancer online status

---

## 🔔 In-App Notification System

### Overview
Central notification system with bell icon in all headers, real-time toasts, optional sound, and type-based icons. Notifications are stored per user and shown in a dropdown.

### Bell Icon & Dropdown
- **All headers**: Notification bell appears in main site Header, Dashboard header, and Admin header when the user is logged in
- **Unread badge**: Red badge shows unread count (e.g. 9+ for 10 or more)
- **Dropdown**: Clicking the bell opens a list of notifications with title, body, and time-ago
- **Mark as read**: Single notification or “Mark all read” to clear unread state
- **Layout**: Fiverr-style rows with type icon on the left, optional thumbnail on the right

### Notification Types & Icons
- **Order / offer**: Shopping bag icon — new offer, offer accepted, offer declined, order updates
- **Seller application**: Checkmark (success) — seller request approved or rejected
- **Message**: Mail icon — chat/message related
- **Gig / brief**: Briefcase icon — gig or opportunity related
- **General**: Bell icon — everything else

### Real-Time Toast
- **On new notification**: When a notification is received (Socket.IO), a toast appears with title and description
- **Type-based style**: Success toasts for approvals; default toasts with the correct icon for order/message/gig
- **Only for current user**: Toasts and list show only the logged-in user’s notifications; no cross-user data

### Sound
- **On receive**: A short sound plays when a new notification arrives (toast moment)
- **Custom sound**: Optional `public/sounds/notification.mp3` is used if present
- **Fallback**: If no file or playback fails, a two-tone chime is played via Web Audio API
- **Mute**: Stored in `localStorage` key `quicklyway-notification-sound`; set to `'false'` to disable sound

### Browser Notifications (Optional)
- **Permission**: Browser notification permission can be requested when the user is logged in
- **When sent**: If permission is granted, a native browser notification is also shown for new notifications
- **Click**: Clicking the browser notification focuses the app

### Offer & Order Notifications
- **Seller creates offer** → Client gets: “New offer received” with seller name and service title
- **Client accepts offer** → Seller gets: “Offer accepted” and “Order created — you can start working”
- **Client rejects offer** → Seller gets: “Offer declined”
- **Links**: Notifications include `data.linkUrl` for messages or order page where applicable

### Chat / Message Notifications
- **Real-time message notification**: New chat messages trigger real-time notifications (Socket.IO)
- **Toast & sound**: Incoming message shows toast and optional sound (same as other notification types)
- **Bell dropdown**: Message notifications appear in the notification bell dropdown with mail icon

### Technical Notes
- **API**: `GET /api/notifications` (paginated), `PATCH /api/notifications` (mark read)
- **Store**: Zustand store for list, unread count, and “last added” for toast/sound
- **Socket**: Server emits to `user:{userId}`; client only adds notifications when `notification.userId` matches current user
- **Login/logout**: Store is reset on logout; on login (or account switch) notifications are re-fetched so the bell never shows another user’s data

---

## 🛒 Become Seller (Seller Application)

### Overview
Clients can apply to become sellers (service providers). Admins review requests and approve or reject them. Applicants are notified of the decision.

### Applicant Flow
- **Become Seller page**: Dedicated page (e.g. `/become-seller`) for clients to submit a seller application (become as seller)
- **Application data**: Typically full name, skills, bio, portfolio, etc., as configured
- **Status**: Application is created with status `PENDING`
- **Pending state**: UI can show “Request pending” or similar until admin acts
- **Request approved**: When admin approves, user becomes seller; “Become as seller request approved” (and “Become as client” via role agreement) notifications delivered

### Admin Flow
- **Seller requests**: Admin area (e.g. `/admin/seller-requests`) lists all pending and processed seller applications
- **Approve**: Admin can approve a request; user becomes an approved seller and can access seller dashboard and create offers
- **Reject**: Admin can reject with an optional reason; user stays client-only
- **Audit**: Admin can see request details and history

### Notifications
- **On approval**: Applicant receives an in-app notification (e.g. “Seller request approved” / “You now have access to the seller dashboard”) and optional email if implemented
- **On rejection**: Applicant can be notified (e.g. “Seller request rejected” with reason if provided)
- **Real-time**: Notifications are delivered via Socket.IO when the user is online, and stored for when they return

### Status & Access
- **Seller status**: User model has `sellerStatus` (e.g. NONE, PENDING, APPROVED, REJECTED) and `isSeller`
- **After approval**: User can switch to seller view, create services, send offers, and manage orders as a seller
- **After rejection**: User remains client; can re-apply if the flow allows

---

## 📋 Role Agreement (Join as Client / Join as Freelancer)

### Overview
Users can request to “join as client” or “join as freelancer” by agreeing to terms; admins approve or reject. Separate from “Become Seller” (seller application).

### Flow
- **Join as Client / Join as Freelancer pages**: User agrees to terms and submits request (`RoleAgreementRequest` with `requestedRole`: CLIENT or FREELANCER)
- **Status**: PENDING → APPROVED or REJECTED by admin
- **Become as client request approved**: When admin approves a “Join as Client” request, user is notified; same for “Join as Freelancer”
- **API**: `POST /api/role-agreement-requests`, `GET /api/role-agreement-requests/my`; admin: `GET /api/admin/role-agreement-requests`, `PATCH .../status`
- **Admin**: Join requests list and approve/reject in admin/join-requests

---

## 🎫 Support Tickets

### Overview
Contact/support system: users can open tickets; admins/agents manage and reply. Dedicated support ticket design and thread-based conversation. Separate from order disputes.

### Design & UX
- **Support ticket design**: Dedicated UI for ticket list and ticket detail with clear status, labels, and thread layout
- **My support tickets**: User-facing page listing all own tickets at `/support` (My support tickets)
- **Ticket thread**: Each ticket has a full message thread; open ticket at `/support/[id]` to view and reply in thread

### User Flow
- **Contact / Submit ticket**: Public or logged-in user submits ticket (title, description, full name, email, optional attachments)
- **My tickets**: Logged-in users can see their tickets at `/support` and open ticket detail `/support/[id]` with full thread
- **Messages**: Thread of messages on each ticket; attachments supported
- **API**: `POST /api/support/contact`, `GET/POST /api/support/tickets`, `GET/PATCH /api/support/tickets/[id]`, `POST /api/support/tickets/[id]/messages`

### Admin Flow
- **Support tickets**: List all tickets; filter by status (OPEN, AGENT_ASSIGNED, RESOLVED)
- **Assign agent**: Assign admin/agent to ticket
- **Reply**: Add messages as AGENT/ADMIN; resolve ticket
- **Pages**: admin/support-tickets, admin/support-tickets/[id]

---

## 🛠 Admin Dashboard

### Implemented Admin Features
- **Dashboard**: Stats overview (admin/stats)
- **Users**: List and manage users (admin/users)
- **Orders**: List all orders; order detail (admin/orders, admin/orders/[id])
- **Disputes**: List disputes; detail with comments and resolution (admin/disputes, admin/disputes/[id])
- **Reviews**: List reviews; approve/flag (admin/reviews, admin/reviews/[id])
- **Categories**: CRUD main and subcategories; skills per category (admin/categories, create, [id]/edit)
- **Skills**: List skills; approve/reject user-requested skills (admin/skills)
- **Keywords**: List and manage keywords; approve/reject requests (admin/keywords); **SEO page** (admin/seo) for keyword/SEO management
- **Seller requests**: Become-seller applications; approve/reject (admin/seller-requests)
- **Join requests**: Role agreement (join as client/freelancer) approve/reject (admin/join-requests)
- **Support tickets**: List, assign agent, reply, resolve (admin/support-tickets, admin/support-tickets/[id])
- **Admins**: Manage admin users (admin/admins)
- **Settings**: Admin settings (admin/settings)
- **Profile**: Admin profile (admin/profile)

---

## 📊 Seller (Freelancer) Dashboard

### Implemented Seller Features
- **Dashboard home**: Stats and overview (dashboard/freelancer)
- **Services**: List, create, edit services (dashboard/freelancer/services, create, [id]/edit)
- **Orders**: List orders; order detail with deliver/revision/complete (dashboard/freelancer/orders, orders/[id])
- **Disputes**: List and view disputes (dashboard/freelancer/disputes)
- **Messages**: Real-time chat (dashboard/freelancer/messages → shared messages experience)
- **Earnings**: Earnings page (dashboard/freelancer/earnings)
- **Availability**: Set availability (dashboard/freelancer/availability)
- **Reviews**: Reviews received (dashboard/freelancer/reviews)
- **Settings**: Seller settings (dashboard/freelancer/settings)

---

## 🟢 Public Presence (Online Status)

### Overview
Guests and logged-in users can see whether sellers (freelancers) are online, without exposing private presence data.

### Implementation
- **Socket.IO public namespace** (`/presence`): No auth; server broadcasts list of online freelancer IDs only
- **Logged-in users**: Full presence (e.g. who is chatting with whom) via main socket namespace
- **Guests**: `usePublicPresence` hook and store; only freelancer IDs; `UserStatus` component shows “Online” on service/profile when freelancer is online
- **Privacy**: No client presence to guests; no private data on public namespace

---

## 👤 User Profiles

### Public Seller Profile
- **Page**: `/freelancer/[id]` — public profile with bio, portfolio, services, reviews, rating, review count
- **API**: `GET /api/freelancer/[id]` for public profile data
- **Profile fields**: Name, profile image, cover, bio, portfolio, languages, location, years of experience, availability, rating, review count

### Profile Edit
- **Edit profile**: Logged-in users edit own profile (profile/edit); update name, bio, portfolio, images, contact visibility, etc.
- **API**: `GET/PATCH /api/user/profile`

---

## 📤 File Upload

- **Upload signature**: `GET /api/upload/signature` for client-side upload (e.g. signed URL for S3 or similar); used for service images, attachments, etc.

---

## 🎯 Key Business Rules

### Offer Rules
1. Only sellers can create offers for their own services
2. Only clients can accept or reject offers
3. Offers must be in `PENDING` status to be accepted or rejected
4. Accepted offers automatically create orders with `IN_PROGRESS` status
5. Rejected offers do not create orders
6. Each offer can only be accepted once (one-to-one relationship with orders)

### Order Rules
1. Clients cannot order their own services
2. Orders can be created directly by clients OR from accepted offers
3. Direct orders start at `PENDING_ACCEPTANCE`, offer-based orders start at `IN_PROGRESS`
4. Orders can only be cancelled before delivery or revision request
5. Delivery must be accepted before order completion
6. Revisions are tracked and limited to included count

### Review Rules
1. Client review is mandatory first for order-based reviews
2. Seller review unlocks only after client review exists
3. Reviews cannot be edited after submission
4. Reviews update user profile ratings and counts
5. Reviews are linked to both order and service

---

## 📈 User Profile Updates

### Rating Calculation
- **Average rating**: Calculated from all received reviews
- **Review count**: Total number of reviews received
- **Profile display**: Ratings and counts visible on user profiles
- **Service ratings**: Individual service ratings calculated from all related reviews

---

## 🔐 Security & Validation

### Authorization
- **Order access**: Only order participants (client/seller) can view orders
- **Review validation**: Only order participants can review
- **Action restrictions**: Status-based action restrictions enforced

### Data Validation
- **Rating validation**: Ratings must be between 1-5
- **Required fields**: Order and review creation requires valid data
- **Status validation**: Actions only allowed for appropriate order statuses

---

## 🎨 User Experience

### Order Flow
- **Intuitive workflow**: Clear status progression and action buttons
- **Visual indicators**: Status badges and progress indicators
- **Action buttons**: Context-aware buttons based on order status and user role

### Review Flow
- **Review popup**: Automatic popup on order completion
- **Review prompts**: Clear prompts and buttons for review creation
- **Review display**: Beautiful review cards with all relevant information
- **Profile integration**: Reviews seamlessly integrated into profiles

---

## 📱 Responsive Design
- **Mobile support**: All order and review features work on mobile devices
- **Tablet optimization**: Optimized layouts for tablet screens
- **Desktop experience**: Full-featured desktop experience

---

## 🚀 Performance
- **Optimized queries**: Efficient database queries for orders and reviews
- **Single API calls**: Combined data fetching to reduce API calls
- **Real-time updates**: Socket.IO for instant updates without polling

---

## 📄 UI-Only Pages (Placeholders)
- **Favorites** (`/favorites`): Saved services UI with mock data; no backend persistence yet
- **Payments** (`/payments`): Payments & invoices UI with mock data; no payment provider integration yet
- **Requests** (`/requests`): Client project requests table with mock data; project/proposal flow not wired to backend

---

## 🔄 Future Enhancements
- Order dispute resolution workflow (admin resolve/close with outcome)
- Advanced review filtering and sorting
- Review helpfulness voting
- Order templates for repeat clients
- Bulk order management
- Favorites backend (save/unsave services per user)
- Payment provider integration (e.g. Moyasar, HyperPay) and real invoices
- Client “requests” / project posting and proposals (Project/Proposal models exist in schema)

---

## 📝 Technical Notes
- **Framework**: Next.js 16 (App Router)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.IO (offers, orders, notifications, messaging, presence, real-time message notifications)
- **API**: RESTful API routes under `/api/*`; auth via JWT (access + refresh)
- **UI**: Tailwind CSS, Shadcn UI, Lucide icons
- **Branding**: Quicklyway original logo and favicon (app-wide)
- **Email**: Resend (e.g. password reset); reset password toaster feedback
- **Upload**: Signature-based upload API for external storage (e.g. S3)

---


### v1.2.0 (Feb 2026)
- **Rebrand: Freelancer → Service Provider / Seller** — All client-facing text updated to reflect service provider marketplace:
  - "Freelancer" replaced with "Seller" or "Service Provider" across the app (dashboard, orders, disputes, admin)
  - Role labels: "Client" and "Seller" (RoleSwitcher, header)
  - Order details: "Service Provider" section and badges
  - Notifications and API messages use "seller" instead of "freelancer"
  - Metadata and SEO: "Service Provider Marketplace" instead of "Freelance Marketplace"
  - Admin: "Sellers" tab, "Seller" labels in orders, disputes, and user management

### v1.1.0 (Feb 2026)
- In-app notification system (bell icon, dropdown, toasts, sound, offer/order/seller notifications)
- Become Seller flow with admin approve/reject and notifications
