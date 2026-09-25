# SyncSpace — Real-Time Collaborative Workspace & Code Interview Platform

**A high-performance, real-time pair programming, whiteboard collaboration, and technical interview platform.**

### [Launch Live Web App (Frontend)](https://sync-space-smoky.vercel.app/) • [View Live Backend API (Render)](https://syncspace-dzvu.onrender.com)

[Explore Documentation](./Docs) • [Deployment Guide](./Docs/DEPLOYMENT_GUIDE.md) • [API Specs](./Docs/API_DOCUMENTATION.md)

---

## Live Deployments

| Component | Platform | Live URL | Status |
|---|---|---|---|
| **Frontend Web App** | Vercel | [https://sync-space-smoky.vercel.app/](https://sync-space-smoky.vercel.app/) | Active |
| **Backend API & WebSockets** | Render | [https://syncspace-dzvu.onrender.com/](https://syncspace-dzvu.onrender.com/) | Active |

> [!NOTE]
> **Free Tier Cold Start Notice**: The backend on Render free tier may take ~30–45 seconds to spin up on the first request if inactive. Once active, all WebSocket events and API requests respond in real time.

---

## Table of Contents

- [Live Deployments](#live-deployments)
- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running Locally](#running-locally)
- [Production Deployment](#production-deployment)
  - [Backend Deployment (Render)](#backend-deployment-render)
  - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
  - [CORS Configuration](#cors-configuration)
- [Folder Structure](#folder-structure)
- [Documentation & Resources](#documentation--resources)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**SyncSpace** is an enterprise-grade collaborative workspace built for software engineers, interviewers, and distributed teams. It combines the power of an **in-browser VS Code-style IDE** (powered by Monaco Editor and Yjs CRDTs), an **infinite collaborative canvas/whiteboard** (powered by Konva.js), and a **multi-tier compiler engine** capable of compiling and executing code across 8+ programming languages with automated failover.

Whether conducting live coding interviews, pairing on complex codebases, or sketching architecture diagrams, SyncSpace ensures sub-millisecond real-time sync with conflict-free data resolution.

---

## Key Features

### VS Code-Style Multi-File IDE
- **Monaco Editor Engine**: Full syntax highlighting, auto-complete, bracket matching, and multi-cursor support.
- **Hierarchical File Explorer**: Create, rename, delete, and download files with language icon detection.
- **Multi-Tab Management**: Effortlessly switch between active editor tabs with dirty-state tracking.
- **Editor Status Bar**: Live line/column coordinates, language indicator, and keyboard shortcuts modal (`Ctrl+/` or `Cmd+/`).

### Real-Time Collaboration & Yjs CRDT
- **Conflict-Free Concurrent Editing**: Powered by Yjs CRDTs and WebSockets; multiple users can type simultaneously in the same file without overwriting changes.
- **Scoped File Channels**: Delta updates are scoped per filename (`yjs-update:fileName`) to keep collaborative bandwidth optimal.
- **Live User Presence & Mouse Cursors**: Dynamic cursor tracking (`CursorOverlay.jsx`) with user name tags and assigned brand colors.

### Collaborative Whiteboard
- **Interactive Canvas**: Pen, Line, Rectangle, Circle, Eraser, Stroke Width, and Color Picker.
- **Real-Time Shape Broadcasting**: Instant vector streaming over WebSockets.
- **MongoDB Cloud Persistence**: Whiteboard drawings are debounced and saved automatically to MongoDB Atlas.

### Resilient Multi-Tier Code Execution Engine
- **In-Browser Execution**: Instant evaluation for JavaScript.
- **Backend Compiler Engine (`/api/execute`)**: High-speed compilation and execution for **C++, C, Python, Java, TypeScript, Go, and Rust**.
- **Automated 3-Tier Failover**:
  1. *Tier 1:* **Judge0 CE** (Primary high-performance compiler)
  2. *Tier 2:* **Glot.io** (Automated secondary cloud failover)
  3. *Tier 3:* **Local Host Compiler** (g++, gcc, python3 fallback if offline)
- **Interactive Terminal**: Colorized stdout, stderr formatting, compilation error diagnostics, and HTML Live Preview.

### Security & Access Control
- **JWT Authentication**: Full authentication flow with bcrypt password encryption, token expiration, and profile restoration (`/api/auth/me`).
- **Room Management & Invite Codes**: Create private rooms with 6-character alphanumeric invite codes.
- **Role-Based Permissions**: Room Owner, Editor, and Viewer modes (`isReadOnly` lock).

### Timeline Replay System
- **Session History Playback**: Replay entire coding and whiteboard sessions with Play, Pause, Seek, and Reset controls.

---

## System Architecture

```text
+-----------------------------------------------------------------------------------------+
|                                  CLIENT (React 19 + Vite)                               |
|  +---------------------------+     +-------------------+     +-----------------------+  |
|  | Monaco Editor & Explorer  |     | Konva Whiteboard  |     | UI, Auth, Terminal    |  |
|  +-------------+-------------+     +---------+---------+     +-----------+-----------+  |
|                |                             |                           |              |
|           (y-monaco)                   (Mouse Events)               (Axios REST)        |
|                |                             |                           |              |
|          +-----v-----+                 +-----v-----+                     |              |
|          | Yjs Y.Doc |                 | Canvas Pos|                     |              |
|          +-----+-----+                 +-----+-----+                     |              |
+----------------+-----------------------------+---------------------------+--------------+
                 |                             |                           |
            (yjs-update)              (whiteboard/cursor)             (HTTP /api)
                 |                             |                           |
+----------------v-----------------------------v---------------------------v--------------+
|                                SERVER (Node.js + Express)                               |
|  +-----------------------------------------------------------------------------------+  |
|  |                     CORS Security Gateway & Origin Filter                         |  |
|  +-----------------------------+-----------------------------------------------------+  |
|                                |                                         |              |
|                 +--------------v--------------+                          |              |
|                 |      Socket.io Gateway      |                          |              |
|                 |     (Room Pub/Sub Engine)   |                   (Express REST)        |
|                 +--------------+--------------+                          |              |
|                                |                                         |              |
|                 +--------------v--------------+                          |              |
|                 |   MongoDB Atlas Persistence |<-------------------------+              |
|                 +-----------------------------+                          |              |
|                                                                          |              |
|                                         +--------------------------------v-----------+  |
|                                         |      Multi-Tier Compiler Engine            |  |
|                                         |  Tier 1: Judge0 CE Cloud Engine            |  |
|                                         |  Tier 2: Glot.io Runner Failover           |  |
|                                         |  Tier 3: Local System Host Toolchain       |  |
|                                         +--------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Frontend Core** | React 19, Vite 8, React Router v7 |
| **Styling & UI** | Tailwind CSS v4, React Icons, React Toastify |
| **Editor & Canvas** | Monaco Editor (`@monaco-editor/react`), Konva (`react-konva`) |
| **CRDT Real-Time Sync** | Yjs, `y-monaco`, Socket.io-client |
| **Backend Framework** | Node.js (v18+), Express.js, HTTP, Child Process |
| **Real-Time Protocol**| Socket.io v4.8 |
| **Database & ORM** | MongoDB Atlas, Mongoose v8 |
| **Security & Auth** | JSON Web Tokens (JWT), Bcryptjs, CORS |
| **Cloud Deployment** | Backend: Render • Frontend: Vercel • DB: MongoDB Atlas |

---

## Quick Start Guide

### Prerequisites
- Node.js v18.0.0 or higher
- Git installed
- MongoDB Atlas account (or local MongoDB instance)

---

### Environment Configuration

#### 1. Backend Environment Setup (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.t9ytoad.mongodb.net/syncspace?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_here_change_in_production
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

#### 2. Frontend Environment Setup (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:
```env
# For Local Development:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# For Production (Using Deployed Render Backend):
# VITE_API_URL=https://syncspace-dzvu.onrender.com/api
# VITE_SOCKET_URL=https://syncspace-dzvu.onrender.com
```

---

### Running Locally

Run both Backend and Frontend concurrently with a single command from the project root:

```bash
# 1. Install root dependencies
npm install

# 2. Install backend and frontend dependencies
npm run install-all

# 3. Start development servers concurrently
npm start
```

- **Frontend Application**: http://localhost:5173
- **Backend API Server**: http://localhost:5000
- **API Health Check**: http://localhost:5000/

---

## Production Deployment

### Backend Deployment (Render)
1. Push code to your GitHub repository.
2. Log in to [Render Dashboard](https://dashboard.render.com/) and create a new **Web Service**.
3. Select your repository and configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. In the **Environment** tab, add your production environment variables:
   - `MONGO_URI`: Your MongoDB Atlas URI.
   - `JWT_SECRET`: A secure random secret string.
   - `CLIENT_URL`: Your deployed frontend URL (`https://sync-space-smoky.vercel.app`).
5. Click **Deploy Web Service**.

### Frontend Deployment (Vercel)
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`.
3. Add the following **Environment Variables** in Vercel:
   - `VITE_API_URL`: `https://syncspace-dzvu.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://syncspace-dzvu.onrender.com`
4. Click **Deploy**.

### CORS Configuration
SyncSpace includes an intelligent, multi-environment CORS handler in `backend/server.js` that:
- Automatically recognizes and allows all preview and production deployments from `*.vercel.app`, `*.netlify.app`, and `*.onrender.com`.
- Trims trailing slashes automatically to prevent URI mismatch errors.
- Allows local development on all localhost and `127.0.0.1` ports.

---

## Folder Structure

```text
SyncSpace/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & reconnection handler
│   ├── controllers/
│   │   ├── authController.js     # User registration, login & profile lookup
│   │   └── roomController.js     # Room creation, invite codes, role management
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authorization & user validation
│   ├── models/
│   │   ├── User.js               # User schema with hashed passwords
│   │   └── Room.js               # Room schema (files, code, whiteboard, roles)
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── roomRoutes.js         # /api/rooms endpoints
│   │   └── codeRoutes.js         # /api/execute multi-language compiler
│   ├── utils/
│   │   └── generateToken.js      # JWT signing utility
│   ├── server.js                 # Express application & Socket.io server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/           # Monaco Editor, Explorer, TabBar, StatusBar, Console
│   │   │   ├── whiteboard/       # Konva Canvas, Toolbar, Dynamic Cursor Overlays
│   │   │   ├── replay/           # Session timeline replay modal
│   │   │   ├── Navbar.jsx        # Responsive navigation & theme toggle
│   │   │   ├── Footer.jsx        # Application footer
│   │   │   ├── UserList.jsx      # Active peer list with color badges
│   │   │   └── ProtectedRoute.jsx# Auth route guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state management
│   │   │   ├── SocketContext.jsx # Global WebSocket provider
│   │   │   └── ThemeContext.jsx  # Dark/Light theme provider
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Dashboard.jsx     # Room creation & joining portal
│   │   │   ├── Room.jsx          # Unified IDE & Whiteboard workspace
│   │   │   ├── Login.jsx         # Sign in page
│   │   │   ├── Register.jsx      # Sign up page
│   │   │   ├── About.jsx         # About platform & technology details
│   │   │   └── Help.jsx          # Documentation & FAQs
│   │   ├── services/
│   │   │   ├── api.js            # Axios client with JWT interceptors
│   │   │   └── yjsManager.js     # Yjs CRDT binding & document management
│   │   └── App.jsx
│   └── package.json
│
├── Docs/
│   ├── API_DOCUMENTATION.md      # Comprehensive REST & Socket.io API specs
│   ├── ARCHITECTURE.md           # System design, CRDT sync, and data flow
│   └── DEPLOYMENT_GUIDE.md       # Step-by-step production deployment manual
├── package.json                  # Root runner script (concurrently)
└── README.md
```

---

## Documentation & Resources

- [API Documentation](./Docs/API_DOCUMENTATION.md) — Exhaustive catalog of all REST endpoints and WebSocket events.
- [Architecture Deep Dive](./Docs/ARCHITECTURE.md) — Technical details of Yjs CRDT integration, database debouncing, and execution failovers.
- [Deployment Manual](./Docs/DEPLOYMENT_GUIDE.md) — Comprehensive guide for configuring Render, Vercel, and Atlas environments.

---

## Contributing

Contributions are welcome:
1. Fork the Project repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

Built by the SyncSpace Team.
