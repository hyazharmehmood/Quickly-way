# Release Notes - Order Management & Review System

## Overview
Complete Fiverr-like order management system with integrated review functionality, enabling seamless order lifecycle from creation to completion and review.

---

## 💼 Offer System (Freelancer to Client)

### Offer Creation
- **Freelancer-initiated**: Freelancers can create and send offers to clients
- **Service-based**: Offers are created for freelancer's own services
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
- Client and freelancer information
- Conversation linking (if offer created from chat)

### Offer Acceptance
- **Client action**: Clients can accept offers they receive
- **Order creation**: When client accepts an offer, an order is automatically created
- **Status transition**: Offer status changes to `ACCEPTED`, order status starts as `IN_PROGRESS`
- **Direct to work**: Since offer was already accepted, order skips `PENDING_ACCEPTANCE` and goes directly to `IN_PROGRESS`
- **Order linking**: Created order is linked to the original offer
- **Real-time notifications**: Both freelancer and client receive notifications

### Offer Rejection
- **Client action**: Clients can reject offers with an optional reason
- **Status update**: Offer status changes to `REJECTED`
- **No order created**: Rejected offers do not create orders
- **Freelancer notification**: Freelancer is notified of the rejection
- **Rejection reason**: Optional reason can be provided by client

### Offer Workflow
1. **Freelancer creates offer** → Status: `PENDING`
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
- **Real-time notifications**: Socket.IO events notify freelancers when new orders are created

#### Method 2: Order from Accepted Offer
- **Automatic creation**: Orders are automatically created when client accepts a freelancer's offer
- **Status**: Orders from accepted offers start directly at `IN_PROGRESS` (skip acceptance step)
- **Offer linking**: Order is linked to the original offer
- **Same details**: Order inherits all details from the accepted offer (price, delivery time, revisions, etc.)

### Order Information
- Service details and pricing
- Delivery timeline (customizable days)
- Number of revisions included
- Client and freelancer information
- Conversation linking (if order created from chat)

---

## ✅ Order Acceptance & Workflow

### Order Acceptance
- **Freelancer action**: Freelancers can accept or reject incoming orders
- **Status transition**: Upon acceptance, order status changes to `IN_PROGRESS`
- **Work begins**: Freelancer can start working on the order immediately after acceptance

### Order Rejection
- **Rejection option**: Freelancers can reject orders with a reason
- **Status update**: Order status changes to `REJECTED`
- **Client notification**: Client is notified of the rejection

---

## 📦 Order Delivery System

### Initial Delivery
- **Delivery submission**: Freelancers can deliver work with files, messages, or both
- **Status change**: Order status changes to `DELIVERED` upon submission
- **Client notification**: Client receives notification of delivery
- **Waiting state**: Freelancer sees "Waiting for client response" message

### Revision Requests
- **Client action**: Clients can request revisions if work doesn't meet requirements
- **Revision limit**: System tracks revisions used vs. revisions included
- **Status change**: Order status changes to `REVISION_REQUESTED`
- **Freelancer response**: Freelancer can re-deliver work, status returns to `DELIVERED`
- **Revision tracking**: System automatically tracks number of revisions used

### Delivery Acceptance
- **Client approval**: Clients can accept delivery and complete the order
- **Status change**: Order status changes to `COMPLETED`
- **Completion timestamp**: System records completion date and time
- **Review prompt**: Client is prompted to review the freelancer

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

---

## ⭐ Review System

### Review Types

#### Order-Based Reviews
- **Linked to orders**: Reviews are directly linked to completed orders
- **Service association**: Reviews also linked to the service/gig
- **Two-way reviews**: Both client and freelancer can review each other

#### Service-Based Reviews
- **Standalone reviews**: Reviews can be created for services without orders
- **Service rating**: Contributes to overall service rating

### Review Workflow (Fiverr-like Rules)

#### Client Review (Mandatory First)
- **Completion trigger**: Review popup appears when order is completed
- **Mandatory requirement**: Client review is required before freelancer can review
- **Review content**: Includes rating (1-5 stars) and optional comment
- **Skip option**: Client can skip initially, but "Create Review" button remains visible
- **One-time review**: Client reviews cannot be edited after submission
- **Profile update**: Freelancer's rating and review count updated automatically

#### Freelancer Review (Unlocked After Client Review)
- **Unlock condition**: Freelancer can only review after client has reviewed
- **Review content**: Includes rating (1-5 stars) and optional comment
- **Client profile update**: Client's rating and review count updated automatically
- **One-time review**: Freelancer reviews cannot be edited after submission

### Review Display

#### Order Detail Page
- **Review section**: Dedicated section showing all reviews for the order
- **Client view**: Shows freelancer's review of client (if available)
- **Freelancer view**: Shows client's review and can review client after client reviews

