import * as Y from "yjs";

export class YjsManager {
    /**
     * @param {object} socket  - Socket.io client instance
     * @param {string} roomId  - The collaboration room ID
     * @param {string} fileName - The file's NAME (e.g. "main.cpp"), NOT a local ID.
     *   Using the file name (not a locally-generated ID) as the Yjs channel key
     *   ensures all clients collaborating on "main.cpp" share the same Yjs document.
     *   Local IDs differ between clients, so they can't sync; file names are stable.
     */
    constructor(socket, roomId, fileName) {
        this.socket = socket;
        this.roomId = roomId;
        this.fileName = fileName;
        this.doc = new Y.Doc();
        this.yText = this.doc.getText("monaco");
        this.editor = null;
        this.isUpdatingFromYjs = false;
        this._seedTimeout = null;

        // Scoped channel names — unique per (room, fileName)
        // This prevents file A's Yjs state from bleeding into file B.
        this._updateEvent  = `yjs-update:${fileName}`;
        this._requestEvent = `yjs-request-state:${fileName}`;

        // Broadcast local Yjs changes to peers.
        // CRITICAL: Skip "socket" origin (echo prevention) AND "init" origin
        // (initial seeding must NOT be sent to peers — doing so overwrites their
        // content with our blank/default state, causing the "code disappears" bug).
        this.doc.on("update", (update, origin) => {
            if (origin !== "socket" && origin !== "init" && this.socket) {
                this.socket.emit("yjs-update", {
                    roomId: this.roomId,
                    fileName: this.fileName,
                    update: Array.from(update),
                });
            }
        });

        if (this.socket) {
            // Receive Yjs updates scoped to this file
            this.handleRemoteUpdate = ({ update }) => {
                if (update) {
                    const uint8Update = new Uint8Array(update);
                    Y.applyUpdate(this.doc, uint8Update, "socket");
                }
            };

            // Respond to a newly-joining peer's state request for THIS file
            this.handleStateRequest = ({ requesterId }) => {
                if (requesterId && this.socket) {
                    const state = Y.encodeStateAsUpdate(this.doc);
                    this.socket.emit("yjs-state-response", {
                        roomId: this.roomId,
                        fileName: this.fileName,
                        targetId: requesterId,
                        update: Array.from(state),
                    });
                }
            };

            this.socket.on(this._updateEvent,  this.handleRemoteUpdate);
            this.socket.on(this._requestEvent, this.handleStateRequest);

            // Ask existing peers for this file's current Yjs state
            this.socket.emit("yjs-request-state", {
                roomId: this.roomId,
                fileName: this.fileName,
            });
        }
    }

    bindMonaco(editor) {
        if (!editor) return;
        this.editor = editor;

        // Observer: remote Yjs updates → sync into Monaco Editor
        this.yTextObserver = () => {
            if (this.isUpdatingFromYjs) return;
            const model = this.editor.getModel();
            if (!model) return;

            const yTextContent = this.yText.toString();
            const currentEditorContent = model.getValue();

            // Only update Monaco if Yjs has non-empty content (prevents wiping
            // the editor when an empty initial state arrives from a fresh peer)
            if (yTextContent !== currentEditorContent && yTextContent.length > 0) {
                this.isUpdatingFromYjs = true;
                const position = this.editor.getPosition();
                model.setValue(yTextContent);
                if (position) this.editor.setPosition(position);
                this.isUpdatingFromYjs = false;
            }
        };

        this.yText.observe(this.yTextObserver);

        // Listener: local Monaco changes → sync into Y.Text
        this.editorChangeListener = this.editor.onDidChangeModelContent(() => {
            if (this.isUpdatingFromYjs) return;
            const currentEditorContent = this.editor.getValue();
            const yTextContent = this.yText.toString();

            if (currentEditorContent !== yTextContent) {
                this.doc.transact(() => {
                    this.yText.delete(0, this.yText.length);
                    this.yText.insert(0, currentEditorContent);
                });
                // Normal transact (no special origin) → WILL be emitted to peers ✓
            }
        });

        // Delayed seed: only seed yText if no peer responded within 600ms.
        // This handles the "first user in room" case without interfering with
        // users who receive peer state. The seed uses "init" origin so it is
        // NOT broadcast to peers (preventing the "new joiner wipes existing
        // user's code" bug).
        this._seedTimeout = setTimeout(() => {
            if (this.yText.length === 0 && this.editor) {
                const initialContent = this.editor.getValue();
                if (initialContent) {
                    this.doc.transact(() => {
                        this.yText.insert(0, initialContent);
                    }, "init"); // "init" → skipped by doc.on("update") → not broadcast
                }
            }
        }, 600);
    }

    destroy() {
        if (this._seedTimeout) clearTimeout(this._seedTimeout);
        if (this.yText && this.yTextObserver) {
            this.yText.unobserve(this.yTextObserver);
        }
        if (this.editorChangeListener) {
            this.editorChangeListener.dispose();
        }
        if (this.socket) {
            this.socket.off(this._updateEvent,  this.handleRemoteUpdate);
            this.socket.off(this._requestEvent, this.handleStateRequest);
        }
        this.doc.destroy();
    }
}
