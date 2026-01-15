# Socket.IO Implementation Guide

This document explains how to set up and use the Socket.IO real-time communication system for client-admin-freelancer communication.

## Overview

The Socket.IO implementation enables real-time messaging between:
- **Clients** (users who hire freelancers)
- **Freelancers** (sellers providing services)
- **Admins** (platform administrators)

## Prerequisites

1. Install dependencies:
```bash
npm install socket.io socket.io-client
```

2. Run database migrations to create Conversation and Message tables:
```bash
npx prisma migrate dev --name add_conversations_messages
```

## Setup

### 1. Database Schema

The Prisma schema has been updated with:
- `Conversation` model - Stores conversation metadata
- `ConversationParticipant` model - Many-to-many relationship between users and conversations
- `Message` model - Stores individual messages
- `MessageSeen` model - Tracks read receipts

### 2. Server Configuration

The Socket.IO server is initialized in `server.js`. To run the application with Socket.IO support:

```bash
npm run dev
```

This uses the custom server that integrates Socket.IO with Next.js.

**Note:** If you need to run without Socket.IO (for development), use:
```bash
npm run dev:next
```

### 3. Environment Variables

Add to your `.env` file (optional):
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

If not set, the client will automatically use the current window origin.

## Architecture

### Server-Side (`lib/socket.js`)

- Initializes Socket.IO server
- Handles authentication via JWT tokens
- Manages conversation rooms
- Handles real-time events:
  - `join_conversation` - User joins a conversation room
  - `leave_conversation` - User leaves a conversation room
  - `send_message` - Send a new message
  - `mark_read` - Mark message as read
  - `typing` - Typing indicator

### Client-Side (`hooks/useSocket.js`)

- React hook for Socket.IO connection
- Automatically connects when user is authenticated
- Handles reconnection logic
- Provides connection status

### API Routes

- `GET /api/conversations` - Get all conversations for current user
- `POST /api/conversations` - Create or get existing conversation
- `GET /api/conversations/[id]` - Get single conversation
- `GET /api/conversations/[id]/messages` - Get messages (with pagination)
- `POST /api/conversations/[id]/messages` - Create message (fallback if Socket.IO unavailable)

### Components

- `ChatContainer` - Main container component
- `ChatList` - Displays list of conversations
- `ChatWindow` - Displays messages and input for a conversation

## Usage

### Starting a Conversation

To start a conversation with another user, make a POST request:

```javascript
const response = await api.post('/conversations', {
  otherUserId: 'user-id-here'
});
```

This will either return an existing conversation or create a new one.

### Sending Messages

Messages are sent via Socket.IO in real-time:

```javascript
socket.emit('send_message', {
  conversationId: 'conversation-id',
  content: 'Hello!'
});
```

The message will be:
1. Saved to the database
2. Broadcasted to all participants in the conversation
3. Displayed in real-time in the chat UI

### Receiving Messages

The chat components automatically listen for new messages:

```javascript
socket.on('new_message', (data) => {
  // data.message contains the new message
  // data.conversationId contains the conversation ID
});
```

### Typing Indicators

To show typing indicators:

```javascript
// Start typing
socket.emit('typing', {
  conversationId: 'conversation-id',
  isTyping: true
});

// Stop typing (after 3 seconds of inactivity)
socket.emit('typing', {
  conversationId: 'conversation-id',
  isTyping: false
});
```

### Marking Messages as Read

Messages are automatically marked as read when:
- User opens a conversation
- User views messages in the conversation

You can also manually mark messages as read:

```javascript
socket.emit('mark_read', {
  messageId: 'message-id',
  conversationId: 'conversation-id'
});
```

## Features

### Real-Time Communication
- Instant message delivery
- Typing indicators
- Read receipts
- Online/offline status (via connection events)

### Security
- JWT-based authentication
- User verification on connection
- Participant verification for all operations
- Room-based message broadcasting

### User Experience
- Responsive design (mobile and desktop)
- Message history with pagination
- Search conversations
- Last message preview
- Timestamp formatting

## Integration Points

### Pages Using Chat

1. `/messages` - Main messages page for all users
2. `/dashboard/freelancer/messages` - Freelancer-specific messages page

Both pages use the same `ChatContainer` component, ensuring consistent UX.

### Role-Based Access

The system supports all user roles:
- **CLIENT** - Can message freelancers and admins
- **FREELANCER** - Can message clients and admins
- **ADMIN** - Can message anyone

## Troubleshooting

### Socket.IO Not Connecting

1. Check that the custom server is running (`npm run dev`)
2. Verify JWT token is valid
3. Check browser console for connection errors
4. Ensure CORS is properly configured

### Messages Not Appearing

1. Verify user is a participant in the conversation
2. Check Socket.IO connection status
3. Verify database permissions
4. Check server logs for errors

### Database Issues

If you encounter Prisma errors:
1. Run migrations: `npx prisma migrate dev`
2. Generate Prisma client: `npx prisma generate`
3. Check database connection string in `.env`

## Future Enhancements

Potential improvements:
- File attachments
- Message reactions
- Group conversations (multiple participants)
- Message editing/deletion
- Push notifications
- Message search within conversations
- Voice/video call integration

