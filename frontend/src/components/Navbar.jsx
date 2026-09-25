import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { HiSun, HiMoon } from "react-icons/hi";
import { FiLogOut, FiGrid } from "react-icons/fi";

export default function Navbar() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
            <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-teal-400/30 group-hover:scale-105 transition">
                        S
                    </div>
                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight">
                        SyncSpace
                    </span>
                </Link>

                {/* Center Links */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        to="/about"
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
                    >
                        About
                    </Link>
                    <Link
                        to="/help"
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
                    >
                        Help
                    </Link>
                    {token && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
                        >
                            <FiGrid className="text-xs" /> Dashboard
                        </Link>
                    )}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">

                    {/* Dark / Light Toggle */}
                    <button
                        onClick={toggleTheme}
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-teal-500 hover:text-teal-500 transition"
                    >
                        {theme === "dark" ? (
                            <HiSun className="text-lg text-yellow-400" />
                        ) : (
                            <HiMoon className="text-lg text-blue-500" />
                        )}
                    </button>

                    {token ? (
                        <>
                            <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400 font-medium">
                                {user?.name || "User"}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
                            >
                                <FiLogOut /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 rounded-full text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/30 transition"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
