import { useState, useEffect } from "react";
import { FaPlay, FaPause, FaHistory, FaTimes, FaUndo } from "react-icons/fa";

export default function ReplayModal({ isOpen, onClose, room }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval = null;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950">
                    <div className="flex items-center gap-2 text-teal-400 font-bold">
                        <FaHistory className="text-lg" />
                        <span>Session Replay — {room?.name}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Simulated Replay Canvas Display */}
                    <div className="h-48 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden">
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-mono text-teal-400 font-bold">
                                {Math.floor((progress / 100) * 12)}m {Math.floor(((progress / 100) * 720) % 60)}s
                            </div>
                            <div className="text-xs text-gray-500">
                                Replaying recorded whiteboard strokes & code edits... ({progress}%)
                            </div>
                        </div>

                        {/* Progress Bar Glow */}
                        <div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Timeline Controls */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                            <span>00:00 (Start)</span>
                            <span>06:00 (Mid)</span>
                            <span>12:00 (Final)</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => setProgress(Number(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button
                            onClick={() => setProgress(0)}
                            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 transition"
                            title="Reset Timeline"
                        >
                            <FaUndo />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold shadow-lg shadow-teal-500/30 transition text-lg"
                        >
                            {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
