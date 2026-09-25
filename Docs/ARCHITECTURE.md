# SyncSpace System Architecture & Engineering Design

This document details the architectural decisions, synchronization models, concurrency strategies, and execution topologies underpinning the **SyncSpace** platform.

---

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [CRDT Conflict-Free Synchronization (Yjs)](#2-crdt-conflict-free-synchronization-yjs)
3. [Resilient Multi-Tier Code Execution Pipeline](#3-resilient-multi-tier-code-execution-pipeline)
4. [Persistence & Debounce Strategy](#4-persistence--debounce-strategy)
5. [Real-Time WebSocket Gateway & Room Topology](#5-real-time-websocket-gateway--room-topology)
6. [Security, CORS & Origin Filtering](#6-security-cors--origin-filtering)
7. [Cloud Deployment Topology](#7-cloud-deployment-topology)

---

## 1. High-Level Architecture

SyncSpace employs a reactive, event-driven architecture combining client-side CRDT evaluation with dual-protocol transport (HTTP REST for transactional operations and WebSockets for sub-millisecond collaboration).

```text
+-------------------------------------------------------------------------------------------------+
|                                     CLIENT APPLICATION                                          |
|                                     (React 19 + Vite + Tailwind)                                |
|                                                                                                 |
|   +--------------------------+    +-----------------------+     +---------------------------+   |
|   |   Monaco Editor (IDE)    |    |   Konva Whiteboard    |     |   Terminal & UI Layers    |   |
|   +------------+-------------+    +-----------+-----------+     +-------------+-------------+   |
|                |                              |                               |                 |
|           (y-monaco)                    (Canvas Events)                  (Axios Client)         |
|                |                              |                               |                 |
|         +------v------+                 +-----v-----+                         |                 |
|         | Yjs (Y.Doc) |                 | Shape POS |                         |                 |
|         +------+------+                 +-----+-----+                         |                 |
+----------------+------------------------------+-------------------------------+-----------------+
                 |                              |                               |
          (Binary Updates)              (JSON Payloads)                  (HTTP Requests)
                 |                              |                               |
                 |       WEBSOCKET TRANSPORT    |                       REST API TRANSPORT        |
                 +--------------+---------------+                               |
                                |                                               |
+-------------------------------v-----------------------------------------------v-----------------+
|                                     BACKEND CLOUD SERVICE                                       |
|                                  (Node.js + Express.js on Render)                               |
|                                                                                                 |
|   +-----------------------------------------------------------------------------------------+   |
|   |                       CORS & Preflight Origin Verification Gate                         |   |
|   |      (Supports Vercel previews, Netlify domains, Render origins, & Localhost dev)       |   |
|   +---------------------------+-----------------------------------------------+-------------+   |
|                               |                                               |                 |
|                +--------------v--------------+                 +--------------v-------------+   |
|                |   Socket.io Room Gateway    |                 |   Express REST Controllers |   |
|                |  - Yjs CRDT Vector Relay    |                 |  - Authentication (JWT)    |   |
|                |  - Presence & Cursor Engine |                 |  - Room Lifecycle          |   |
|                |  - File Tree Synchronization|                 |  - State Rehydration       |   |
|                +--------------+--------------+                 +--------------+-------------+   |
|                               |                                               |                 |
|                               +-----------------------+-----------------------+                 |
|                                                       |                                         |
|                                        +--------------v--------------+                          |
|                                        |  MongoDB Atlas Cloud Store  |                          |
|                                        |  (Debounced Writes @ 800ms) |                          |
|                                        +-----------------------------+                          |
|                                                       |                                         |
|                                        +--------------v--------------+                          |
|                                        |  Multi-Tier Compiler Engine |                          |
|                                        |  Tier 1: Judge0 CE API      |                          |
|                                        |  Tier 2: Glot.io API        |                          |
|                                        |  Tier 3: Host Toolchain     |                          |
|                                        +-----------------------------+                          |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. CRDT Conflict-Free Synchronization (Yjs)

Collaborative code editing requires that simultaneous typing by geographically distributed users never leads to overwrite conflicts or cursor jumps.

### Implementation Details:
1. **Per-File Isolated `Y.Doc` Documents**:
   Instead of binding a single global document, each file in the workspace maintains an independent `Y.Doc` instance identified by `fileName`.
2. **Binary State Vectors**:
   When a user types in Monaco, the mutation triggers `Y.encodeStateAsUpdate(doc)`. The resulting `Uint8Array` delta is transmitted over Socket.io (`yjs-update`).
3. **Peer Rehydration via State Request**:
   When a new peer opens a file, they emit `yjs-request-state`. The active editing peer responds with a full binary snapshot (`yjs-state-response`) directly routed to the requester's `socket.id`.
4. **Deterministic Merging**:
   Updates are applied via `Y.applyUpdate(doc, update, "socket")`. The mathematical properties of CRDTs guarantee that regardless of network latency or arrival order, all clients converge to identical code buffers.

---

## 3. Resilient Multi-Tier Code Execution Pipeline

The compilation engine (`/api/execute`) executes untrusted user code across 8 languages without exposing credentials to the client browser.

```text
User executes code (e.g. C++, Java, Rust, Go)
               │
               ▼
   [Express Gateway /api/execute]
               │
               ▼
   ┌───────────────────────┐
   │ Tier 1: Judge0 CE     │ ──(Success)──► [Format & Return stdout/stderr]
   └───────────┬───────────┘
               │ (Fails / Rate Limited / Offline)
               ▼
   ┌───────────────────────┐
   │ Tier 2: Glot.io       │ ──(Success)──► [Format & Return stdout/stderr]
   └───────────┬───────────┘
               │ (Fails / Unreachable)
               ▼
   ┌───────────────────────┐
   │ Tier 3: Local Host    │ ──(Success)──► [Format & Return stdout/stderr]
   │ (g++, gcc, python)    │
   └───────────┬───────────┘
               │ (Fails)
               ▼
   [Return Detailed Diagnostic Exception to Client Console]
```

---

## 4. Persistence & Debounce Strategy

High-frequency real-time events (such as typing at 80 WPM or drawing complex vector lines) would overwhelm database IOPS if written synchronously.

SyncSpace uses a **Per-Room Debounce Strategy (800ms)**:
- Rapid keystrokes and file modifications restart an active in-memory timer (`codeDebounceTimers` and `filesDebounceTimers`).
- Only after user activity pauses for 800ms does a single `Room.findByIdAndUpdate()` write execute to MongoDB Atlas.
- This reduces database write operations by **over 95%** while preserving real-time durability.

---

## 5. Real-Time WebSocket Gateway & Room Topology

Socket.io rooms are partitioned by `roomId`.

```text
Room Channel: [roomId]
├── Event: join-room (broadcasts user-joined, sends initial room-state)
├── Event: yjs-update:fileName (binary CRDT diffs)
├── Event: cursor-move (mouse coordinates with 60fps throttling)
├── Event: whiteboard-draw (vector shape sync)
├── Event: files-change (file explorer mutations)
└── Event: disconnect (cleans up cursor and emits user-left)
```

---

## 6. Security, CORS & Origin Filtering

SyncSpace protects cross-origin communication via a dynamic CORS evaluation layer:
- **Flexible Origin Recognition**: Automatically verifies and approves domains ending in `.vercel.app`, `.netlify.app`, and `.onrender.com`.
- **Trailing Slash Normalization**: Automatically normalizes origins (e.g. `https://sync-space-smoky.vercel.app/` ➔ `https://sync-space-smoky.vercel.app`) to avoid browser rejection.
- **JWT Protection**: All state mutations and profile endpoints enforce `Bearer <token>` validation via [authMiddleware.js](backend/middleware/authMiddleware.js).

---

## 7. Cloud Deployment Topology

| Component | Provider | Configuration |
|---|---|---|
| **Frontend** | Vercel Edge Network | Single-Page Application (SPA) routing, Vite static asset optimization |
| **Backend** | Render Cloud Services | Node.js Web Service, auto-restarts, environment variable isolation |
| **Database** | MongoDB Atlas | M0 Free Tier (Replication enabled, TLS/SSL encrypted connection) |
| **External Compilers** | Judge0 CE & Glot.io | REST endpoints for isolated sandboxed execution |
