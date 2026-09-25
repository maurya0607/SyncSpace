const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        roles: {
            type: Map,
            of: String,
            default: {}
        },
        inviteCode: {
            type: String,
            unique: true,
            required: true
        },
        whiteboardState: {
            type: Array,
            default: []
        },
        codeContent: {
            type: String,
            default: "// Welcome to SyncSpace Collaborative Code Editor\n\nfunction helloWorld() {\n  console.log('SyncSpace is awesome!');\n}\n\nhelloWorld();\n"
        },
        language: {
            type: String,
            default: "javascript"
        },
        filesState: {
            type: Array,
            default: []
        },
        yjsState: {
            type: String, // Base64 encoded Yjs binary update vector
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Room", roomSchema);
