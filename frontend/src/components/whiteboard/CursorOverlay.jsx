import { FaMousePointer } from "react-icons/fa";

export default function CursorOverlay({ remoteCursors }) {
    if (!remoteCursors || Object.keys(remoteCursors).length === 0) return null;

    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

    return (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {Object.entries(remoteCursors).map(([socketId, cursorData], index) => {
                if (!cursorData || !cursorData.position) return null;
                const { x, y } = cursorData.position;
                const userName = cursorData.user?.name || "User";
                const color = colors[index % colors.length];

                return (
                    <div
                        key={socketId}
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            transition: "all 0.05s linear",
                        }}
                        className="absolute flex items-center gap-1 transform -translate-x-1 -translate-y-1"
                    >
                        <FaMousePointer style={{ color }} className="text-sm drop-shadow-md" />
                        <span
                            style={{ backgroundColor: color }}
                            className="text-[10px] text-white font-semibold px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap opacity-90"
                        >
                            {userName}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
