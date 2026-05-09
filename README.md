<div align="center">

# 📋 CloudClip

### A full-stack cloud clipboard — save text, images, and PDFs privately in the cloud

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)

</div>

---

## What is CloudClip?

CloudClip is a personal cloud clipboard where every user gets their own private, isolated workspace. Register with email OTP verification, then save text snippets, upload images, and store PDFs — all accessible from any device on any browser, fully responsive on mobile.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How It Works — Architecture](#how-it-works--architecture)
5. [Local Development Setup](#local-development-setup)
6. [All Environment Variables](#all-environment-variables)
7. [SMTP Email Configuration](#smtp-email-configuration)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Frontend Components](#frontend-components)
11. [Deployment Guide](#deployment-guide)
    - [Step 1 — MongoDB Atlas](#step-1--mongodb-atlas)
    - [Step 2 — Backend on Render](#step-2--backend-on-render)
    - [Step 3 — Frontend on Netlify](#step-3--frontend-on-netlify)
12. [Deployment Checklist](#deployment-checklist)
13. [Troubleshooting](#troubleshooting)

---

## Features Overview

### Authentication
| Feature | Details |
|---|---|
| OTP Email Verification | On registration, a 6-digit code is emailed to the user. The account is only created after the code is entered correctly |
| 10-minute OTP expiry | OTP records auto-delete from MongoDB using a TTL index after 10 minutes |
| 5-attempt limit | After 5 wrong OTP guesses the record is wiped; the user must register again |
| Resend OTP | User can request a fresh code with a 30-second UI cooldown |
| JWT Sessions | Login returns a signed JWT stored in localStorage; every API request sends it as `Authorization: Bearer <token>` |
| 7-day token lifetime | Configurable via `JWT_EXPIRES`. Expired tokens trigger an automatic redirect to the login screen |
| bcrypt passwords | Hashed at 12 salt rounds before storage; plain-text passwords are never saved anywhere |
| Per-user data isolation | Every item has an `owner` field. All server queries filter by `owner: req.user.id` so users cannot access each other's data even by guessing IDs |

### Clipboard Items
| Feature | Details |
|---|---|
| Text snippets | Save any text with a title and tags. One-click copy to clipboard using the browser Clipboard API |
| Image upload | JPEG, PNG, GIF, WebP — shown as 16:9 preview card |
| PDF upload | Displayed with filename and file size. Open in new tab or download |
| Tags | Comma-separated tags on any item |
| Edit | Update title, text content, and tags inline without leaving the page |
| Delete | Confirmation overlay before deletion. Associated file also deleted from disk |
| Reverse chronological | Newest items always appear first |
| File size limit | 10 MB per file, enforced by Multer on the server |

### Search & Filter
| Feature | Details |
|---|---|
| Live search | Filters by title, text content, and tags using a case-insensitive regex |
| Type filter | Scrollable chip bar to show only Text, Image, or PDF items |
| Compound queries | Search and type filter work together simultaneously |

### UI & Responsiveness
| Feature | Details |
|---|---|
| Mobile-first design | Tested from 320px wide. Single-column on mobile, multi-column grid on desktop |
| iOS zoom fix | All form inputs use `font-size: 16px` to prevent Safari from auto-zooming on focus |
| 44px tap targets | All buttons and interactive elements meet the minimum mobile touch target size |
| LAN / network access | Vite binds to `0.0.0.0`; the server listens on `0.0.0.0`. Accessible from any device on the same Wi-Fi without config changes |
| Dark theme | Full dark UI using CSS custom properties |
| Skeleton loading | Animated placeholder cards while items load |
| Toast notifications | Non-blocking success, error, and info toasts for every user action |
| Confirm before delete | Overlay confirmation so items cannot be deleted by accident |

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 4 | HTTP server and routing |
| Mongoose | 8 | MongoDB ODM |
| jsonwebtoken | 9 | Signing and verifying JWT tokens |
| bcryptjs | 3 | Password hashing |
| nodemailer | 8 | Sending OTP emails over SMTP |
| multer | 1 | Parsing multipart/form-data, saving files to disk |
| cors | 2 | Cross-Origin Resource Sharing headers |
| dotenv | 16 | Loading `.env` into `process.env` |
| nodemon | 3 | Dev server auto-restart |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| Axios | 1 | HTTP client with JWT interceptor |
| Custom CSS | — | Design system, all styling — no CSS framework |

### Infrastructure (Deployment)
| Service | Purpose | Free Tier |
|---|---|---|
| MongoDB Atlas | Cloud database | 512 MB, shared cluster |
| Render | Node.js backend hosting | 750 hrs/month, spins down on inactivity |
| Netlify | Static frontend hosting | 100 GB bandwidth/month, unlimited builds |

---

## Project Structure

```
cloudclip/
│
├── server/                          # Express + Node.js backend
│   ├── config/
│   │   └── db.js                    # Connects to MongoDB using MONGO_URI
│   │
│   ├── controllers/
│   │   ├── authController.js        # sendOtp, verifyOtp, resendOtp, login, getMe
│   │   └── itemController.js        # getItems, getItemById, createItem, updateItem, deleteItem
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect() — verifies Bearer token, attaches req.user.id
│   │   ├── upload.js                # Multer — 10MB limit, images + PDFs only, disk storage
│   │   └── errorHandler.js          # Global error handler — formats Mongoose + Multer + custom errors
│   │
│   ├── models/
│   │   ├── User.js                  # name, email (unique), password (select:false). bcrypt pre-save hook
│   │   ├── Otp.js                   # email, name, hashedPassword, otp, attempts, expiresAt. TTL index
│   │   └── Item.js                  # title, type, textContent, fileUrl, fileName, mimeType, fileSize, tags, owner
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # POST /send-otp, /verify-otp, /resend-otp, /login  GET /me
│   │   └── itemRoutes.js            # All routes use protect(). GET / POST / GET /:id PUT /:id DELETE /:id
│   │
│   ├── services/
│   │   └── emailService.js          # sendOtpEmail() — builds HTML email, sends via nodemailer SMTP
│   │
│   ├── uploads/                     # Uploaded files land here (auto-created, gitignored)
│   ├── .env                         # Environment variables (never commit)
│   ├── .env.example                 # Template with all variable names and descriptions
│   ├── index.js                     # App bootstrap — CORS, routes, static /uploads, listen on 0.0.0.0
│   └── package.json
│
└── client/                          # React + Vite frontend
    ├── public/
    │   └── _redirects               # Netlify SPA routing fix: /* /index.html 200
    │
    ├── src/
    │   ├── api/
    │   │   ├── auth.js              # Shared axios instance. Auto-attaches JWT. 401 triggers cc:logout event
    │   │   │                        # Exports: sendOtp, verifyOtp, resendOtp, loginUser, getMe
    │   │   └── items.js             # Exports: fetchItems, fetchItemById, createItem, updateItem, deleteItem
    │   │
    │   ├── components/
    │   │   ├── AuthPage.jsx         # 3 screens: Login | Register (step 1) | OTP entry (step 2)
    │   │   │                        # OtpInput: 6 individual boxes, paste-aware, backspace-aware
    │   │   │                        # ResendTimer: 30s countdown then shows Resend link
    │   │   ├── CreateItemForm.jsx   # Collapsible panel. Type tabs (Text / Image / PDF)
    │   │   │                        # Drag-and-drop upload zone with file preview
    │   │   ├── ItemCard.jsx         # Renders differently per type. Inline EditForm. Confirm delete overlay
    │   │   ├── ItemList.jsx         # Responsive grid. SkeletonCard loading. EmptyState component
    │   │   ├── SearchBar.jsx        # Search input + horizontally scrollable type filter chips
    │   │   └── Toast.jsx            # useToast hook + ToastContainer. Auto-dismiss after 3s
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.js           # user, loading, error state. login, requestOtp, confirmOtp, resend, logout
    │   │   │                        # Persists token + user to localStorage. Listens for cc:logout event
    │   │   └── useItems.js          # items, loading, error state. addItem, editItem, removeItem, refresh
    │   │                            # Re-fetches automatically when search or filterType changes
    │   ├── utils/
    │   │   └── helpers.js           # formatFileSize, formatDate, copyToClipboard (with fallback), truncate
    │   │
    │   ├── App.jsx                  # Auth gate: shows AuthPage or Dashboard based on isAuthenticated
    │   ├── main.jsx                 # React entry point
    │   └── index.css                # Entire design system: variables, buttons, forms, cards, auth, OTP, toasts
    │
    ├── index.html                   # viewport, theme-color, apple-mobile-web-app-capable
    ├── .env                         # VITE_API_URL (commented out for local; set for production)
    ├── .env.example
    ├── vite.config.js               # host: true, proxy /api and /uploads → localhost:5000
    └── package.json
```

---

## How It Works — Architecture

### Registration flow (OTP)

```
Browser                          Express Server                    MongoDB            Gmail SMTP
  │                                    │                              │                    │
  │── POST /api/auth/send-otp ────────>│                              │                    │
  │   { name, email, password }        │── Check email not taken ────>│                    │
  │                                    │<─ not found ─────────────────│                    │
  │                                    │── bcrypt.hash(password) ─────│                    │
  │                                    │── Upsert Otp document ──────>│                    │
  │                                    │── sendOtpEmail() ────────────────────────────────>│
  │<─ { success, message } ───────────│                              │                    │
  │                                    │                              │                    │
  │  (user enters 6-digit code)        │                              │                    │
  │                                    │                              │                    │
  │── POST /api/auth/verify-otp ──────>│                              │                    │
  │   { email, otp }                   │── Find Otp by email ────────>│                    │
  │                                    │<─ record ────────────────────│                    │
  │                                    │── Check expiry + attempts    │                    │
  │                                    │── Compare otp strings        │                    │
  │                                    │── Create User document ─────>│                    │
  │                                    │── Delete Otp document ──────>│                    │
  │<─ { token, user } ────────────────│                              │                    │
```

### Every item request (after login)

```
Browser (Axios interceptor adds header)        Express Server              MongoDB
  │                                                  │                        │
  │── GET /api/items ────────────────────────────────>│                        │
  │   Authorization: Bearer <JWT>                     │                        │
  │                                                   │── protect() middleware │
  │                                                   │   jwt.verify(token)    │
  │                                                   │   req.user = { id }    │
  │                                                   │── Item.find({          │
  │                                                   │     owner: req.user.id │
  │                                                   │   }) ─────────────────>│
  │<─ { data: [...items] } ──────────────────────────│<─ items ───────────────│
```

### API URL auto-detection (LAN / mobile)

When `VITE_API_URL` is not set, the frontend builds the API base URL dynamically at runtime:

```js
const { protocol, hostname } = window.location;
return `${protocol}//${hostname}:5000/api`;
// Browser on phone:  http://192.168.1.5:5173 → API calls go to http://192.168.1.5:5000/api
// Browser on laptop: http://localhost:5173    → API calls go to http://localhost:5000/api
```

---

## Local Development Setup

### Prerequisites

- **Node.js** v18 or higher → https://nodejs.org
- **MongoDB** running locally on port 27017 → https://www.mongodb.com/try/download/community
- **Gmail account** with 2-Step Verification enabled (for OTP emails)

### 1. Install dependencies

```bash
# Server
cd cloudclip/server
npm install

# Client
cd ../client
npm install
```

### 2. Configure environment variables

```bash
cd cloudclip/server
cp .env.example .env
# Open .env and fill in your SMTP credentials (see SMTP section below)
```

The `client/.env` file has `VITE_API_URL` commented out — leave it that way for local development. Auto-detection handles it.

### 3. Run both servers

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd cloudclip/server
npm run dev
```
```
🚀 Server running on http://0.0.0.0:5000
   Local:   http://localhost:5000
✅ MongoDB connected: localhost
```

**Terminal 2 — Frontend:**
```bash
cd cloudclip/client
npm run dev
```
```
  VITE v8.x  ready

  ➜  Local:    http://localhost:5173/
  ➜  Network:  http://192.168.1.x:5173/
```

Open **http://localhost:5173** in your browser.

### 4. Access from a phone or other device

Open the Network URL shown by Vite (e.g. `http://192.168.1.5:5173`) on any device connected to the same Wi-Fi. No additional configuration needed.

---

## All Environment Variables

### `server/.env`

```dotenv
# ── Server ────────────────────────────────────────────────────
PORT=5000
# Port the Express server listens on.
# On Render this is set automatically — do not set it manually there.

# ── Database ──────────────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/cloudclip
# Local:      mongodb://localhost:27017/cloudclip
# Atlas:      mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/cloudclip?retryWrites=true&w=majority

# ── CORS ──────────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173
# The exact URL of your frontend. Used to allow CORS.
# Local:      http://localhost:5173
# Production: https://your-site.netlify.app

# ── JWT ───────────────────────────────────────────────────────
JWT_SECRET=replace_this_with_a_long_random_string
# Used to sign and verify tokens. Change this before deploying.
# Generate one at: https://randomkeygen.com (use Fort Knox Passwords)

JWT_EXPIRES=7d
# How long a token stays valid before the user must log in again.
# Examples: 1d  7d  30d  1h

# ── SMTP / Email ──────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
# Set SMTP_SECURE=true only if using port 465.

SMTP_USER=yourname@gmail.com
# Your Gmail address (or SMTP login for other providers).

SMTP_PASS=xxxx xxxx xxxx xxxx
# For Gmail: 16-character App Password (NOT your account password).
# See SMTP section below for how to generate this.

SMTP_FROM=CloudClip <yourname@gmail.com>
# The display name and address that appears in the From field of OTP emails.
```

### `client/.env`

```dotenv
# Leave this commented out for local development.
# The app auto-detects the API host from window.location.hostname.
# Uncomment and set this ONLY when deploying to Netlify.

# VITE_API_URL=https://your-render-api.onrender.com/api
```

---

## SMTP Email Configuration

OTP verification emails are sent using [Nodemailer](https://nodemailer.com) over SMTP. The email contains a branded HTML template with the 6-digit code.

### Setting up Gmail App Password

Gmail does not allow regular password authentication for SMTP. You must use an **App Password** — a 16-character code that works independently of your account password.

**Requirements:** Your Gmail account must have 2-Step Verification turned on.

**Steps:**

1. Visit https://myaccount.google.com/security
2. Confirm **2-Step Verification** is **On**
3. Visit https://myaccount.google.com/apppasswords
4. Click **Select app** → **Mail**
5. Click **Select device** → **Other (Custom name)** → type `CloudClip`
6. Click **Generate**
7. Copy the 16-character password (shown once, with spaces)
8. Paste it as `SMTP_PASS` in `server/.env` — spaces are fine to include

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=CloudClip <yourname@gmail.com>
```

### Other SMTP Providers

| Provider | SMTP_HOST | SMTP_PORT | SMTP_SECURE | Notes |
|---|---|---|---|---|
| **Gmail** | `smtp.gmail.com` | `587` | `false` | Needs App Password |
| **Outlook / Hotmail** | `smtp.office365.com` | `587` | `false` | Use account password |
| **Yahoo Mail** | `smtp.mail.yahoo.com` | `587` | `false` | Needs App Password |
| **SendGrid** | `smtp.sendgrid.net` | `587` | `false` | Use API Key as SMTP_PASS, `apikey` as SMTP_USER |
| **Mailgun** | `smtp.mailgun.org` | `587` | `false` | Use SMTP credentials from Mailgun dashboard |
| **Brevo (Sendinblue)** | `smtp-relay.brevo.com` | `587` | `false` | Use SMTP key from Brevo dashboard |

### SMTP Error Reference

The server returns a specific error message for every SMTP failure:

| Error Code | Meaning | Fix |
|---|---|---|
| `EAUTH` | Wrong credentials | Use a Gmail App Password, not your login password |
| `ETIMEDOUT` | Cannot reach SMTP server | Check SMTP_HOST and SMTP_PORT. Port 587 must be open outbound on your network |
| `ECONNREFUSED` | Connection actively refused | Try port 465 with `SMTP_SECURE=true` |
| `ENOTFOUND` | Hostname does not exist | Check for typos in SMTP_HOST |
| `5xx response` | Server-side SMTP error | Check your sending limits or account status |

---

## API Reference

**Base URL (local):** `http://localhost:5000/api`

**Base URL (production):** `https://your-render-app.onrender.com/api`

All item routes require the header:
```
Authorization: Bearer <token>
```

### Auth Routes

#### `POST /auth/send-otp`
Validates registration inputs, hashes the password, stores a pending OTP record in MongoDB, and sends the 6-digit code to the user's email.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Success response `200`:**
```json
{
  "success": true,
  "message": "A 6-digit verification code has been sent to john@example.com. It expires in 10 minutes."
}
```

**Error responses:** `400` validation error, `409` email already registered, `502` SMTP failure

---

#### `POST /auth/verify-otp`
Verifies the OTP against the stored record. On success, creates the User document and returns a JWT.

**Request body:**
```json
{
  "email": "john@example.com",
  "otp": "482910"
}
```

**Success response `201`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "664abc123...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error responses:** `400` wrong code / expired / too many attempts, `409` already registered

---

#### `POST /auth/resend-otp`
Generates a new OTP for an existing pending registration and re-sends the email. Resets the attempt counter.

**Request body:**
```json
{ "email": "john@example.com" }
```

**Success response `200`:**
```json
{
  "success": true,
  "message": "A new code has been sent to john@example.com."
}
```

---

#### `POST /auth/login`
Authenticates a verified user with email and password.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Success response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "664abc123...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error response `401`:** `{ "error": "Invalid email or password." }`

---

#### `GET /auth/me` *(requires JWT)*
Returns the current authenticated user's profile.

**Success response `200`:**
```json
{
  "success": true,
  "user": {
    "_id": "664abc123...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Item Routes *(all require JWT)*

#### `GET /items`
Returns all items owned by the authenticated user in reverse chronological order.

**Optional query parameters:**

| Param | Type | Example | Description |
|---|---|---|---|
| `search` | string | `?search=react` | Case-insensitive search across title, textContent, and tags |
| `type` | string | `?type=pdf` | Filter by item type: `text`, `image`, or `pdf` |
| Both | — | `?search=notes&type=text` | Combines search and type filter |

**Success response `200`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "664...",
      "title": "My Snippet",
      "type": "text",
      "textContent": "Hello world",
      "fileUrl": "",
      "fileName": "",
      "mimeType": "",
      "fileSize": 0,
      "tags": ["work", "js"],
      "owner": "664abc...",
      "createdAt": "2024-06-01T10:30:00.000Z",
      "updatedAt": "2024-06-01T10:30:00.000Z"
    }
  ]
}
```

---

#### `GET /items/:id`
Returns a single item by ID. Returns `404` if the item does not exist or belongs to a different user.

---

#### `POST /items`
Creates a new item. Must be sent as `multipart/form-data`.

**Form fields:**

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Item title (max 200 characters) |
| `type` | Yes | `text`, `image`, or `pdf` |
| `textContent` | If type=text | The text content to save |
| `file` | If type=image or pdf | The file to upload (max 10 MB) |
| `tags` | No | Comma-separated tag string e.g. `"work,react,snippet"` |

**Success response `201`:**
```json
{
  "success": true,
  "data": { ...item }
}
```

---

#### `PUT /items/:id`
Updates an item's `title`, `textContent` (text items only), or `tags`. Owner-checked — returns `404` if not found or not owned by the requester.

**Request body (all fields optional):**
```json
{
  "title": "Updated Title",
  "textContent": "Updated content",
  "tags": "newtag, another"
}
```

---

#### `DELETE /items/:id`
Deletes the item and removes its uploaded file from `server/uploads/` if applicable. Owner-checked.

**Success response `200`:**
```json
{
  "success": true,
  "message": "Item deleted successfully."
}
```

---

### File Serving

Uploaded files are served as static assets:
```
http://localhost:5000/uploads/<generated-filename>
```
The `fileUrl` field on each item contains the full URL.

---

## Database Schema

### User
```
User {
  name:       String   required, max 80 chars
  email:      String   required, unique, lowercase
  password:   String   required, min 6 chars, select: false (never returned in queries)
  createdAt:  Date     auto
  updatedAt:  Date     auto
}
```
The `pre('save')` hook hashes the password with bcrypt (12 rounds) unless `$locals.skipHash = true` (used by the OTP verify flow to avoid double-hashing).

### Otp
```
Otp {
  email:          String   required, unique index (one pending OTP per email)
  name:           String   required
  hashedPassword: String   required (pre-hashed on send-otp so verify can create User directly)
  otp:            String   required (6-digit code, stored in plain text)
  attempts:       Number   default 0 (incremented on wrong guess, wiped on resend)
  expiresAt:      Date     required
  createdAt:      Date     auto
  updatedAt:      Date     auto
}
TTL index on expiresAt — MongoDB auto-deletes documents after they expire
```

### Item
```
Item {
  title:       String   required, max 200 chars
  type:        String   required, enum: ['text', 'image', 'pdf']
  textContent: String   default ''
  fileUrl:     String   default '' (full URL to the uploaded file)
  fileName:    String   default '' (original filename as uploaded)
  mimeType:    String   default ''
  fileSize:    Number   default 0 (bytes)
  tags:        [String] default []
  owner:       ObjectId required, ref: 'User'
  createdAt:   Date     auto
  updatedAt:   Date     auto
}
Text index on: title, textContent, tags (enables the search query)
```

---

## Frontend Components

### `AuthPage.jsx`
Three-screen auth flow managed internally with a `mode` state variable:

- **`login`** — email + password form. Enter key submits.
- **`register`** — name + email + password + confirm password. Transitions to `otp` on success.
- **`otp`** — shows the email that was sent to. Six individual digit boxes. Paste-aware (pastes the full code). Backspace moves to the previous box. `ResendTimer` counts down 30 seconds then shows a resend link.

### `CreateItemForm.jsx`
Collapsible panel at the top of the dashboard. Three type tabs (Text / Image / PDF). Drag-and-drop upload zone for files. File preview strip shows name and size before upload. Validates before submission and shows inline error.

### `ItemCard.jsx`
Renders differently depending on `item.type`:
- **text** — shows truncated content with fade, Copy button
- **image** — 16:9 `<img>` preview, View button
- **pdf** — filename + formatted file size, Open + Download buttons

Includes an inline `EditForm` that slides down when Edit is clicked, and a `ConfirmOverlay` that appears before deletion.

### `ItemList.jsx`
Renders the responsive CSS grid of cards. Shows `SkeletonCard` placeholders while `loading === true`. Shows `EmptyState` when the list is empty (different messages for empty clipboard vs no search results).

### `SearchBar.jsx`
Search input with icon and clear button. Below it: a row of filter chips (`All`, `Text`, `Image`, `PDF`) that scroll horizontally on mobile without wrapping.

### `Toast.jsx`
`useToast()` hook returns `{ toasts, addToast }`. `addToast(message, type, duration)` pushes a toast. `ToastContainer` renders them fixed at the bottom of the screen. Each toast auto-removes after 3 seconds.

---

## Deployment Guide

### Step 1 — MongoDB Atlas

**Create a free cluster:**

1. Sign up at https://cloud.mongodb.com
2. **Create a deployment** → choose **M0** (free, 512 MB) → pick your nearest region → **Create**
3. Set a **database username** and **password** → **Create User**
4. Under **Network Access** → **Add IP Address** → for simplicity click **Allow Access from Anywhere** (`0.0.0.0/0`) → **Confirm**

**Get your connection string:**

1. On your cluster → **Connect** → **Drivers**
2. Select **Node.js** → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<username>` and `<password>` with your database user credentials
4. Insert your database name before `?`:
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cloudclip?retryWrites=true&w=majority
   ```

Save this string — it becomes your `MONGO_URI` on Render.

---

### Step 2 — Backend on Render

> **Note on file storage:** Render's free tier uses ephemeral storage — files in `uploads/` are lost on each deploy or service restart. This is fine for testing. For a permanent production app, integrate a cloud storage service (Cloudinary or AWS S3) to replace Multer's disk storage.

**Prepare your server code for GitHub:**

Create `server/.gitignore`:
```
node_modules/
uploads/
.env
```

```bash
cd cloudclip/server
git init
git add .
git commit -m "Initial commit"
# Create a new repository on GitHub, then:
git remote add origin https://github.com/your-username/cloudclip-server.git
git push -u origin main
```

**Create the Render service:**

1. Sign in at https://render.com
2. **New** → **Web Service** → **Connect a repository** → select `cloudclip-server`
3. Configure:

| Setting | Value |
|---|---|
| Name | `cloudclip-api` |
| Region | Closest to your users |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Instance Type | **Free** |

4. **Create Web Service** — Render starts building

**Add environment variables** in Render → your service → **Environment** → **Add Environment Variable**:

| Key | Value |
|---|---|
| `MONGO_URI` | Your Atlas connection string |
| `CLIENT_URL` | `https://your-site.netlify.app` (update after Netlify deploy) |
| `JWT_SECRET` | A long random string (generate at https://randomkeygen.com) |
| `JWT_EXPIRES` | `7d` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `SMTP_FROM` | `CloudClip <yourname@gmail.com>` |

> Do **not** set `PORT` — Render injects this automatically.

After saving, Render redeploys. Your API is live at:
```
https://cloudclip-api.onrender.com
```

Note this URL for the next step.

**Free tier behaviour:** The service sleeps after 15 minutes of no traffic. The first request after sleeping takes 20–30 seconds. Subsequent requests are fast. Upgrade to a paid plan to eliminate cold starts.

---

### Step 3 — Frontend on Netlify

**Set the production API URL:**

Edit `client/.env`:
```dotenv
VITE_API_URL=https://cloudclip-api.onrender.com/api
```

**Create `client/public/_redirects`** (fixes page refresh returning 404 on Netlify):
```
/*    /index.html   200
```

**Push client code to GitHub:**

Create `client/.gitignore`:
```
node_modules/
dist/
.env.local
```

```bash
cd cloudclip/client
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/cloudclip-client.git
git push -u origin main
```

**Create the Netlify site:**

1. Sign in at https://netlify.com
2. **Add new site** → **Import an existing project** → **GitHub**
3. Select your `cloudclip-client` repository
4. Configure:

| Setting | Value |
|---|---|
| Base directory | *(leave empty)* |
| Build command | `npm run build` |
| Publish directory | `dist` |

5. **Deploy site** — Netlify builds and deploys

**Add environment variable in Netlify:**

Site → **Site configuration** → **Environment variables** → **Add a variable**:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://cloudclip-api.onrender.com/api` |

Then: **Deploys** → **Trigger deploy** → **Deploy site** to rebuild with the variable.

Your app is now live at `https://your-site-name.netlify.app`.

**Go back to Render** and update `CLIENT_URL` to match your exact Netlify URL. Render will redeploy automatically.

---

## Deployment Checklist

Run through this before sharing your app:

**Database**
- [ ] Atlas cluster is running (not paused)
- [ ] Database user has read/write access
- [ ] Network Access allows Render IPs or `0.0.0.0/0`
- [ ] `MONGO_URI` uses the Atlas connection string, not `localhost`

**Backend (Render)**
- [ ] `MONGO_URI` is set correctly
- [ ] `CLIENT_URL` matches the exact Netlify URL (no trailing slash)
- [ ] `JWT_SECRET` is a strong random string (not the placeholder)
- [ ] All five SMTP variables are set and correct
- [ ] `PORT` is NOT set manually (Render sets it)
- [ ] `uploads/` and `.env` are in `.gitignore`
- [ ] Service has deployed without errors (check Render logs)

**Frontend (Netlify)**
- [ ] `VITE_API_URL` points to Render URL ending in `/api`
- [ ] `client/public/_redirects` file contains `/* /index.html 200`
- [ ] Site has been redeployed after adding the environment variable
- [ ] `.env` is in `.gitignore` and not committed to git

**Test end-to-end**
- [ ] Registration sends OTP email and creates account
- [ ] Login returns JWT and loads items
- [ ] Create text item, copy to clipboard
- [ ] Upload an image — preview appears
- [ ] Upload a PDF — open and download work
- [ ] Search and filter work
- [ ] Edit and delete work
- [ ] Page refresh does not return 404 (Netlify `_redirects`)
- [ ] App loads correctly on mobile browser

---

## Troubleshooting

### OTP email not received
- Check the spam/junk folder
- Verify `SMTP_USER` and `SMTP_PASS` are correct in `server/.env`
- For Gmail: confirm 2-Step Verification is **On** and you used an App Password — not your account login password
- The server logs the full error code and message to the terminal when sending fails — check there first
- Test your SMTP credentials at https://www.smtpter.com

### CORS error in browser console
- `CLIENT_URL` in `server/.env` must exactly match the URL you are using in the browser
- No trailing slash: `http://localhost:5173` ✅ — `http://localhost:5173/` ❌
- After deploying: update `CLIENT_URL` on Render to your Netlify URL and wait for redeploy

### MongoDB connection failed
- **Local:** make sure MongoDB is running — try `mongod` or start the MongoDB service
- **Atlas:** check Network Access whitelists your IP (or `0.0.0.0/0`)
- **Atlas:** check the connection string has the correct username, password, and database name — the password must be URL-encoded if it contains special characters

### Images or PDFs not loading after deployment
- Expected on Render's free tier — local file storage (`uploads/`) is wiped on every deploy
- Solution: integrate Cloudinary or AWS S3 to store files persistently in the cloud

### "Not authenticated" error after page refresh
- Token may have expired (default 7 days) or localStorage was cleared
- Sign in again — the app detects the expired token automatically and redirects to login

### Render API is very slow to respond
- Render free services sleep after 15 minutes of inactivity and take ~30 seconds to wake on the next request
- This is normal on the free tier — upgrade to a paid instance to remove cold starts
- You can ping the health endpoint (`/api/health`) periodically to keep it awake

### "Too many incorrect attempts" on OTP
- After 5 wrong guesses the OTP record is wiped as a security measure
- Go back to the registration form, fill it in again, and request a fresh code

### Page returns 404 on refresh (Netlify)
- The `client/public/_redirects` file must exist with the content `/* /index.html 200`
- Commit and push this file, then trigger a new deploy on Netlify