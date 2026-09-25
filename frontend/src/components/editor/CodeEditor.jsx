import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import ConsoleOutput from "./ConsoleOutput";
import VSCodeExplorer from "./VSCodeExplorer";
import VSCodeTabBar from "./VSCodeTabBar";
import VSCodeStatusBar from "./VSCodeStatusBar";
import EditorToolbar from "./EditorToolbar";
import { YjsManager } from "../../services/yjsManager";
import api from "../../services/api";
import axios from "axios";
import { toast } from "react-toastify";

// ---------- Utility helpers ----------
let _fileIdCounter = 1;
const generateId = () => `file_${_fileIdCounter++}_${Date.now()}`;

const LANG_BY_EXT = {
    js: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript",
    py: "python",
    cpp: "cpp", cc: "cpp", cxx: "cpp",
    c: "c", h: "c",
    java: "java",
    html: "html", htm: "html",
    css: "css",
    json: "json",
    md: "markdown",
    rs: "rust",
    go: "go",
    sql: "sql",
    sh: "shell",
};

const getLanguageFromFilename = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return LANG_BY_EXT[ext] || "plaintext";
};

const RUNNABLE_LANGUAGES = {
    cpp: true,
    c: true,
    python: true,
    typescript: true,
    java: true,
    rust: true,
    go: true,
    javascript: true,
};

const DEFAULT_SNIPPETS = {
    javascript: `// Welcome to SyncSpace Collaborative IDE
// Create files via the Explorer (left) and run them with ▶ Run

function greet(name) {
  console.log(\`Hello, \${name}! Welcome to SyncSpace.\`);
}

greet("World");
`,
    typescript: `// TypeScript in SyncSpace
function multiply(a: number, b: number): number {
  return a * b;
}

console.log("Result:", multiply(6, 7));
`,
    python: `# SyncSpace Python Runner
def greet(name: str) -> None:
    print(f"Hello, {name}! Welcome to SyncSpace.")

greet("World")
`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++ in SyncSpace!" << endl;
    return 0;
}
`,
    c: `#include <stdio.h>

int main() {
    printf("Hello from C in SyncSpace!\\n");
    return 0;
}
`,
    java: `class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java in SyncSpace!");
    }
}
`,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: white; padding: 20px; }
    button { background: #0d9488; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>SyncSpace HTML Preview</h1>
  <button onclick="alert('Hello from SyncSpace!')">Click Me</button>
</body>
</html>`,
    css: `/* SyncSpace CSS Styles */
body {
  background-color: #0f172a;
  color: #38bdf8;
}
`,
    json: `{
  "name": "SyncSpace",
  "version": "1.0.0",
  "features": ["Whiteboard", "Monaco Editor", "Yjs CRDT", "Multi-Language Code Runner"]
}
`,
};

const makeFile = (name, content, language, parentId = null) => ({
    id: generateId(),
    name,
    content: content ?? (DEFAULT_SNIPPETS[language || getLanguageFromFilename(name)] || ""),
    language: language || getLanguageFromFilename(name),
    isFolder: false,
    parentId: parentId || null,
    isUnsaved: false,
});

const makeFolder = (name, parentId = null) => ({
    id: generateId(),
    name,
    isFolder: true,
    parentId: parentId || null,
});

// Build relative file path for Yjs (e.g. "src/components/Header.jsx" or "main.js")
const getFilePath = (file, allFiles) => {
    if (!file) return "";
    let path = file.name;
    let curr = file;
    while (curr && curr.parentId) {
        const parent = allFiles.find((f) => f.id === curr.parentId);
        if (parent) {
            path = `${parent.name}/${path}`;
            curr = parent;
        } else {
            break;
        }
    }
    return path;
};

// Recursively find all child/descendant IDs of a folder
const getDescendantIds = (items, targetId) => {
    const ids = [targetId];
    const children = items.filter((item) => item.parentId === targetId);
    for (const child of children) {
        ids.push(...getDescendantIds(items, child.id));
    }
    return ids;
};

