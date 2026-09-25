import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
    FaChevronDown, FaChevronUp, FaRocket, FaUserShield,
    FaKeyboard, FaPaintBrush, FaLink
} from "react-icons/fa";

const faqs = [
    {
        q: "What is SyncSpace?",
        a: "SyncSpace is a real-time collaborative workspace that lets multiple users draw on a shared whiteboard and write code together using a Monaco-powered editor — all in the same room, live.",
    },
    {
        q: "Do I need to log in to use SyncSpace?",
        a: "Yes. You need to create a free account to create or join rooms. This is required to protect your rooms and identify collaborators.",
    },
    {
        q: "How do I invite someone to my room?",
        a: "After creating a room, share the unique Invite Code shown on your Dashboard or inside the Room header. The other person just needs an account and the code to join.",
    },
    {
        q: "Will my code and drawings be saved?",
        a: "Yes. The document state is periodically saved to MongoDB. When you return to a room, your previous work is loaded automatically.",
    },
    {
        q: "What programming languages are supported?",
        a: "The code editor supports JavaScript, TypeScript, HTML, CSS, JSON, Python, and C++ with full syntax highlighting.",
    },
    {
        q: "What happens if two people type at the same time?",
        a: "SyncSpace uses Yjs CRDT technology to handle concurrent edits without conflict. Both changes are merged intelligently — no data is lost.",
    },
    {
        q: "Is my data secure?",
        a: "All API routes are protected by JWT tokens. Only authorized room members can access room content. We never expose passwords or tokens.",
    },
    {
        q: "Can I use SyncSpace for interviews?",
        a: "Absolutely! SyncSpace is designed for technical interviews, pair programming, and system-design sessions — draw diagrams on the whiteboard while coding live.",
    },
];

const guides = [
    { icon: <FaRocket className="text-teal-500" />, title: "Getting Started", desc: "Register a free account, then click 'Create Room' from your dashboard to start collaborating instantly." },
    { icon: <FaUserShield className="text-blue-500" />, title: "Inviting Members", desc: "Share your room's invite code (shown in the room header) with teammates. They enter it to join your session." },
    { icon: <FaPaintBrush className="text-purple-500" />, title: "Using the Whiteboard", desc: "Select a tool (Pen, Line, Rectangle, Circle, Eraser) from the toolbar, choose a color, and draw freely. All changes sync live." },
    { icon: <FaKeyboard className="text-yellow-500" />, title: "Code Editor", desc: "Choose your language from the dropdown, type code, and it syncs to all users in real time. Supports multiple languages." },
    { icon: <FaLink className="text-green-500" />, title: "Session Replay", desc: "After a session, you can replay the entire collaboration history — see every whiteboard stroke and code edit on a timeline." },
];

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 py-4">
            <button
                className="w-full flex items-center justify-between text-left gap-4 group"
                onClick={() => setOpen(!open)}
            >
                <span className="font-semibold text-gray-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition text-sm">
                    {q}
                </span>
                {open ? (
                    <FaChevronUp className="text-teal-500 shrink-0 text-xs" />
                ) : (
                    <FaChevronDown className="text-gray-400 shrink-0 text-xs" />
                )}
            </button>
            {open && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-6">
                    {a}
                </p>
            )}
        </div>
    );
}

export default function Help() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3 bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-full">
                        Help Center
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-2 mb-4">
                        How Can We Help?
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
                        Everything you need to know about using SyncSpace effectively.
                    </p>
                </div>

                {/* Quick Guides */}
                <h2 className="text-xl font-bold mb-5 text-gray-800 dark:text-white">Quick Guides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
                    {guides.map((g, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-teal-400 dark:hover:border-teal-500 transition">
                            <div className="text-xl mt-0.5 shrink-0">{g.icon}</div>
                            <div>
                                <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">{g.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{g.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ */}
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Frequently Asked Questions</h2>
                <div className="mb-14">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} q={faq.q} a={faq.a} />
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center py-10 px-6 rounded-3xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Still have questions?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">Create a free account and explore SyncSpace yourself.</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link to="/register" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-semibold text-sm shadow-md transition">
                            Get Started Free
                        </Link>
                        <Link to="/about" className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-full font-semibold text-sm transition">
                            Learn More
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
