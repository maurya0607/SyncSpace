import {
    FaPencilAlt,
    FaSlash,
    FaRegSquare,
    FaRegCircle,
    FaEraser,
    FaTrash
} from "react-icons/fa";

const tools = [
    { id: "pen",       label: "Pen",       icon: <FaPencilAlt /> },
    { id: "line",      label: "Line",      icon: <FaSlash /> },
    { id: "rectangle", label: "Rectangle", icon: <FaRegSquare /> },
    { id: "circle",    label: "Circle",    icon: <FaRegCircle /> },
    { id: "eraser",    label: "Eraser",    icon: <FaEraser /> },
];

export default function Toolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth, handleClear }) {
    return (
        <div className="flex flex-wrap items-center justify-between p-2 bg-gray-900 border-b border-gray-700 text-xs gap-2">
            <div className="flex items-center gap-1">
                {tools.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTool(t.id)}
                        title={t.label}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition font-medium ${
                            tool === t.id
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                    >
                        <span className="text-sm">{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Color:</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Width:</label>
                    <select
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-700 focus:outline-none"
                    >
                        <option value={2}>2px</option>
                        <option value={4}>4px</option>
                        <option value={6}>6px</option>
                        <option value={10}>10px</option>
                    </select>
                </div>

                <button
                    onClick={handleClear}
                    title="Clear Canvas"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded font-medium transition"
                >
                    <FaTrash className="text-sm" />
                    <span>Clear</span>
                </button>
            </div>
        </div>
    );
}
