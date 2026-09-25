require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const codeRoutes = require("./routes/codeRoutes");
const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);

connectDB();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((url) => url.trim());

const corsOriginHandler = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
        return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
};

app.use(
    cors({
        origin: corsOriginHandler,
        credentials: true
    })
);

app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/code", codeRoutes);
app.use("/api", codeRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "SyncSpace API is running"
    });
});

const io = new Server(server, {
    cors: {
        origin: corsOriginHandler,
        credentials: true
    }
});

// Basic in-memory room tracking
const roomUsers = new Map(); // roomId -> Map of socketId -> user
const userSockets = new Map(); // socketId -> { roomId, user }
const codeDebounceTimers = new Map(); // roomId -> debounce timer for MongoDB saves
const filesDebounceTimers = new Map(); // roomId -> debounce timer for filesState saves

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("join-room", async ({ roomId, user }) => {
        socket.join(roomId);

        const userInfo = user || { _id: socket.id, name: "Anonymous" };
        userSockets.set(socket.id, { roomId, user: userInfo });

        if (!roomUsers.has(roomId)) {
            roomUsers.set(roomId, new Map());
        }
        roomUsers.get(roomId).set(socket.id, userInfo);

        // Broadcast user-joined to room
        socket.to(roomId).emit("user-joined", {
            userId: socket.id,
            user: userInfo
        });

        // Send current user list to room
        io.to(roomId).emit("room-users", Array.from(roomUsers.get(roomId).values()));

        // --- STEP 6: Load & send saved room state from MongoDB to joining user ---
        try {
            const roomDoc = await Room.findById(roomId);
            if (roomDoc) {
                socket.emit("room-state", {
                    code: roomDoc.codeContent,
                    whiteboard: roomDoc.whiteboardState || [],
                    language: roomDoc.language || "javascript",
                    files: roomDoc.filesState || []
                });
            }
        } catch (err) {
            console.error("Error sending initial room state:", err.message);
        }
    });

    socket.on("leave-room", (roomId) => {
        socket.leave(roomId);
        handleDisconnect(socket);
    });

    // --- YJS CRDT Real-Time Events (scoped per file by fileName) ---
    // Using fileName (not a local ID) ensures all clients editing "main.cpp"
    // share the same Yjs channel — local IDs differ between clients.
    socket.on("yjs-update", ({ roomId, fileName, update }) => {
        socket.to(roomId).emit(`yjs-update:${fileName}`, { update });
    });

    socket.on("yjs-request-state", ({ roomId, fileName }) => {
        socket.to(roomId).emit(`yjs-request-state:${fileName}`, { requesterId: socket.id });
    });

    // Route full Yjs state snapshot directly to the requester socket only
    socket.on("yjs-state-response", ({ fileName, targetId, update }) => {
        if (targetId && update && fileName) {
            io.to(targetId).emit(`yjs-update:${fileName}`, { update });
        }
    });

    // --- Cursor & Presence Events ---
    socket.on("cursor-move", ({ roomId, position, user }) => {
        socket.to(roomId).emit("cursor-update", {
            socketId: socket.id,
            position,
            user
        });
    });

    // --- Whiteboard Real-Time & Persistence Events ---
    socket.on("whiteboard-draw-start", ({ roomId, shape }) => {
        socket.to(roomId).emit("whiteboard-draw", shape);
    });

    socket.on("whiteboard-draw-progress", ({ roomId, shape }) => {
        socket.to(roomId).emit("whiteboard-draw-update", shape);
    });

    socket.on("whiteboard-draw-end", async ({ roomId, shape }) => {
        socket.to(roomId).emit("whiteboard-draw-update", shape);

        // --- STEP 8: Save whiteboard shape to MongoDB ---
        try {
            await Room.findByIdAndUpdate(roomId, {
                $push: { whiteboardState: shape }
            });
        } catch (err) {
            console.error("Error persisting whiteboard shape:", err.message);
        }
    });

    socket.on("whiteboard-clear", async ({ roomId }) => {
        io.to(roomId).emit("whiteboard-clear");

        // --- STEP 8: Clear whiteboard in MongoDB ---
        try {
            await Room.findByIdAndUpdate(roomId, {
                $set: { whiteboardState: [] }
            });
        } catch (err) {
            console.error("Error clearing whiteboard in DB:", err.message);
        }
    });

    // --- Code Editor Real-Time & Persistence Events ---
    socket.on("files-change", async ({ roomId, files }) => {
        // Broadcast files structure update (creation, deletion, renaming) to room peers
        socket.to(roomId).emit("files-update", files);

        if (filesDebounceTimers.has(roomId)) {
            clearTimeout(filesDebounceTimers.get(roomId));
        }
        filesDebounceTimers.set(roomId, setTimeout(async () => {
            filesDebounceTimers.delete(roomId);
            try {
                const activeFile = Array.isArray(files) && files.length > 0 ? files[0] : null;
                await Room.findByIdAndUpdate(roomId, {
                    $set: {
                        filesState: files,
                        ...(activeFile ? { codeContent: activeFile.content, language: activeFile.language } : {})
                    }
                });
            } catch (err) {
                console.error("Error persisting files change:", err.message);
            }
        }, 800));
    });

    socket.on("code-change", async ({ roomId, code }) => {
        // Broadcast to all other peers in the room immediately
        socket.to(roomId).emit("code-update", code);

        // Debounce MongoDB writes per room (800ms) so rapid keystrokes
        // don't create a write storm — only the latest content is saved.
        if (codeDebounceTimers.has(roomId)) {
            clearTimeout(codeDebounceTimers.get(roomId));
        }
        codeDebounceTimers.set(roomId, setTimeout(async () => {
            codeDebounceTimers.delete(roomId);
            try {
                await Room.findByIdAndUpdate(roomId, {
                    $set: { codeContent: code }
                });
            } catch (err) {
                console.error("Error persisting code change:", err.message);
            }
        }, 800));
    });

    socket.on("language-change", async ({ roomId, language }) => {
        socket.to(roomId).emit("language-update", language);

        try {
            await Room.findByIdAndUpdate(roomId, {
                $set: { language: language }
            });
        } catch (err) {
            console.error("Error persisting language change:", err.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        handleDisconnect(socket);
    });

    function handleDisconnect(socket) {
        if (userSockets.has(socket.id)) {
            const { roomId, user } = userSockets.get(socket.id);
            if (roomUsers.has(roomId)) {
                roomUsers.get(roomId).delete(socket.id);
                io.to(roomId).emit("room-users", Array.from(roomUsers.get(roomId).values()));
                socket.to(roomId).emit("user-left", { userId: socket.id, user });
                socket.to(roomId).emit("cursor-remove", { socketId: socket.id });
                if (roomUsers.get(roomId).size === 0) {
                    roomUsers.delete(roomId);
                }
            }
            userSockets.delete(socket.id);
        }
    }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
