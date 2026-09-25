# SyncSpace API & Socket Specification

This document provides a comprehensive technical reference for SyncSpace's REST APIs, WebSocket real-time events, and error response contracts.

---

## Table of Contents
1. [Base URLs & Environment](#1-base-urls--environment)
2. [Authentication Protocol (`/api/auth`)](#2-authentication-protocol-apiauth)
3. [Room & Workspace APIs (`/api/rooms`)](#3-room--workspace-apis-apirooms)
4. [Multi-Tier Code Execution Engine (`/api/execute`)](#4-multi-tier-code-execution-engine-apiexecute)
5. [System Health Check Endpoints](#5-system-health-check-endpoints)
6. [WebSocket Real-Time Gateway Events](#6-websocket-real-time-gateway-events)
7. [Standard Error Responses](#7-standard-error-responses)

---

## 1. Base URLs & Environment

| Environment | REST API Base URL | WebSocket Server URL |
|---|---|---|
| **Local Development** | `http://localhost:5000/api` | `http://localhost:5000` |
| **Production (Render)** | `https://syncspace-dzvu.onrender.com/api` | `https://syncspace-dzvu.onrender.com` |

All protected routes require an HTTP Authorization header formatted as:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 2. Authentication Protocol (`/api/auth`)

### 2.1 Register User
Creates a new user account with hashed password storage.
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Registration successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "64f9b2c3a5d8e70012345678",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
  ```

---

### 2.2 User Login
Authenticates credentials and returns a signed JSON Web Token (valid for 30 days).
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "64f9b2c3a5d8e70012345678",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
  ```

---

### 2.3 Get Current User Profile (`Me`)
Validates the current session token and rehydrates client authentication context.
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "64f9b2c3a5d8e70012345678",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
  ```

---

## 3. Room & Workspace APIs (`/api/rooms`)

### 3.1 Create Room
Creates a new collaborative room and assigns a unique 6-character alphanumeric invite code.
- **Method**: `POST`
- **Endpoint**: `/api/rooms`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "Frontend Architecture Review"
  }
  ```
- **Response `201 Created`**: Returns populated Room object with `inviteCode` and user assigned as `owner`.

---

### 3.2 List User Rooms
Retrieves all active rooms where the user is an owner or participant.
- **Method**: `GET`
- **Endpoint**: `/api/rooms`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Array of Room objects.

---

### 3.3 Join Room by Invite Code
Adds the authenticated user to a room via its invite code.
- **Method**: `POST`
- **Endpoint**: `/api/rooms/join`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "inviteCode": "b252a5"
  }
  ```
- **Response `200 OK`**: Room object.

---

### 3.4 Get Room Workspace State by ID
Fetches complete persisted state (files, active code, whiteboard shapes, user roles).
- **Method**: `GET`
- **Endpoint**: `/api/rooms/:roomId`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "_id": "64f9b2c3a5d8e70012345678",
    "name": "System Design Session",
    "inviteCode": "b252a5",
    "owner": "64f9b2c3a5d8e70012345678",
    "codeContent": "// Starting template code",
    "language": "javascript",
    "whiteboardState": [],
    "filesState": [
      {
        "id": "file-1",
        "name": "index.js",
        "language": "javascript",
        "content": "console.log('SyncSpace');"
      }
    ]
  }
  ```

---

### 3.5 Persist Room State (Debounced Backup)
Updates the room's persistent state in MongoDB.
- **Method**: `PUT`
- **Endpoint**: `/api/rooms/:roomId/state`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "whiteboardState": [...],
    "codeContent": "...",
    "language": "python",
    "filesState": [...]
  }
  ```
- **Response `200 OK`**: `{ "message": "Room state saved successfully" }`

---

## 4. Multi-Tier Code Execution Engine (`/api/execute`)

Compiles and executes code across 8 supported programming languages using a 3-tier resilient fallback architecture.

- **Method**: `POST`
- **Endpoint**: `/api/execute` (or `/api/code/execute`)
- **Headers**: `Content-Type: application/json`
- **Supported Languages**: `cpp`, `c`, `python`, `javascript`, `typescript`, `java`, `rust`, `go`
- **Request Body**:
  ```json
  {
    "language": "cpp",
    "code": "#include <iostream>\nint main() {\n    std::cout << \"SyncSpace Compiler Online\\n\";\n    return 0;\n}",
    "fileName": "main.cpp"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "engine": "Judge0 CE",
    "output": "SyncSpace Compiler Online\n",
    "stderr": "",
    "compileError": "",
    "exitCode": 0
  }
  ```

---

## 5. System Health Check Endpoints

- **Root Server Health Check**:
  - `GET /`
  - Returns `200 OK`: `{ "message": "SyncSpace API is running" }`
- **API Router Health Check**:
  - `GET /api`
  - Returns `200 OK`: Confirms Express router is active.

---

## 6. WebSocket Real-Time Gateway Events

SyncSpace runs a full-duplex Socket.io gateway supporting pub/sub room isolation.

| Event Name | Direction | Payload Structure | Purpose |
|---|---|---|---|
| `join-room` | Client ➔ Server | `{ roomId: string, user: Object }` | Joins socket to the room channel and broadcasts entry. |
| `leave-room` | Client ➔ Server | `roomId: string` | Leaves room channel and triggers cleanup. |
| `user-joined` | Server ➔ Client | `{ userId: string, user: Object }` | Notifies peers of new participant arrival. |
| `user-left` | Server ➔ Client | `{ userId: string, user: Object }` | Notifies peers when participant disconnects. |
| `room-users` | Server ➔ Client | `Array<User>` | Emits updated list of all active room peers. |
| `room-state` | Server ➔ Client | `{ code, whiteboard, language, files }` | Hydrates newly joined client with persisted state. |
| `yjs-update` | Bidirectional | `{ roomId, fileName, update: Uint8Array }` | Transmits binary CRDT state vector deltas. |
| `yjs-request-state` | Client ➔ Server | `{ roomId, fileName }` | Solicits complete state vector snapshot from peers. |
| `yjs-state-response` | Client ➔ Server | `{ fileName, targetId, update }` | Routes full document snapshot directly to new peer. |
| `cursor-move` | Client ➔ Server | `{ roomId, position: {x,y}, user }` | Emits live mouse coordinates on whiteboard canvas. |
| `cursor-update` | Server ➔ Client | `{ socketId, position, user }` | Broadcasts mouse cursor position to room peers. |
| `cursor-remove` | Server ➔ Client | `{ socketId }` | Removes disconnected peer cursor badge from canvas. |
| `files-change` | Client ➔ Server | `{ roomId, files: Array<File> }` | Emits file tree mutations (create, rename, delete). |
| `files-update` | Server ➔ Client | `Array<File>` | Propagates updated file tree across all room peers. |
| `code-change` | Client ➔ Server | `{ roomId, code: string }` | Backup code change broadcast (debounced MongoDB save). |
| `code-update` | Server ➔ Client | `code: string` | Fallback code synchronizer. |
| `language-change` | Client ➔ Server | `{ roomId, language: string }` | Emits active syntax highlighter switch. |
| `language-update` | Server ➔ Client | `language: string` | Updates editor syntax model across peers. |
| `whiteboard-draw-start`| Client ➔ Server | `{ roomId, shape: Object }` | Starts drawing vector shape. |
| `whiteboard-draw-progress`| Client ➔ Server | `{ roomId, shape: Object }` | Streams in-progress vector coordinates. |
| `whiteboard-draw-end` | Client ➔ Server | `{ roomId, shape: Object }` | Persists completed vector shape to room history in DB. |
| `whiteboard-clear` | Bidirectional | `{ roomId }` | Clears all whiteboard canvas shapes in DB and peers. |

---

## 7. Standard Error Responses

All API errors return consistent JSON payloads:

```json
{
  "message": "Human-readable error description",
  "detail": "Optional internal exception message (in development)"
}
```

Common HTTP status codes:
- `400 Bad Request`: Missing required parameters or malformed JSON.
- `401 Unauthorized`: Token missing, invalid, or expired.
- `403 Forbidden`: Insufficient role or room permission.
- `404 Not Found`: Resource (room or user) does not exist.
- `409 Conflict`: Resource already exists (e.g., email already registered).
- `500 Internal Server Error`: Unhandled server exception.
