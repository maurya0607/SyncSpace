import { VscCheck, VscSymbolKeyword, VscInfo } from "react-icons/vsc";

export default function VSCodeStatusBar({
    activeFile,
    cursorPos,
    isRunning,
    theme,
    onToggleShortcutsModal,
}) {
    return (
        <div
            className="bg-[#007acc] text-white flex items-center justify-between px-3 h-6 text-[11px] flex-shrink-0 select-none"
            style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace" }}
        >
            {/* Left */}
            <div className="flex items-center gap-4">
                <span className="font-semibold flex items-center gap-1">
                    <VscSymbolKeyword className="text-xs" />
                    {activeFile ? activeFile.name : "SyncSpace IDE"}
                </span>

                <span>
                    {activeFile?.isUnsaved ? (
                        <span className="text-yellow-200 font-bold">● Unsaved</span>
                    ) : (
                        <span className="flex items-center gap-1 text-green-200">
                            <VscCheck className="text-xs" /> Saved
                        </span>
                    )}
                </span>

                {isRunning && (
                    <span className="text-yellow-300 font-semibold animate-pulse">
                        ⚡ Running...
                    </span>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-4 opacity-90">
                <span>Ln {cursorPos?.lineNumber ?? 1}, Col {cursorPos?.column ?? 1}</span>
                <span>Spaces: 4</span>
                <span>UTF-8</span>
                <span className="uppercase font-semibold bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                    {activeFile?.language || "text"}
                </span>
                <button
                    onClick={onToggleShortcutsModal}
                    title="Keyboard Shortcuts"
                    className="flex items-center gap-1 hover:bg-white/20 px-1.5 py-0.5 rounded transition"
                >
                    <VscInfo className="text-xs" /> Shortcuts
                </button>
            </div>
        </div>
    );
}
