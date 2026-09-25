const express = require("express");
const { createRoom, getRooms, getRoomById, saveRoomState, joinRoomByCode } = require("../controllers/roomController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
    .post(protect, createRoom)
    .get(protect, getRooms);

router.post("/join", protect, joinRoomByCode);

router.route("/:roomId")
    .get(protect, getRoomById);

router.put("/:roomId/state", protect, saveRoomState);

module.exports = router;