// ---------- Main Component ----------
export default function CodeEditor({ socket, roomId, initialCode, initialLanguage, initialFiles, isReadOnly }) {
    // ---------- Files State ----------
    const [files, setFiles] = useState(() => {
        if (initialFiles && Array.isArray(initialFiles) && initialFiles.length > 0) {
            return initialFiles;
        }
        const initialLang = initialLanguage || "javascript";
        const f = makeFile(
            initialLang === "javascript" ? "main.js"
                : initialLang === "python" ? "main.py"
                    : initialLang === "cpp" ? "main.cpp"
                        : initialLang === "c" ? "main.c"
                            : initialLang === "java" ? "Main.java"
                                : initialLang === "typescript" ? "main.ts"
                                    : initialLang === "html" ? "index.html"
                                        : "main.js",
            initialCode,
            initialLang
        );
        f.isUnsaved = false;
        return [f];
    });
    const [openFileIds, setOpenFileIds] = useState(() => []);
    const [activeFileId, setActiveFileId] = useState(null);

    // Filter file items (excluding folders) for tabs & editor
    const fileItems = files.filter((f) => !f.isFolder);
    const activeFile = fileItems.find((f) => f.id === activeFileId) || fileItems[0] || null;
    const openFiles = fileItems.filter((f) => openFileIds.includes(f.id));

    // Init open tabs
    useEffect(() => {
        const initialValidFiles = files.filter((f) => !f.isFolder);
        if (initialValidFiles.length > 0) {
            setOpenFileIds((prev) => (prev.length === 0 ? [initialValidFiles[0].id] : prev));
            setActiveFileId((prev) => prev ?? initialValidFiles[0].id);
        }
    }, []); // eslint-disable-line

    // ---------- Editor State ----------
    const [theme, setTheme] = useState("vs-dark");
    const [fontSize, setFontSize] = useState(14);
    const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
    const [showShortcuts, setShowShortcuts] = useState(false);

    // ---------- Console / Output State ----------
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [activeOutputTab, setActiveOutputTab] = useState("console");
    const [htmlCode, setHtmlCode] = useState("");

    const editorRef = useRef(null);
    const yjsManagerRef = useRef(null);
    const monacoRef = useRef(null);
    const saveDebounceRef = useRef(null); // debounce timer for MongoDB saves
    const hasAppliedInitialCode = useRef(false); // guard: apply initialCode only once

    // ---------- Apply initial code/lang/files ONCE — when room data first loads ----------
    useEffect(() => {
        if (hasAppliedInitialCode.current) return; // already applied — never reset again
        if ((!initialFiles || initialFiles.length === 0) && initialCode === undefined && !initialLanguage) return;
        if (!activeFile) return;

        if (initialFiles && Array.isArray(initialFiles) && initialFiles.length > 0) {
            setFiles(initialFiles);
            const firstFile = initialFiles.find((f) => !f.isFolder) || initialFiles[0];
            if (firstFile) {
                setOpenFileIds((prev) => (prev.length === 0 ? [firstFile.id] : prev));
                setActiveFileId((prev) => prev ?? firstFile.id);
            }
            hasAppliedInitialCode.current = true;
            return;
        }

        if (initialCode !== undefined) {
            setFiles((prev) =>
                prev.map((f) => (f.id === activeFile.id ? { ...f, content: initialCode, isUnsaved: false } : f))
            );
        }
        if (initialLanguage) {
            setFiles((prev) =>
                prev.map((f) => (f.id === activeFile.id ? { ...f, language: initialLanguage } : f))
            );
        }
        hasAppliedInitialCode.current = true; // lock — never apply again
    }, [initialFiles, initialCode, initialLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

    // ---------- Editor Mount ----------
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        editor.onDidChangeCursorPosition((e) => {
            setCursorPos({ lineNumber: e.position.lineNumber, column: e.position.column });
        });

        if (socket && roomId && activeFile) {
            // Destroy previous YjsManager before creating a new one (file switch cleanup)
            yjsManagerRef.current?.destroy();

            // Use relative file path as the Yjs channel key — stable across all clients
            const filePath = getFilePath(activeFile, files) || activeFile.name;
            yjsManagerRef.current = new YjsManager(socket, roomId, filePath);
            yjsManagerRef.current.bindMonaco(editor);
        }

        // Ctrl+S shortcut → Save
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSaveCurrentFile();
        });

        // F5 / Ctrl+Enter → Run
        editor.addCommand(monaco.KeyCode.F5, () => {
            handleRunCode();
        });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            handleRunCode();
        });
    };

    // Cleanup Yjs and debounce timer on unmount
    useEffect(() => () => {
        yjsManagerRef.current?.destroy();
        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    }, []);

    // ---------- Socket Listeners ----------
    useEffect(() => {
        if (!socket) return;
        socket.on("files-update", (newFiles) => {
            if (newFiles && Array.isArray(newFiles)) {
                setFiles(newFiles);
                const validFileIds = newFiles.filter((f) => !f.isFolder).map((f) => f.id);
                setOpenFileIds((prev) => {
                    const filtered = prev.filter((id) => validFileIds.includes(id));
                    if (filtered.length === 0 && validFileIds.length > 0) {
                        return [validFileIds[0]];
                    }
                    return filtered;
                });
                setActiveFileId((prev) => {
                    if (prev && validFileIds.includes(prev)) return prev;
                    return validFileIds[0] || null;
                });
            }
        });
        socket.on("code-update", (newCode) => {
            if (newCode !== undefined) {
                setFiles((prev) =>
                    prev.map((f) => (f.id === activeFileId ? { ...f, content: newCode, isUnsaved: false } : f))
                );
            }
        });
        socket.on("language-update", (newLang) => {
            if (newLang !== undefined) {
                setFiles((prev) =>
                    prev.map((f) => (f.id === activeFileId ? { ...f, language: newLang } : f))
                );
            }
        });
        return () => {
            socket.off("files-update");
            socket.off("code-update");
            socket.off("language-update");
        };
    }, [socket, activeFileId]);

    // ---------- File & Folder CRUD Operations ----------
    const handleCreateFile = useCallback((name, parentId = null) => {
        const parts = name.split("/").filter(Boolean);
        if (parts.length > 1) {
            // Nested path like "components/Navbar.jsx"
            setFiles((prev) => {
                let currentParentId = parentId;
                const updated = [...prev];
                for (let i = 0; i < parts.length - 1; i++) {
                    const folderName = parts[i];
                    let existingFolder = updated.find(
                        (item) => item.isFolder && item.name === folderName && (item.parentId || null) === (currentParentId || null)
                    );
                    if (!existingFolder) {
                        existingFolder = makeFolder(folderName, currentParentId);
                        updated.push(existingFolder);
                    }
                    currentParentId = existingFolder.id;
                }
                const fileName = parts[parts.length - 1];
                const newFile = makeFile(fileName, null, null, currentParentId);
                updated.push(newFile);
                if (socket && roomId) {
                    socket.emit("files-change", { roomId, files: updated });
                }
                setOpenFileIds((prevOpen) => [...prevOpen, newFile.id]);
                setActiveFileId(newFile.id);
                return updated;
            });
            toast.success(`File "${parts[parts.length - 1]}" created!`);
            return;
        }

        const newFile = makeFile(name, null, null, parentId);
        setFiles((prev) => {
            const updated = [...prev, newFile];
            if (socket && roomId) {
                socket.emit("files-change", { roomId, files: updated });
            }
            return updated;
        });
        setOpenFileIds((prev) => [...prev, newFile.id]);
        setActiveFileId(newFile.id);
        toast.success(`File "${name}" created!`);
    }, [socket, roomId]);

    const handleCreateFolder = useCallback((name, parentId = null) => {
        const parts = name.split("/").filter(Boolean);
        setFiles((prev) => {
            let currentParentId = parentId;
            const updated = [...prev];
            for (const folderName of parts) {
                let existingFolder = updated.find(
                    (item) => item.isFolder && item.name === folderName && (item.parentId || null) === (currentParentId || null)
                );
                if (!existingFolder) {
                    existingFolder = makeFolder(folderName, currentParentId);
                    updated.push(existingFolder);
                }
                currentParentId = existingFolder.id;
            }
            if (socket && roomId) {
                socket.emit("files-change", { roomId, files: updated });
            }
            return updated;
        });
        toast.success(`Folder "${name}" created!`);
    }, [socket, roomId]);

    const handleDeleteItem = useCallback((id) => {
        setFiles((prev) => {
            const toDeleteIds = new Set(getDescendantIds(prev, id));
            let remaining = prev.filter((item) => !toDeleteIds.has(item.id));
            const remainingFiles = remaining.filter((item) => !item.isFolder);
            if (remainingFiles.length === 0) {
                const defaultFile = makeFile("main.js", "// Welcome to SyncSpace Collaborative IDE\n");
                remaining = [...remaining, defaultFile];
            }
            if (socket && roomId) {
                socket.emit("files-change", { roomId, files: remaining });
            }
            return remaining;
        });
        setOpenFileIds((prev) => {
            const toDeleteIds = new Set(getDescendantIds(files, id));
            const updated = prev.filter((fid) => !toDeleteIds.has(fid));
            if (toDeleteIds.has(activeFileId)) {
                const fallback = files.find((f) => !f.isFolder && !toDeleteIds.has(f.id));
                setActiveFileId(fallback?.id || null);
            }
            return updated;
        });
    }, [activeFileId, files, socket, roomId]);

    const handleRenameItem = useCallback((id, newName) => {
        setFiles((prev) => {
            const updated = prev.map((f) =>
                f.id === id
                    ? { ...f, name: newName, ...(f.isFolder ? {} : { language: getLanguageFromFilename(newName) }) }
                    : f
            );
            if (socket && roomId) {
                socket.emit("files-change", { roomId, files: updated });
            }
            return updated;
        });
        toast.info(`Renamed to "${newName}"`);
    }, [socket, roomId]);

    const handleSelectFile = useCallback((id) => {
        setOpenFileIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setActiveFileId(id);
    }, []);

    const handleCloseTab = useCallback((id) => {
        setOpenFileIds((prev) => {
            const updated = prev.filter((fid) => fid !== id);
            if (activeFileId === id && updated.length > 0) {
                setActiveFileId(updated[updated.length - 1]);
            }
            return updated;
        });
    }, [activeFileId]);

    // ---------- Code Change ----------
    const handleEditorChange = (value) => {
        const updated = value ?? "";

        // Skip emitting if Yjs is currently applying a remote update.
        // Doing so would send stale/partial content to MongoDB and other peers.
        const isYjsUpdate = yjsManagerRef.current?.isUpdatingFromYjs === true;

        setFiles((prev) => {
            const updatedFiles = prev.map((f) =>
                f.id === activeFileId ? { ...f, content: updated, isUnsaved: !isYjsUpdate } : f
            );
            if (socket && !isYjsUpdate && roomId) {
                if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
                saveDebounceRef.current = setTimeout(() => {
                    socket.emit("code-change", { roomId, code: updated });
                    socket.emit("files-change", { roomId, files: updatedFiles });
                }, 500);
            }
            return updatedFiles;
        });
    };

    // ---------- Save File ----------
    const handleSaveCurrentFile = useCallback(() => {
        if (!activeFile) return;
        const content = editorRef.current ? editorRef.current.getValue() : activeFile.content;
        // Mark as saved
        setFiles((prev) =>
            prev.map((f) => (f.id === activeFile.id ? { ...f, content, isUnsaved: false } : f))
        );
        // Emit to socket
        if (socket && roomId) {
            socket.emit("code-change", { roomId, code: content });
            socket.emit("files-change", {
                roomId,
                files: files.map((f) => (f.id === activeFile.id ? { ...f, content, isUnsaved: false } : f))
            });
        }
        // Download file
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = activeFile.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`"${activeFile.name}" saved & downloaded!`);
    }, [activeFile, socket, roomId]);

    const handleSaveFileLocally = useCallback((file) => {
        const content = file.id === activeFile?.id && editorRef.current
            ? editorRef.current.getValue()
            : file.content;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, isUnsaved: false } : f))
        );
        toast.success(`"${file.name}" downloaded!`);
    }, [activeFile]);

    // ---------- Format Code ----------
    const handleFormatCode = () => {
        if (editorRef.current) {
            editorRef.current.getAction("editor.action.formatDocument")?.run();
            toast.info("Code formatted!");
        }
    };

    // ---------- Run Code ----------
    const handleRunCode = async () => {
        if (!activeFile) return;
        setIsRunning(true);
        const currentCode = editorRef.current ? editorRef.current.getValue() : activeFile.content;
        const lang = activeFile.language;
        const time = new Date().toLocaleTimeString();

        if (lang === "html") {
            setHtmlCode(currentCode);
            setActiveOutputTab("preview");
            setIsRunning(false);
            return;
        }

        setActiveOutputTab("console");

        if (lang === "javascript") {
            setLogs((prev) => [
                ...prev,
                { time, type: "info", message: `[▶ Executing ${activeFile.name} via In-Browser JS Engine...]` },
            ]);
            const runLogs = [];
            const customConsole = {
                log: (...args) => runLogs.push({ time: new Date().toLocaleTimeString(), type: "log", message: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ") }),
                error: (...args) => runLogs.push({ time: new Date().toLocaleTimeString(), type: "error", message: args.map((a) => String(a)).join(" ") }),
                warn: (...args) => runLogs.push({ time: new Date().toLocaleTimeString(), type: "warn", message: args.map((a) => String(a)).join(" ") }),
                info: (...args) => runLogs.push({ time: new Date().toLocaleTimeString(), type: "info", message: args.map((a) => String(a)).join(" ") }),
            };
            try {
                const runFn = new Function("console", currentCode);
                const result = runFn(customConsole);
                if (result !== undefined) {
                    runLogs.push({ time: new Date().toLocaleTimeString(), type: "log", message: `Result => ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}` });
                }
                setLogs((prev) => [...prev, ...runLogs]);
            } catch (err) {
                setLogs((prev) => [
                    ...prev,
                    { time: new Date().toLocaleTimeString(), type: "error", message: `Execution Error: ${err.message}` },
                ]);
            } finally {
                setIsRunning(false);
            }
            return;
        }

        // Non-JS: Execute via Backend Multi-Engine Runner
        if (!RUNNABLE_LANGUAGES[lang]) {
            setLogs((prev) => [...prev, { time, type: "warn", message: `No execution engine configured for "${lang}".` }]);
            setIsRunning(false);
            return;
        }

        setLogs((prev) => [
            ...prev,
            { time, type: "info", message: `[▶ Compiling & Executing ${activeFile.name} (${lang})...]` },
        ]);

        try {
            const response = await api.post("/execute", {
                language: lang,
                code: currentCode,
                fileName: activeFile.name,
            });

            const { output, stderr, compileError, exitCode, engine } = response.data;
            const resultLogs = [];

            if (compileError) {
                resultLogs.push({
                    time: new Date().toLocaleTimeString(),
                    type: "error",
                    message: `[Compiler Error]\n${compileError.trim()}`,
                });
            }

            if (output) {
                resultLogs.push({
                    time: new Date().toLocaleTimeString(),
                    type: "log",
                    message: output.trim(),
                });
            }

            if (stderr) {
                resultLogs.push({
                    time: new Date().toLocaleTimeString(),
                    type: "error",
                    message: stderr.trim(),
                });
            }

            if (!compileError && !output && !stderr) {
                resultLogs.push({
                    time: new Date().toLocaleTimeString(),
                    type: "info",
                    message: `Program executed with exit code ${exitCode}`,
                });
            }

            setLogs((prev) => [...prev, ...resultLogs]);
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            setLogs((prev) => [
                ...prev,
                { time: new Date().toLocaleTimeString(), type: "error", message: `Execution Error: ${errMsg}` },
            ]);
        } finally {
            setIsRunning(false);
        }
    };

    const clearLogs = () => setLogs([]);

    // ---------- Render ----------
    return (
        <div className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden" style={{ fontFamily: "'Consolas', 'Cascadia Code', 'Fira Code', monospace" }}>
            {/* Toolbar */}
            <EditorToolbar
                activeFile={activeFile}
                handleRunCode={handleRunCode}
                isRunning={isRunning}
                handleSaveFile={handleSaveCurrentFile}
                handleFormatCode={handleFormatCode}
                theme={theme}
                setTheme={setTheme}
                fontSize={fontSize}
                setFontSize={setFontSize}
                currentCode={activeFile?.content || ""}
            />

            {/* Main body: Explorer + Tab bar + Editor */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* File Explorer */}
                <VSCodeExplorer
                    files={files}
                    activeFileId={activeFileId}
                    onSelectFile={handleSelectFile}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFile={handleDeleteItem}
                    onDeleteItem={handleDeleteItem}
                    onRenameFile={handleRenameItem}
                    onRenameItem={handleRenameItem}
                    onSaveFileLocally={handleSaveFileLocally}
                    isReadOnly={isReadOnly}
                />

                {/* Editor Column */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Tab Bar */}
                    <VSCodeTabBar
                        openFiles={openFiles}
                        activeFileId={activeFileId}
                        onSelectFile={handleSelectFile}
                        onCloseTab={handleCloseTab}
                        onCreateFile={handleCreateFile}
                        isReadOnly={isReadOnly}
                    />

                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0 relative">
                        {activeFile ? (
                            <Editor
                                key={activeFile.id}
                                height="100%"
                                language={activeFile.language}
                                theme={theme}
                                value={activeFile.content}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                options={{
                                    fontSize,
                                    readOnly: isReadOnly,
                                    minimap: { enabled: true },
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12, bottom: 8 },
                                    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                                    fontLigatures: true,
                                    cursorBlinking: "smooth",
                                    cursorSmoothCaretAnimation: "on",
                                    renderLineHighlight: "all",
                                    lineNumbers: "on",
                                    glyphMargin: true,
                                    folding: true,
                                    tabSize: 4,
                                    wordWrap: "off",
                                    bracketPairColorization: { enabled: true },
                                    smoothScrolling: true,
                                    formatOnPaste: true,
                                    formatOnType: true,
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                <span>No file open. Create a file in the Explorer →</span>
                            </div>
                        )}
                    </div>

                    {/* Console / Preview Output */}
                    <ConsoleOutput
                        logs={logs}
                        clearLogs={clearLogs}
                        isRunning={isRunning}
                        htmlCode={htmlCode}
                        activeTab={activeOutputTab}
                        setActiveTab={setActiveOutputTab}
                    />
                </div>
            </div>

            {/* Status Bar */}
            <VSCodeStatusBar
                activeFile={activeFile}
                cursorPos={cursorPos}
                isRunning={isRunning}
                theme={theme}
                onToggleShortcutsModal={() => setShowShortcuts((v) => !v)}
            />

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => setShowShortcuts(false)}
                >
                    <div
                        className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl p-6 w-80 text-gray-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-white mb-4">⌨️ Keyboard Shortcuts</h3>
                        <div className="space-y-2 font-mono">
                            {[
                                ["Ctrl+S", "Save & Download file"],
                                ["F5 / Ctrl+Enter", "Run code"],
                                ["Ctrl+Shift+P", "Command Palette"],
                                ["Ctrl+Z", "Undo"],
                                ["Ctrl+Shift+Z", "Redo"],
                                ["Alt+Shift+F", "Format Document"],
                                ["Ctrl+/", "Toggle Comment"],
                                ["Ctrl+D", "Select next occurrence"],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center py-1 border-b border-[#3c3c3c]">
                                    <span className="text-blue-400 font-semibold">{k}</span>
                                    <span className="text-gray-400">{v}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="mt-4 w-full py-1.5 bg-[#37373d] hover:bg-[#45454d] rounded text-sm text-gray-300 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
