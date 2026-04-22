# 💬 ChatApp — Full-Stack Real-Time Chat

A production-ready real-time chat application built with the **MERN stack** (MongoDB, Express, React, Node.js) featuring Socket.IO, JWT auth, Cloudinary file uploads, and a modern dark UI.

---

## 🚀 Tech Stack

### Backend
- **Node.js + Express.js** (ES Modules)
- **Socket.IO** — real-time bidirectional communication
- **MongoDB + Mongoose** — database & ODM
- **JWT** — authentication (REST + Socket)
- **bcryptjs** — password hashing
- **Helmet + express-rate-limit** — security
- **Cloudinary + Multer (Memory Storage)** — stream-based file uploads
- **Nodemailer** — OTP emails
- **Zod** — request validation
- **Morgan** — HTTP logging

### Frontend
- **React + Vite**
- **React Router DOM**
- **Socket.IO Client**
- **Tailwind CSS** — styling
- **Framer Motion** — animations
- **Axios** — HTTP client
- **Day.js** — date formatting
- **Sonner** — toast notifications

---

## 📁 Project Structure

```
chatapp/
├── backend/
│   ├── server.js               # Entry point
│   ├── .env.example
│   └── src/
│       ├── config/             # DB, Cloudinary, Email
│       ├── models/             # User, Message, Conversation, Group
│       ├── routes/             # Auth, User, Message, Conversation, Group
│       ├── controllers/        # Business logic
│       ├── middleware/         # Auth, Upload, Validation
│       ├── socket/             # Socket.IO server
│       ├── utils/              # JWT, OTP helpers
│       └── validators/         # Zod schemas
└── frontend/
    ├── index.html
    └── src/
        ├── api/                # Axios instance
        ├── context/            # Auth + Socket contexts
        ├── pages/              # Login, Signup, Chat, Profile, etc.
        ├── components/
        │   ├── chat/           # Sidebar, ChatWindow, MessageBubble, etc.
        │   ├── modals/         # UserSearch, CreateGroup, GroupInfo
        │   └── shared/         # Avatar, Spinner
        └── utils/
```

---

## ⚡ Core Features

- ✅ **Auth**: Signup → Email OTP verification → Login (email or username) → Forgot/Reset password
- ✅ **1-to-1 Chat**: Real-time via Socket.IO, WhatsApp-style message ticks (Sent/Delivered/Seen)
- ✅ **Group Chat**: Create groups, add/remove members, leave, admin controls
- ✅ **Typing Indicators**: Live typing dots shown to conversation partner
- ✅ **Online/Offline Status**: Real-time presence with last seen timestamps
- ✅ **File Sharing**: Images, videos, documents with full-screen immersive media preview mode
- ✅ **Block System**: Block/unblock users, blocked users can't message each other
- ✅ **User Search**: Search by username or name to start new chats
- ✅ **Profile Management**: Update name, profile picture, password
- ✅ **Unread Counts**: Per-conversation unread message badge in sidebar
- ✅ **Date Separators**: Messages grouped by date (Today, Yesterday, etc.)
- ✅ **Infinite Scroll**: Smoothly load older messages by scrolling up
- ✅ **Mobile Responsive**: Sidebar hidden on mobile, full-screen chat view

---

## 🛠️ Setup & Installation

### 1. Clone / Extract the project

```bash
cd chatapp
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

CLIENT_URL=http://localhost:5173
```

> **Gmail App Password**: Go to Google Account → Security → 2FA → App Passwords → Generate one

Start the backend:
```bash
npm run dev      # Development (nodemon)
npm start        # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`
```env
VITE_API_URL=/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

---

## 🌐 API Reference

### Auth Routes (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Register new user |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend verification OTP |
| POST | `/login` | Login (email/username + password) |
| POST | `/forgot-password` | Send reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| GET | `/me` | Get current user (auth required) |

### User Routes (`/api/users`) — Auth Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=` | Search users |
| GET | `/:id` | Get user by ID |
| PUT | `/profile` | Update name |
| PUT | `/password` | Change password |
| PUT | `/profile-pic` | Upload profile picture |
| POST | `/block/:id` | Block a user |
| POST | `/unblock/:id` | Unblock a user |
| GET | `/blocked` | Get blocked users list |

### Conversation Routes (`/api/conversations`) — Auth Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all conversations (sidebar) |
| POST | `/` | Find or create 1-to-1 conversation |
| DELETE | `/:id/clear` | Clear conversation for current user |

### Message Routes (`/api/messages`) — Auth Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:conversationId` | Get messages (paginated) |
| POST | `/` | Send a message |
| PUT | `/seen/:conversationId` | Mark messages as seen |
| POST | `/upload` | Upload a file to Cloudinary |
| DELETE | `/:id` | Delete a message |

### Group Routes (`/api/groups`) — Auth Required
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create group |
| GET | `/:id` | Get group info |
| PUT | `/:id` | Update group name/description/avatar |
| POST | `/:id/add-member` | Add member (admin only) |
| POST | `/:id/remove-member` | Remove member (admin only) |
| POST | `/:id/leave` | Leave group |
| PUT | `/:id/transfer-admin` | Transfer admin role |

---

## 🔌 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `conversationId` | Join a chat room |
| `leave_conversation` | `conversationId` | Leave a chat room |
| `typing_start` | `{ conversationId }` | Start typing indicator |
| `typing_stop` | `{ conversationId }` | Stop typing indicator |
| `message_seen` | `{ conversationId, senderId }` | Mark messages seen |
| `message_delivered` | `{ messageId, senderId }` | Mark delivered |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `Message` | New incoming message |
| `conversation_updated` | `{ conversationId, lastMessage, unreadCount }` | Sidebar update |
| `typing_start` | `{ userId, conversationId }` | Someone typing |
| `typing_stop` | `{ userId, conversationId }` | Stopped typing |
| `messages_seen` | `{ conversationId, seenBy }` | Messages marked seen |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId, lastSeen }` | User went offline |
| `group_created` | `{ group, conversationId }` | New group added |
| `added_to_group` | `{ groupId, conversationId }` | Added to a group |
| `removed_from_group` | `{ groupId }` | Removed from group |

---

## 🗄️ Database Models

### User
```
name, username (unique), email (unique), password (hashed),
profilePic, profilePicPublicId, isVerified, otp, otpExpiry,
blockedUsers[], lastSeen, isOnline
```

### Message
```
sender (ref User), receiver (ref User), group (ref Group),
conversation (ref Conversation), text, fileUrl, fileType,
fileName, status (sent|delivered|seen), seenBy[], deletedFor[]
```

### Conversation
```
members[] (ref User), isGroup, group (ref Group),
lastMessage (ref Message), unreadCounts (Map)
```

### Group
```
name, description, avatar, avatarPublicId,
admin (ref User), members[] (ref User), conversation (ref Conversation)
```

---

## 🔒 Security

- JWT tokens with 7-day expiry
- Passwords hashed with bcryptjs (12 salt rounds)
- Helmet.js security headers
- Rate limiting: 200 req/15min global, 20 req/15min on auth routes
- CORS restricted to `CLIENT_URL`
- Zod validation on auth + message routes
- Block system prevents messaging between blocked users
- Socket authentication via JWT in handshake