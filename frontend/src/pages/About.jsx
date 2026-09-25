import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaUsers, FaLaptopCode, FaDraftingCompass, FaShieldAlt, FaHistory, FaBolt } from "react-icons/fa";

const features = [
    {
        icon: <FaDraftingCompass className="text-2xl" />,
        iconBg: "bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400",
        title: "Collaborative Whiteboard",
        desc: "Draw architecture diagrams, system designs, and flowcharts in real time. Every stroke is instantly synced to all members in the room using WebSocket.",
    },
    {
        icon: <FaLaptopCode className="text-2xl" />,
        iconBg: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
        title: "Monaco Code Editor",
        desc: "A full-featured code editor powered by Monaco (VS Code's engine) with syntax highlighting for JavaScript, TypeScript, Python, HTML, CSS, and more.",
    },
    {
        icon: <FaBolt className="text-2xl" />,
        iconBg: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
        title: "Yjs CRDT Technology",
        desc: "Conflict-free concurrent editing. Multiple users can type simultaneously without overwriting each other — thanks to industry-grade CRDT algorithms.",
    },
    {
        icon: <FaUsers className="text-2xl" />,
        iconBg: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
        title: "User Presence & Awareness",
        desc: "See who is online in real time. Live user indicators show all active collaborators in a room at any moment.",
    },
    {
        icon: <FaShieldAlt className="text-2xl" />,
        iconBg: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
        title: "Secure JWT Rooms",
        desc: "Rooms are protected by JWT authentication. Only invited members can join. Each room gets a unique invite code for sharing.",
    },
    {
        icon: <FaHistory className="text-2xl" />,
        iconBg: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
        title: "Session Replay",
        desc: "Every collaborative session is recorded. Replay whiteboard drawings and code changes on a visual timeline — great for reviews and learning.",
    },
];

export default function About() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors">
            <Navbar />

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3 bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-full">
                        About SyncSpace
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-2 mb-4">
                        Built for Teams That Move Fast
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        SyncSpace is a real-time collaborative workspace for engineers, designers, and technical teams. Built on a modern MERN stack with WebSocket-powered live sync.
                    </p>
                </div>

                {/* Tech Stack Banner */}
                <div className="flex flex-wrap gap-3 justify-center mb-16">
                    {["React", "Node.js", "Express", "MongoDB", "Socket.io", "Yjs", "Konva.js", "Monaco Editor", "JWT"].map((tech) => (
                        <span key={tech} className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {tech}
                        </span>
                    ))}
                </div>

                {/* Features Grid */}
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">What SyncSpace Offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {features.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-base mb-2 text-gray-900 dark:text-white">{f.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center py-12 px-6 rounded-3xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Ready to collaborate?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Create an account and start your first room for free.</p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/register"
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-semibold text-sm shadow-md transition"
                        >
                            Sign Up Free
                        </Link>
                        <Link
                            to="/login"
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-full font-semibold text-sm transition"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
