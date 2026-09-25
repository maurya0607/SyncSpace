const crypto = require("crypto");
const Room = require("../models/Room");

exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Room name is required" });
        }

        const inviteCode = crypto.randomBytes(6).toString("hex");

        const rolesMap = new Map();
        rolesMap.set(req.user._id.toString(), "owner");

        const room = await Room.create({
            name,
            owner: req.user._id,
            members: [req.user._id],
            roles: rolesMap,
            inviteCode
        });

        res.status(201).json(room);
    } catch (error) {
        console.error("Create room error:", error);
        res.status(500).json({ message: "Unable to create room" });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ members: req.user._id }).populate("members", "name email");
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch rooms" });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId).populate("members", "name email");
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        
        if (!room.members.some(member => member._id.toString() === req.user._id.toString())) {
            // Auto add as member if accessing via valid room ID
            room.members.push(req.user._id);
            if (!room.roles) room.roles = new Map();
            if (!room.roles.has(req.user._id.toString())) {
                room.roles.set(req.user._id.toString(), "editor");
            }
            await room.save();
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch room" });
    }
};

exports.saveRoomState = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { whiteboardState, codeContent, language, filesState, yjsState } = req.body;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (whiteboardState !== undefined) room.whiteboardState = whiteboardState;
        if (codeContent !== undefined) room.codeContent = codeContent;
        if (language !== undefined) room.language = language;
        if (filesState !== undefined) room.filesState = filesState;
        if (yjsState !== undefined) room.yjsState = yjsState;

        await room.save();
        res.status(200).json({ message: "Room state saved successfully" });
    } catch (error) {
        console.error("Save room state error:", error);
        res.status(500).json({ message: "Failed to save room state" });
    }
};

exports.joinRoomByCode = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const room = await Room.findOne({ inviteCode });
        if (!room) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        if (!room.members.includes(req.user._id)) {
            room.members.push(req.user._id);
            if (!room.roles) room.roles = new Map();
            room.roles.set(req.user._id.toString(), "editor");
            await room.save();
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: "Failed to join room" });
    }
};
