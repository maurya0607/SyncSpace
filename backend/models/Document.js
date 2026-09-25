const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            unique: true
        },
        code: {
            type: String,
            default: ""
        },
        whiteboard: {
            type: mongoose.Schema.Types.Mixed,
            default: []
        },
        yjsState: {
            type: Buffer
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Document", documentSchema);
