import { Link } from "react-router-dom";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center font-extrabold text-white text-sm">S</div>
                            <span className="text-base font-bold text-teal-600 dark:text-teal-400">SyncSpace</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Real-time collaborative workspace for engineering teams. Draw, code, and sync together.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Product</h4>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition">About</Link></li>
                            <li><Link to="/help" className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition">Help</Link></li>
                            <li><Link to="/register" className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition">Get Started</Link></li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Features</h4>
                        <ul className="space-y-2">
                            <li><span className="text-xs text-gray-400 dark:text-gray-500">Collaborative Whiteboard</span></li>
                            <li><span className="text-xs text-gray-400 dark:text-gray-500">Monaco Code Editor</span></li>
                            <li><span className="text-xs text-gray-400 dark:text-gray-500">Real-Time Sync</span></li>
                            <li><span className="text-xs text-gray-400 dark:text-gray-500">Session Replay</span></li>
                        </ul>
                    </div>

                    {/* Stack */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tech Stack</h4>
                        <ul className="space-y-2">
                            {["MongoDB", "Express.js", "React", "Node.js", "Socket.io"].map(t => (
                                <li key={t}><span className="text-xs text-gray-400 dark:text-gray-500">{t}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © {new Date().getFullYear()} SyncSpace. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition">
                            <FaGithub className="text-lg" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition">
                            <FaTwitter className="text-lg" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition">
                            <FaLinkedin className="text-lg" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
