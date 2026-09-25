# 🚀 SyncSpace — Real-Time Collaborative Workspace

**SyncSpace** is a full-featured real-time pair programming and technical interview platform. Users can create/join rooms, draw architecture diagrams on a collaborative whiteboard, write code across multiple files in a VS Code-style editor with conflict-free Yjs CRDT synchronization, compile and run C++, C, Python, JavaScript, Java, TypeScript, Go & Rust code via a resilient multi-tier execution engine, and replay room timelines.

---

## ✨ Features

- 🎨 **Collaborative Whiteboard**: Built with Konva.js — Pen, Line, Rectangle, Circle, Eraser, Stroke Width & Color selector.
- 💻 **VS Code-Style Multi-File Workspace**:
  - File Explorer (Create, Rename, Delete, Download files).
  - Multi-tab management with active file indicators.
  - Status bar with cursor line/col, theme toggle, and keyboard shortcuts modal.
- ⚡ **Yjs CRDT Real-Time Sync**: Conflict-free concurrent editing so multiple users can type simultaneously without overwriting code, scoped per file.
- 🚀 **Multi-Language Code Runner**:
  - **In-Browser Engine**: Fast direct execution for JavaScript (`.js`).
  - **Multi-Tier Backend Compiler Engine (`/api/execute`)**: Runs C++ (`.cpp`), C (`.c`), Python (`.py`), Java (`.java`), TypeScript (`.ts`), Rust (`.rs`), and Go (`.go`) with automated failover (Judge0 CE ➔ Glot.io ➔ Local System Compiler).
  - Integrated terminal console with colored output, compiler error alerts, and HTML live preview tab.
- 🖱️ **Live User Awareness & Cursors**: Real-time mouse pointer tracking (`CursorOverlay.jsx`) with user names and colored badges on the canvas.
- 🔐 **JWT Authentication & Protected Routes**: Full Register, Login, `GET /api/auth/me` user restoration, and bcrypt password hashing.
- 🔑 **Room Access Control & Invite Codes**: Join rooms using 6-character invite codes; supports Owner, Editor, and Viewer roles (`isReadOnly` mode).
- 💾 **MongoDB Atlas Persistence**: Automatically debounces and saves whiteboard canvas shapes, code content, and file structures to MongoDB Atlas.
- ⏯️ **Session Timeline Replay**: Interactive replay player (`ReplayModal.jsx`) with Play, Pause, Seek, and Reset controls.
- 🌓 **Dark / Light Mode**: Complete editor theme switcher with custom font size options.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Socket.io-client, Monaco Editor (`@monaco-editor/react`), Yjs (`yjs`, `y-monaco`), Konva (`react-konva`), React Icons, React Toastify, Axios.
- **Backend**: Node.js, Express.js, Socket.io, MongoDB (Mongoose), JWT, Bcryptjs, Dotenv, Child Process.
- **Concurrency**: `concurrently` root script running server and client simultaneously.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection string (or local MongoDB)

### 2. Environment Setup

#### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.t9ytoad.mongodb.net/syncspace?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

#### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run the Project
Run both backend & frontend simultaneously with colored terminal logging:

```bash
npm start
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 📂 Folder Structure

```text
SyncSpace/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, GetMe
│   │   └── roomController.js   # Create, Join, Fetch, Save State
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification middleware
│   ├── models/
│   │   ├── User.js             # User Mongoose Schema
│   │   └── Room.js             # Room Mongoose Schema (shapes, code, files, roles)
│   ├── routes/
│   │   ├── authRoutes.js       # Auth API endpoints
│   │   ├── roomRoutes.js       # Room API endpoints
│   │   └── codeRoutes.js       # Multi-Tier Code Execution (/api/execute)
│   ├── server.js               # Express + Socket.io Server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/         # CodeEditor, VSCodeExplorer, VSCodeTabBar, VSCodeStatusBar, EditorToolbar, ConsoleOutput
│   │   │   ├── whiteboard/     # Whiteboard, Toolbar, CursorOverlay
│   │   │   ├── replay/         # ReplayModal
│   │   │   ├── Navbar.jsx      # Top navigation with Theme toggle
│   │   │   ├── Footer.jsx      # Footer
│   │   │   ├── UserList.jsx    # Online users list
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Auth state & session restoration
│   │   │   ├── SocketContext.jsx # Socket.io connection provider
│   │   │   └── ThemeContext.jsx  # Dark/Light mode provider
│   │   ├── hooks/
│   │   │   └── useSocket.js    # Custom socket hook
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── About.jsx       # About page
│   │   │   ├── Help.jsx        # Help center & FAQ accordion
│   │   │   ├── Login.jsx       # Login page
│   │   │   ├── Register.jsx    # Registration page
│   │   │   ├── Dashboard.jsx   # Dashboard with Create & Join forms
│   │   │   └── Room.jsx        # Collaborative workspace page
│   │   ├── services/
│   │   │   ├── api.js          # Axios configuration
│   │   │   └── yjsManager.js   # Yjs CRDT & Monaco binding manager
│   │   └── App.jsx
│   └── package.json
│
├── Docs/                       # Detailed Architecture & API Docs
│   ├── API_DOCUMENTATION.md    # REST endpoints & Socket events
│   └── ARCHITECTURE.md         # System design & execution pipeline
├── package.json                # Root concurrently runner
└── README.md
```

---

## 📜 License
MIT License. Created for SyncSpace Real-Time Collaborative Workspace.
