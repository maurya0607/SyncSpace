import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { AuthContext } from "../context/AuthContext";
import UserList from "../components/UserList";
import Whiteboard from "../components/whiteboard/Whiteboard";
import CodeEditor from "../components/editor/CodeEditor";
import ReplayModal from "../components/replay/ReplayModal";
import { toast } from "react-toastify";
import { FaArrowLeft, FaKey, FaHistory, FaUserShield } from "react-icons/fa";
import { MdDraw } from "react-icons/md";
import { VscCode } from "react-icons/vsc";
import { BsWifiOff, BsWifi, BsLayoutSplit } from "react-icons/bs";

export default function Room() {
    const { roomId } = useParams();
    const { user } = useContext(AuthContext);
    const [room, setRoom] = useState(null);
    const [users, setUsers] = useState([]);
    const [userRole, setUserRole] = useState("editor");
    const [isReplayOpen, setIsReplayOpen] = useState(false);
    const [viewMode, setViewMode] = useState("both"); // "both" | "whiteboard" | "editor"
    const { socket, connected, joinRoom, leaveRoom } = useSocket();

    // Trigger window resize event when viewMode changes so Monaco and Whiteboard canvas resize immediately
    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 50);
        return () => clearTimeout(timer);
    }, [viewMode]);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const response = await api.get(`/rooms/${roomId}`);
                setRoom(response.data);
                if (response.data.roles && user) {
                    const role = response.data.roles[user.id || user._id] || (response.data.owner === (user.id || user._id) ? "owner" : "editor");
                    setUserRole(role);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load room");
            }
        };
        fetchRoom();
    }, [roomId, user]);

    useEffect(() => {
        if (connected && socket) {
            joinRoom(roomId);

            socket.on("room-users", (roomUsers) => {
                setUsers(roomUsers);
            });

            // --- STEP 9: Listen for room-state socket event & restore saved MongoDB state ---
            socket.on("room-state", ({ code, whiteboard, language, files }) => {
                setRoom((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        codeContent: code !== undefined ? code : prev.codeContent,
                        whiteboardState: whiteboard !== undefined ? whiteboard : prev.whiteboardState,
                        language: language !== undefined ? language : prev.language,
                        filesState: files !== undefined ? files : prev.filesState
                    };
                });
            });

            socket.on("user-joined", ({ user: joinedUser }) => {
                setUsers(prev => {
                    if (!prev.find(u => u._id === joinedUser._id)) return [...prev, joinedUser];
                    return prev;
                });
                toast.info(`${joinedUser.name || "A user"} joined`);
            });

            socket.on("user-left", ({ user: leftUser }) => {
                setUsers(prev => prev.filter(u => u._id !== leftUser._id));
                toast.info(`${leftUser?.name || "A user"} left`);
            });
        }

        return () => {
            if (socket) {
                socket.off("room-users");
                socket.off("room-state");
                socket.off("user-joined");
                socket.off("user-left");
                leaveRoom(roomId);
            }
        };
    }, [connected, socket, roomId]);

    if (!room) return (
        <div className="flex h-screen items-center justify-center text-white bg-gray-900 font-semibold">
            Loading Room...
        </div>
    );

    const isReadOnly = userRole === "viewer";

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <header className="flex flex-wrap md:flex-nowrap justify-between items-center px-4 py-2.5 bg-gray-800 border-b border-gray-700 shadow-md gap-3">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition font-medium text-sm">
                        <FaArrowLeft /> Dashboard
                    </Link>
                    <div className="h-4 w-[1px] bg-gray-600"></div>
                    <h2 className="text-base font-bold text-blue-400 truncate max-w-[180px] sm:max-w-xs">{room.name}</h2>
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-medium capitalize flex items-center gap-1 border border-teal-500/30">
                        <FaUserShield className="text-[10px]" /> {userRole}
                    </span>
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${connected ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                        {connected ? <BsWifi /> : <BsWifiOff />}
                        {connected ? "Live" : "Offline"}
                    </div>
                </div>

                {/* View Mode Toggle (Center of Navbar) */}
                <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-700/80 shadow-inner order-last md:order-none mx-auto md:mx-0">
                    <button
                        onClick={() => setViewMode("whiteboard")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                            viewMode === "whiteboard"
                                ? "bg-blue-600 text-white shadow-md font-semibold"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                        }`}
                        title="View Whiteboard only"
                    >
                        <MdDraw className="text-sm" />
                        <span>Whiteboard</span>
                    </button>
                    <button
                        onClick={() => setViewMode("both")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                            viewMode === "both"
                                ? "bg-blue-600 text-white shadow-md font-semibold"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                        }`}
                        title="View Whiteboard and Code Editor together (Split View)"
                    >
                        <BsLayoutSplit className="text-sm" />
                        <span>Both</span>
                    </button>
                    <button
                        onClick={() => setViewMode("editor")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                            viewMode === "editor"
                                ? "bg-blue-600 text-white shadow-md font-semibold"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                        }`}
                        title="View Code Editor only"
                    >
                        <VscCode className="text-sm" />
                        <span>Code Editor</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsReplayOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-teal-400 text-xs font-semibold rounded-lg transition border border-gray-600 shadow"
                        title="Open Session Replay"
                    >
                        <FaHistory /> Replay
                    </button>
                    <UserList users={users} />
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900 border border-gray-700 px-2.5 py-1 rounded-md font-mono">
                        <FaKey className="text-yellow-500 text-[10px]" />
                        {room.inviteCode}
                    </div>
                </div>
            </header>

            {/* Main content: Whiteboard + Editor */}
            <div className={`flex-1 p-3 overflow-hidden min-h-0 ${
                viewMode === "both" 
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-3" 
                    : "flex flex-col"
            }`}>

                {/* Whiteboard Panel */}
                <section className={`bg-gray-800 border border-gray-700 rounded-xl flex-col overflow-hidden shadow-xl h-full ${
                    viewMode === "editor" ? "hidden" : "flex flex-1 min-h-0"
                }`}>
                    <div className="px-3 py-2 border-b border-gray-700 bg-gray-900 text-xs text-gray-300 font-semibold uppercase tracking-wider flex justify-between items-center rounded-t-xl shrink-0">
                        <span className="flex items-center gap-2">
                            <MdDraw className="text-blue-400 text-sm" /> Collaborative Whiteboard
                        </span>
                        <span className="text-gray-500 font-normal normal-case text-[11px]">Real-Time Sync</span>
                    </div>
                    <div className="flex-1 w-full relative min-h-0">
                        <Whiteboard
                            socket={socket}
                            roomId={roomId}
                            initialShapes={room.whiteboardState}
                            isReadOnly={isReadOnly}
                        />
                    </div>
                </section>

                {/* Code Editor Panel */}
                <section className={`bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl flex-col overflow-hidden shadow-xl h-full ${
                    viewMode === "whiteboard" ? "hidden" : "flex flex-1 min-h-0"
                }`}>
                    <div className="px-3 py-1.5 border-b border-[#2b2b2b] bg-[#252526] text-[11px] text-gray-400 font-semibold uppercase tracking-wider flex justify-between items-center rounded-t-xl select-none shrink-0">
                        <span className="flex items-center gap-2">
                            <VscCode className="text-blue-400 text-sm" /> Code Editor
                        </span>
                        <span className="text-gray-600 font-normal normal-case text-[10px] font-mono">CRDT Sync Active</span>
                    </div>
                    <div className="flex-1 w-full relative min-h-0">
                        <CodeEditor
                            socket={socket}
                            roomId={roomId}
                            initialCode={room.codeContent}
                            initialLanguage={room.language}
                            initialFiles={room.filesState}
                            isReadOnly={isReadOnly}
                        />
                    </div>
                </section>
            </div>

            {/* Replay Modal */}
            <ReplayModal
                isOpen={isReplayOpen}
                onClose={() => setIsReplayOpen(false)}
                room={room}
            />
        </div>
    );
}
