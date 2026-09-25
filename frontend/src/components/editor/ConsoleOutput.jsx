import { useEffect, useRef } from "react";
import { VscTrash, VscTerminal, VscBrowser } from "react-icons/vsc";

export default function ConsoleOutput({ logs, clearLogs, isRunning, htmlCode, activeTab, setActiveTab }) {
    const logEndRef = useRef(null);

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (activeTab === "console") {
            logEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, activeTab]);

    return (
        <div className="h-48 flex flex-col bg-[#1e1e1e] border-t border-[#2b2b2b] select-none" style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace" }}>
            {/* Panel Tab Header (mimics VS Code bottom panel) */}
            <div className="flex items-center justify-between bg-[#252526] border-b border-[#2b2b2b] px-2 h-8 flex-shrink-0">
                <div className="flex items-center gap-0">
                    <button
                        onClick={() => setActiveTab("console")}
                        className={`flex items-center gap-1.5 px-3 h-8 text-xs font-medium transition border-t-2 ${
                            activeTab === "console"
                                ? "border-t-blue-500 text-white bg-[#1e1e1e]"
                                : "border-t-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2d2d2d]"
                        }`}
                    >
                        <VscTerminal className="text-xs" />
                        TERMINAL
                        {isRunning && (
                            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-1.5 px-3 h-8 text-xs font-medium transition border-t-2 ${
                            activeTab === "preview"
                                ? "border-t-blue-500 text-white bg-[#1e1e1e]"
                                : "border-t-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2d2d2d]"
                        }`}
                    >
                        <VscBrowser className="text-xs" />
                        HTML PREVIEW
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    {activeTab === "console" && (
                        <button
                            onClick={clearLogs}
                            title="Clear Console"
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#37373d] rounded transition text-xs"
                        >
                            <VscTrash className="text-xs" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
                {activeTab === "console" ? (
                    <div className="h-full px-3 py-2 overflow-y-auto text-[12px] leading-relaxed space-y-0.5">
                        {logs.length === 0 ? (
                            <div className="text-gray-600 italic mt-1">
                                $ Run code to see output here... (F5 or Ctrl+Enter)
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-2 whitespace-pre-wrap break-all ${
                                        log.type === "error"
                                            ? "text-red-400"
                                            : log.type === "warn"
                                            ? "text-yellow-300"
                                            : log.type === "info"
                                            ? "text-blue-400"
                                            : "text-[#cccccc]"
                                    }`}
                                >
                                    <span className="text-gray-600 text-[10px] mt-0.5 flex-shrink-0 w-16">
                                        [{log.time}]
                                    </span>
                                    <span className={`${log.type === "error" ? "font-medium" : ""}`}>
                                        {log.type === "error" && <span className="text-red-500 mr-1">✗</span>}
                                        {log.type === "warn" && <span className="text-yellow-400 mr-1">⚠</span>}
                                        {log.type === "info" && <span className="text-blue-400 mr-1">ℹ</span>}
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={logEndRef} />
                    </div>
                ) : (
                    <iframe
                        title="HTML Preview"
                        srcDoc={htmlCode || "<div style='color:#6b7280;font-family:sans-serif;padding:16px;'>Run an HTML file to see the live preview here...</div>"}
                        className="w-full h-full bg-white border-0"
                        sandbox="allow-scripts"
                    />
                )}
            </div>
        </div>
    );
}
