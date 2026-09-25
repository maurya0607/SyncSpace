# 📖 SyncSpace API & Socket Documentation

## REST API Endpoints

### 🔑 Authentication Routes (`/api/auth`)

#### 1. Register User
- **POST** `/api/auth/register`
- **Body**: `{ "name": "String", "email": "String", "password": "String" }`
- **Response** `201 Created`:
  ```json
  {
    "message": "Registration successful",
    "token": "JWT_TOKEN_STRING",
    "user": { "id": "USER_ID", "name": "Name", "email": "email@example.com" }
  }
  ```

#### 2. Login User
- **POST** `/api/auth/login`
- **Body**: `{ "email": "String", "password": "String" }`
- **Response** `200 OK`:
  ```json
  {
    "message": "Login successful",
    "token": "JWT_TOKEN_STRING",
    "user": { "id": "USER_ID", "name": "Name", "email": "email@example.com" }
  }
  ```

#### 3. Get Current User Profile
- **GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`:
  ```json
  {
    "user": { "id": "USER_ID", "name": "Name", "email": "email@example.com" }
  }
  ```

---

### 🚪 Room Management Routes (`/api/rooms`)

#### 1. Create Room
- **POST** `/api/rooms`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "Room Name" }`
- **Response** `201 Created`: Returns Room Object with `inviteCode`.

#### 2. Fetch User Rooms
- **GET** `/api/rooms`
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`: Array of room objects where user is a member.

#### 3. Get Room Details by ID
- **GET** `/api/rooms/:roomId`
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`: Returns full room data including `whiteboardState`, `codeContent`, `language`, `filesState`, and `roles`.

#### 4. Join Room by Invite Code
- **POST** `/api/rooms/join`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "inviteCode": "b252a5" }`
- **Response** `200 OK`: Returns joined Room object.

#### 5. Save Room State
- **PUT** `/api/rooms/:roomId/state`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "whiteboardState": [...], "codeContent": "...", "language": "cpp", "filesState": [...] }`
- **Response** `200 OK`: `{ "message": "Room state saved successfully" }`

---

### ⚡ Code Execution Engine Routes (`/api/execute` / `/api/code/execute`)

#### 1. Execute Multi-Language Code
Compiles and runs code via a 3-tier resilient execution system (Judge0 CE ➔ Glot.io ➔ Local Compiler).

- **POST** `/api/execute` or `/api/code/execute`
- **Supported Languages**: `cpp`, `c`, `python`, `javascript`, `typescript`, `java`, `rust`, `go`
- **Request Body**:
  ```json
  {
    "language": "cpp",
    "code": "#include <iostream>\nint main() { std::cout << \"Hello from SyncSpace!\"; return 0; }",
    "fileName": "main.cpp"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "success": true,
    "engine": "Judge0 CE",
    "output": "Hello from SyncSpace!",
    "stderr": "",
    "compileError": "",
    "exitCode": 0
  }
  ```
- **Response** `400 Bad Request` / `502 Bad Gateway`: Returns error details if input is missing or all engines are unreachable.

---

## ⚡ Socket.io Events Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client ➔ Server | `{ roomId, user }` | Joins a room channel and registers presence. |
| `leave-room` | Client ➔ Server | `roomId` | Leaves the room channel. |
| `user-joined` | Server ➔ Client | `{ userId, user }` | Broadcasted when a new user joins. |
| `user-left` | Server ➔ Client | `{ userId, user }` | Broadcasted when a user leaves/disconnects. |
| `room-users` | Server ➔ Client | `Array<User>` | Returns array of all active users in the room. |
| `room-state` | Server ➔ Client | `{ code, whiteboard, language, files }` | Sends initial persisted room state upon joining. |
| `yjs-update` | Bidirectional | `{ roomId, fileName, update }` | Real-time CRDT delta vectors scoped by `fileName`. |
| `yjs-request-state` | Client ➔ Server | `{ roomId, fileName }` | Requests full Yjs document snapshot for a file. |
| `yjs-state-response` | Client ➔ Server | `{ fileName, targetId, update }` | Sends complete Yjs snapshot to new peer. |
| `cursor-move` | Client ➔ Server | `{ roomId, position, user }` | Emits live mouse position on Whiteboard. |
| `cursor-update` | Server ➔ Client | `{ socketId, position, user }` | Broadcasts mouse cursor updates to peers. |
| `cursor-remove` | Server ➔ Client | `{ socketId }` | Removes disconnected peer cursor. |
| `files-change` | Client ➔ Server | `{ roomId, files }` | Broadcasts file create/delete/rename in explorer. |
| `files-update` | Server ➔ Client | `Array<File>` | Synchronizes file tree across all peers in room. |
| `code-change` | Client ➔ Server | `{ roomId, code }` | Fallback code persistence event (debounced 800ms). |
| `code-update` | Server ➔ Client | `String` (code) | Syncs active code buffer to peers. |
| `language-change` | Client ➔ Server | `{ roomId, language }` | Emits active language switch. |
| `language-update` | Server ➔ Client | `String` (language) | Updates editor language syntax highlighting across peers. |
| `whiteboard-draw-start` | Client ➔ Server | `{ roomId, shape }` | Broadcasts shape creation start. |
| `whiteboard-draw-progress` | Client ➔ Server | `{ roomId, shape }` | Broadcasts active drawing coordinates. |
| `whiteboard-draw-end` | Client ➔ Server | `{ roomId, shape }` | Broadcasts and persists completed shape. |
| `whiteboard-clear` | Bidirectional | `{ roomId }` | Clears all shapes on the canvas and in DB. |
