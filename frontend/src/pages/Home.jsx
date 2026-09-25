import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaChevronRight, FaDrawPolygon, FaCode, FaLock } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
    const { token } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors">
            <Navbar />

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-8 relative py-20">
                    {/* Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/10 dark:bg-teal-600/20 blur-3xl rounded-full pointer-events-none"></div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight relative leading-tight text-gray-900 dark:text-white">
                        Real-Time Collaborative
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">
                            Workspace
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto relative">
                        A powerful platform for distributed engineering teams. Draw diagrams, write code together, and resolve conflicts automatically using CRDT technology.
                    </p>

                    <div className="pt-4 relative flex flex-col sm:flex-row items-center justify-center gap-4">
                        {token ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-base shadow-xl shadow-teal-500/20 transition"
                            >
                                Open Dashboard <FaChevronRight className="text-xs" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-base shadow-xl shadow-teal-500/20 transition"
                                >
                                    Get Started Free <FaChevronRight className="text-xs" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-full font-bold text-base transition"
                                >
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pb-24 px-4">
                    {[
                        {
                            icon: <FaDrawPolygon className="text-xl" />,
                            iconBg: "bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400",
                            title: "Real-Time Whiteboard",
                            desc: "Design systems visually using a fast, synchronized Konva.js canvas with pen, shapes and more.",
                        },
                        {
                            icon: <FaCode className="text-xl" />,
                            iconBg: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
                            title: "Multi-User Code Editor",
                            desc: "Write code simultaneously with Monaco Editor and Yjs CRDTs — no conflicts, no overwrites.",
                        },
                        {
                            icon: <FaLock className="text-xl" />,
                            iconBg: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
                            title: "Secure Rooms",
                            desc: "JWT-protected rooms ensure only authorized members can join and collaborate.",
                        },
                    ].map((f, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-2xl text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition"
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{f.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