#### Service Detail Page
- **Combined reviews**: Shows both service-based and order-based reviews
- **Rating calculation**: Average rating calculated from all reviews
- **Review count**: Total review count displayed
- **Rating distribution**: Visual breakdown of ratings (5-star, 4-star, etc.)

#### Service Cards
- **Rating display**: Shows average rating and total review count
- **Quick view**: Users can see service quality at a glance

#### Freelancer Profile Page
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
- **Non-editable**: Reviews cannot be edited after submission (both client and freelancer)

---

## 📊 Order Management Features

### Order Status Tracking
- **Status flow**: PENDING_ACCEPTANCE → IN_PROGRESS → DELIVERED → COMPLETED
- **Status visibility**: Both client and freelancer can see current order status
- **Status history**: Order events track all status changes

### Order Filtering & Search
- **Status filter**: Filter orders by status (pending, in progress, delivered, completed, etc.)
- **Service filter**: Filter orders by specific service
- **Role-based views**: Clients see their orders, freelancers see their orders
- **Pagination**: Support for large order lists

### Order Details
- **Complete information**: Service details, pricing, delivery timeline
- **Participant info**: Client and freelancer profiles with ratings
- **Delivery history**: All deliverables and revisions tracked
- **Event timeline**: Complete order event history
- **Dispute information**: Dispute details if applicable

---

## 🔔 Real-time Features

### Socket.IO Integration
- **Offer events**: Real-time notifications when offers are created, accepted, or rejected
- **Order events**: Real-time notifications for order status changes
- **Delivery notifications**: Instant notifications when work is delivered
- **Review notifications**: Notifications when reviews are submitted
- **Status updates**: Live status updates without page refresh

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
- **Freelancer creates offer** → Client gets: “New offer received” with freelancer name and service title
- **Client accepts offer** → Freelancer gets: “Offer accepted” and “Order created — you can start working”
- **Client rejects offer** → Freelancer gets: “Offer declined”
- **Links**: Notifications include `data.linkUrl` for messages or order page where applicable

### Technical Notes
- **API**: `GET /api/notifications` (paginated), `PATCH /api/notifications` (mark read)
- **Store**: Zustand store for list, unread count, and “last added” for toast/sound
- **Socket**: Server emits to `user:{userId}`; client only adds notifications when `notification.userId` matches current user
- **Login/logout**: Store is reset on logout; on login (or account switch) notifications are re-fetched so the bell never shows another user’s data

---

## 🛒 Become Seller (Seller Application)

### Overview
Clients can apply to become sellers (freelancers). Admins review requests and approve or reject them. Applicants are notified of the decision.

### Applicant Flow
- **Become Seller page**: Dedicated page (e.g. `/become-seller`) for clients to submit a seller application
- **Application data**: Typically full name, skills, bio, portfolio, etc., as configured
- **Status**: Application is created with status `PENDING`
- **Pending state**: UI can show “Request pending” or similar until admin acts

### Admin Flow
- **Seller requests**: Admin area (e.g. `/admin/seller-requests`) lists all pending and processed seller applications
- **Approve**: Admin can approve a request; user becomes an approved seller and can access freelancer dashboard and create offers
- **Reject**: Admin can reject with an optional reason; user stays client-only
- **Audit**: Admin can see request details and history

### Notifications
- **On approval**: Applicant receives an in-app notification (e.g. “Seller request approved” / “You now have access to the seller dashboard”) and optional email if implemented
- **On rejection**: Applicant can be notified (e.g. “Seller request rejected” with reason if provided)
- **Real-time**: Notifications are delivered via Socket.IO when the user is online, and stored for when they return

### Status & Access
- **Seller status**: User model has `sellerStatus` (e.g. NONE, PENDING, APPROVED, REJECTED) and `isSeller`
- **After approval**: User can switch to freelancer view, create services, send offers, and manage orders as a freelancer
- **After rejection**: User remains client; can re-apply if the flow allows

---

## 🎯 Key Business Rules

### Offer Rules
1. Only freelancers can create offers for their own services
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
2. Freelancer review unlocks only after client review exists
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
- **Order access**: Only order participants (client/freelancer) can view orders
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

## 🔄 Future Enhancements
- Order dispute resolution workflow
- Advanced review filtering and sorting
- Review helpfulness voting
- Order templates for repeat clients
- Bulk order management

---

## 📝 Technical Notes
- Built with Next.js 16
- Prisma ORM for database management
- Socket.IO for real-time features
- PostgreSQL database
- RESTful API architecture

---

**Version**: 1.1.0  
**Release Date**: February 2026  
**Status**: Production Ready  

### v1.1.0 (Feb 2026)
- In-app notification system (bell icon, dropdown, toasts, sound, offer/order/seller notifications)
- Become Seller flow with admin approve/reject and notifications
