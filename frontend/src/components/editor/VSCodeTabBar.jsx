import { VscClose, VscAdd } from "react-icons/vsc";
import { getFileIcon } from "./VSCodeExplorer";

export default function VSCodeTabBar({
    openFiles,
    activeFileId,
    onSelectFile,
    onCloseTab,
    onCreateFile,
    isReadOnly,
}) {
    return (
        <div
            className="flex items-end bg-[#181818] border-b border-[#252526] overflow-x-auto no-scrollbar h-9 flex-shrink-0"
            style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace" }}
        >
            {openFiles.map((file) => {
                const isActive = file.id === activeFileId;

                return (
                    <div
                        key={file.id}
                        onClick={() => onSelectFile(file.id)}
                        className={`group relative flex items-center gap-2 px-3 h-9 border-r border-[#252526] cursor-pointer flex-shrink-0 transition text-xs select-none ${
                            isActive
                                ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500 pt-0.5"
                                : "bg-[#2d2d2d] text-gray-400 hover:bg-[#252526] hover:text-gray-200 border-t-2 border-t-transparent"
                        }`}
                    >
                        {getFileIcon(file.name)}

                        <span className="truncate max-w-[120px]">{file.name}</span>

                        {/* Unsaved dot — shown only when not hovered */}
                        {file.isUnsaved && (
                            <span
                                className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0 group-hover:hidden"
                                title="Unsaved changes"
                            />
                        )}

                        {/* Close button — always shown on hover; replaces dot if unsaved */}
                        {openFiles.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(file.id);
                                }}
                                title="Close Tab"
                                className={`flex-shrink-0 p-0.5 rounded hover:bg-white/10 hover:text-white text-gray-500 transition ${
                                    file.isUnsaved
                                        ? "hidden group-hover:flex items-center"
                                        : "hidden group-hover:flex items-center"
                                }`}
                            >
                                <VscClose className="text-xs" />
                            </button>
                        )}
                    </div>
                );
            })}

            {/* New File Tab Button */}
            {!isReadOnly && (
                <button
                    onClick={() => {
                        const name = window.prompt(
                            "New file name (e.g. index.js, app.py, style.css):"
                        );
                        if (name && name.trim()) onCreateFile(name.trim());
                    }}
                    title="New File"
                    className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-white hover:bg-[#2a2d2e] transition flex-shrink-0 border-r border-[#252526]"
                >
                    <VscAdd className="text-sm" />
                </button>
            )}
        </div>
    );
}
