# 🏗️ SyncSpace System Architecture

## Architecture Overview

SyncSpace follows a real-time client-server architecture designed around CRDTs (Conflict-Free Replicated Data Types), WebSockets, and a Multi-Tier Code Execution Engine.

```text
+---------------------------------------------------------------------------------------+
|                                      CLIENT SIDE                                      |
|  +---------------------------+     +-------------------+     +---------------------+  |
|  | Monaco Editor & Explorer  |     | Konva Whiteboard  |     | UI, Auth & Terminal |  |
|  +-------------+-------------+     +---------+---------+     +----------+----------+  |
|                |                             |                          |             |
|          (y-monaco)                    (mouse events)              (Axios API)        |
|                |                             |                          |             |
|          +-----+----+                  +-----+-----+                    |             |
|          | Yjs Y.Doc|                  | Shapes/Pos|                    |             |
|          +-----+----+                  +-----+-----+                    |             |
|                |                             |                          |             |
+----------------+-----------------------------+--------------------------+-------------+
                 |                             |                          |
            (yjs-update)              (whiteboard/cursor)             (HTTP REST)
                 |                             |                          |
+----------------+-----------------------------+--------------------------+-------------+
|                                      SERVER SIDE                                      |
|                +-----------------------------+                          |             |
|                |      Socket.io Gateway      |                          |             |
|                +--------------+--------------+                          |             |
|                               |                                         |             |
|                         (Room Pub/Sub)                         (Express Server)       |
|                               |                                   |          |        |
|                +--------------+--------------+                    |          |        |
|                | MongoDB Room Persistence    |<-------------------+          |        |
|                +-----------------------------+                               |        |
|                                                                              |        |
|                                   +------------------------------------------+        |
|                                   |                                                   |
|                         +---------v-----------------------------------------+         |
|                         |      Multi-Tier Code Execution Engine             |         |
|                         |  1. Judge0 CE Public Engine (Primary)             |         |
|                         |  2. Glot.io High-Speed Runner (Secondary)         |         |
|                         |  3. Local OS Compiler g++/gcc/python (Tertiary)   |         |
|                         +---------------------------------------------------+         |
+---------------------------------------------------------------------------------------+
```

---

## Key Architectural Decisions

### 1. Conflict-Free Concurrent Editing (Yjs CRDT per File)
To prevent users from overwriting each other's code when editing files simultaneously:
- Each client maintains local `Y.Doc` instances scoped by `fileName` bound to Monaco Editor via `y-monaco`.
- Edits generate Uint8Array delta update vectors (`Y.encodeStateAsUpdate`).
- Deltas are broadcast over Socket.io (`yjs-update`). Receiving clients apply deltas using `Y.applyUpdate(doc, update, "socket")`.
- Code changes merge deterministically without a central locking mechanism.

### 2. Multi-Tier Code Execution Engine (`/api/execute`)
To support non-JavaScript languages (`C++`, `C`, `Python`, `Java`, `TypeScript`, `Rust`, `Go`) without browser CORS or 401 token restrictions:
- **Tier 1 (Judge0 CE)**: Sends compilation & execution requests to the Judge0 CE public engine.
- **Tier 2 (Glot.io Failover)**: If Judge0 is busy or unreachable, seamlessly routes the execution to Glot.io runner.
- **Tier 3 (Local Execution Fallback)**: If external networks are offline, executes using the host machine's installed compilers (`g++`, `gcc`, `python`).
- Output, compiler warnings, stderr, and stdout are unified and streamed to the editor terminal console.

### 3. File Explorer & Workspace Synchronization
- The VS Code-style workspace tree (`VSCodeExplorer.jsx`, `VSCodeTabBar.jsx`, `VSCodeStatusBar.jsx`) syncs file creations, deletions, and active tabs across all participants in real time via `files-change` and `files-update` socket events.

### 4. Live Presence & Cursor Overlay
- Mouse move events over the Whiteboard trigger low-latency `cursor-move` socket emissions (`x, y, name, color`).
- The receiving clients render cursor overlays (`CursorOverlay.jsx`) dynamically using CSS translate transforms.

### 5. Session Restoration & MongoDB Atlas Persistence
- Room states (`whiteboardState` shapes array, `codeContent`, `language`, `filesState`, `roles`) are saved to MongoDB Atlas with debouncing (800ms) to avoid write storms.
- When opening or joining a room, `GET /api/rooms/:roomId` and `join-room` hydrate the canvas and workspace state.
