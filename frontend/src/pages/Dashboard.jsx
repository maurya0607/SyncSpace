import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiUsers, FiKey } from "react-icons/fi";
import { MdMeetingRoom } from "react-icons/md";
import { HiArrowRight } from "react-icons/hi";
import Navbar from "../components/Navbar";

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await api.get("/rooms");
            setRooms(response.data);
        } catch (error) {
            toast.error("Failed to load rooms");
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;
        try {
            const response = await api.post("/rooms", { name: newRoomName });
            setRooms([...rooms, response.data]);
            setNewRoomName("");
            toast.success("Room created!");
            navigate(`/room/${response.data._id}`);
        } catch (error) {
            toast.error("Failed to create room");
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        try {
            const response = await api.post("/rooms/join", { inviteCode: joinCode.trim() });
            toast.success("Joined room!");
            navigate(`/room/${response.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid invite code");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors">
            <Navbar />

            <main className="max-w-6xl mx-auto w-full px-6 py-10">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, <span className="text-teal-600 dark:text-teal-400">{user?.name || "User"}</span> 👋
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Create a new room or enter an invite code to join an existing session
                    </p>
                </div>

                {/* Actions Bar: Create & Join */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {/* Create Room Box */}
                    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                            <FiPlus className="text-teal-500 text-base" /> Create New Room
                        </h3>
                        <form onSubmit={handleCreateRoom} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Room name (e.g. System Design)..."
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 text-sm transition"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm shadow-md shadow-teal-500/20 transition whitespace-nowrap"
                            >
                                Create
                            </button>
                        </form>
                    </div>

                    {/* Join Room Box */}
                    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                            <FiKey className="text-blue-500 text-base" /> Join via Invite Code
                        </h3>
                        <form onSubmit={handleJoinRoom} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter 6-character code..."
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm transition font-mono"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-md shadow-blue-500/20 transition whitespace-nowrap"
                            >
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                {/* Rooms Section Header */}
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">My Collaborative Rooms</h3>

                {/* Rooms Grid */}
                {rooms.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                        <MdMeetingRoom className="text-6xl mx-auto mb-3 opacity-40 text-teal-500" />
                        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No rooms yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first room or join with an invite code!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {rooms.map(room => (
                            <div
                                key={room._id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/10 transition group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center text-xl font-bold">
                                        <MdMeetingRoom />
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                                        {room.inviteCode}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition text-gray-900 dark:text-white">
                                    {room.name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                                    <FiUsers />
                                    <span>{room.members?.length || 1} member{room.members?.length !== 1 ? "s" : ""}</span>
                                </div>
                                <Link
                                    to={`/room/${room._id}`}
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-teal-600 dark:hover:bg-teal-600 text-gray-700 dark:text-gray-200 hover:text-white rounded-xl transition text-sm font-medium"
                                >
                                    Open Room <HiArrowRight />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
