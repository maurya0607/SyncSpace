import {
    VscPlay,
    VscSave,
    VscSymbolKeyword,
    VscCopy,
    VscWand,
} from "react-icons/vsc";
import { FaSun, FaMoon } from "react-icons/fa";
import { toast } from "react-toastify";

export default function EditorToolbar({
    activeFile,
    handleRunCode,
    isRunning,
    handleSaveFile,
    handleFormatCode,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    currentCode,
}) {
    const handleCopyCode = () => {
        if (!currentCode) return;
        navigator.clipboard.writeText(currentCode).then(() => {
            toast.info("Code copied to clipboard!");
        });
    };

    return (
        <div
            className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#2b2b2b] gap-2 select-none"
            style={{ minHeight: "40px" }}
        >
            {/* ── Left: Action Buttons ─────────────────────────── */}
            <div className="flex items-center gap-1.5">
                {/* Run */}
                <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    title="Run Code (F5 / Ctrl+Enter)"
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
                >
                    <VscPlay className="text-xs" />
                    <span>{isRunning ? "Running..." : "▶  Run"}</span>
                </button>

                {/* Save */}
                <button
                    onClick={handleSaveFile}
                    title="Save & Download (Ctrl+S)"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#37373d] hover:bg-[#45454d] text-blue-300 hover:text-white rounded border border-[#45454d] transition text-xs font-medium"
                >
                    <VscSave className="text-xs text-blue-400" />
                    <span>Save</span>
                </button>

                {/* Format */}
                <button
                    onClick={handleFormatCode}
                    title="Format Document"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#37373d] hover:bg-[#45454d] text-purple-300 hover:text-white rounded border border-[#45454d] transition text-xs font-medium"
                >
                    <VscWand className="text-xs text-purple-400" />
                    <span>Format</span>
                </button>

                {/* Copy */}
                <button
                    onClick={handleCopyCode}
                    title="Copy Code to Clipboard"
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#2a2a2a] hover:bg-[#383838] text-gray-300 hover:text-white rounded border border-[#3c3c3c] transition text-xs"
                >
                    <VscCopy className="text-xs text-gray-400" />
                    <span>Copy</span>
                </button>
            </div>

            {/* ── Right: Theme + Font Size + Language Tag ──────── */}
            <div className="flex items-center gap-3">
                {/* Language Badge */}
                <div className="flex items-center gap-1 text-[11px] bg-[#1e1e1e] border border-[#3c3c3c] px-2 py-0.5 rounded font-mono text-gray-300">
                    <VscSymbolKeyword className="text-blue-400 text-xs" />
                    <span className="capitalize font-semibold text-blue-300">
                        {activeFile?.language || "javascript"}
                    </span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
                    title="Toggle Editor Theme"
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#2a2a2a] hover:bg-[#383838] text-gray-200 rounded border border-[#3c3c3c] transition text-xs"
                >
                    {theme === "vs-dark"
                        ? <FaSun className="text-yellow-400 text-xs" />
                        : <FaMoon className="text-blue-300 text-xs" />}
                    <span>{theme === "vs-dark" ? "Light" : "Dark"}</span>
                </button>

                {/* Font Size */}
                <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="bg-[#1e1e1e] text-gray-300 px-1.5 py-0.5 rounded border border-[#3c3c3c] focus:outline-none text-xs cursor-pointer"
                    title="Font Size"
                >
                    {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                        <option key={s} value={s}>{s}px</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
