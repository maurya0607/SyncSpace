import { useState, useMemo } from "react";
import {
    VscFiles,
    VscFile,
    VscNewFile,
    VscNewFolder,
    VscFolder,
    VscFolderOpened,
    VscCollapseAll,
    VscTrash,
    VscEdit,
    VscDownload,
    VscJson,
    VscChevronDown,
    VscChevronRight,
    VscSearch,
    VscCheck,
    VscClose,
} from "react-icons/vsc";
import { FaJs, FaPython, FaHtml5, FaCss3Alt, FaJava } from "react-icons/fa";
import { SiTypescript, SiCplusplus } from "react-icons/si";

export const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
        case "js":
        case "jsx":
            return <FaJs className="text-yellow-400 text-sm flex-shrink-0" />;
        case "ts":
        case "tsx":
            return <SiTypescript className="text-blue-400 text-sm flex-shrink-0" />;
        case "py":
            return <FaPython className="text-sky-400 text-sm flex-shrink-0" />;
        case "html":
        case "htm":
            return <FaHtml5 className="text-orange-500 text-sm flex-shrink-0" />;
        case "css":
            return <FaCss3Alt className="text-blue-500 text-sm flex-shrink-0" />;
        case "cpp":
        case "cc":
        case "cxx":
        case "c":
        case "h":
            return <SiCplusplus className="text-cyan-400 text-sm flex-shrink-0" />;
        case "java":
            return <FaJava className="text-red-400 text-sm flex-shrink-0" />;
        case "json":
            return <VscJson className="text-emerald-400 text-sm flex-shrink-0" />;
        case "md":
            return <VscFile className="text-gray-300 text-sm flex-shrink-0" />;
        default:
            return <VscFile className="text-gray-400 text-sm flex-shrink-0" />;
    }
};

export default function VSCodeExplorer({
    files,
    activeFileId,
    onSelectFile,
    onCreateFile,
    onCreateFolder,
    onDeleteFile,
    onDeleteItem,
    onRenameFile,
    onRenameItem,
    onSaveFileLocally,
    isReadOnly,
}) {
    const deleteItem = onDeleteItem || onDeleteFile;
    const renameItem = onRenameItem || onRenameFile;

    // creatingState: null | { type: 'file' | 'folder', parentId: string | null }
    const [creatingState, setCreatingState] = useState(null);
    const [newItemName, setNewItemName] = useState("");
    const [editingItemId, setEditingItemId] = useState(null);
    const [editItemName, setEditItemName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [collapsedFolders, setCollapsedFolders] = useState(new Set());

    // Map of all IDs to safely normalize parentIds
    const itemIds = useMemo(() => new Set(files.map((f) => f.id)), [files]);

    const normalizedItems = useMemo(() => {
        return files.map((item) => ({
            ...item,
            parentId: item.parentId && itemIds.has(item.parentId) ? item.parentId : null,
        }));
    }, [files, itemIds]);

    // Handle search filter and resolve matching items + ancestor folders
    const matchingItemIds = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return null;

        const matching = new Set();
        for (const item of normalizedItems) {
            if (item.name.toLowerCase().includes(query)) {
                matching.add(item.id);
                let currParent = item.parentId;
                while (currParent) {
                    matching.add(currParent);
                    const parentItem = normalizedItems.find((i) => i.id === currParent);
                    currParent = parentItem ? parentItem.parentId : null;
                }
            }
        }
        return matching;
    }, [searchQuery, normalizedItems]);

    const handleCreateSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const name = newItemName.trim();
        if (!name || !creatingState) {
            setCreatingState(null);
            setNewItemName("");
            return;
        }

        if (creatingState.type === "folder") {
            if (onCreateFolder) {
                onCreateFolder(name, creatingState.parentId);
            } else {
                onCreateFile(name, creatingState.parentId);
            }
        } else {
            onCreateFile(name, creatingState.parentId);
        }

        setNewItemName("");
        setCreatingState(null);
    };

    const handleRenameSubmit = (itemId, e) => {
        if (e && e.preventDefault) e.preventDefault();
        const name = editItemName.trim();
        if (!name) {
            setEditingItemId(null);
            setEditItemName("");
            return;
        }
        if (renameItem) {
            renameItem(itemId, name);
        }
        setEditingItemId(null);
        setEditItemName("");
    };

    const startEditing = (item, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setEditingItemId(item.id);
        setEditItemName(item.name);
    };

    const toggleFolder = (folderId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setCollapsedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const handleCollapseAll = () => {
        const allFolderIds = files.filter((f) => f.isFolder).map((f) => f.id);
        setCollapsedFolders(new Set(allFolderIds));
    };

    // Recursive Tree Renderer
    const renderTree = (parentId = null, depth = 0) => {
        const children = normalizedItems
            .filter((item) => item.parentId === parentId)
            .filter((item) => (matchingItemIds ? matchingItemIds.has(item.id) : true))
            .sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.name.localeCompare(b.name);
            });

        return (
            <div className="flex flex-col">
                {/* Inline Creation Input under this parent */}
                {creatingState && creatingState.parentId === parentId && (
                    <form
                        onSubmit={handleCreateSubmit}
                        className="flex items-center gap-1.5 pr-2 py-1 bg-[#252526] border-l-2 border-blue-500"
                        style={{ paddingLeft: `${depth * 14 + 16}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {creatingState.type === "folder" ? (
                            <VscFolder className="text-amber-400 text-xs flex-shrink-0" />
                        ) : (
                            getFileIcon(newItemName || "file.js")
                        )}
                        <input
                            type="text"
                            autoFocus
                            placeholder={creatingState.type === "folder" ? "folder_name" : "filename.js"}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setCreatingState(null);
                                    setNewItemName("");
                                }
                            }}
                            onBlur={() => {
                                if (!newItemName.trim()) {
                                    setCreatingState(null);
                                    setNewItemName("");
                                } else {
                                    handleCreateSubmit();
                                }
                            }}
                            className="bg-[#1e1e1e] border border-blue-500 text-white px-1.5 py-0.5 rounded text-xs w-full focus:outline-none"
                        />
                    </form>
                )}

                {children.map((item) => {
                    if (item.isFolder) {
                        const isOpen = matchingItemIds ? true : !collapsedFolders.has(item.id);
                        const isEditing = editingItemId === item.id;
                        const isSelected = selectedFolderId === item.id;

                        return (
                            <div key={item.id}>
                                <div
                                    className={`group flex items-center justify-between pr-2 py-1 cursor-pointer transition select-none ${
                                        isSelected
                                            ? "bg-[#2a2d2e] text-white"
                                            : "hover:bg-[#202020] text-gray-300 hover:text-white"
                                    }`}
                                    style={{ paddingLeft: `${depth * 14 + 8}px` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFolderId(isSelected ? null : item.id);
                                        toggleFolder(item.id, e);
                                    }}
                                >
                                    {isEditing ? (
                                        <form
                                            onSubmit={(e) => handleRenameSubmit(item.id, e)}
                                            className="flex items-center gap-1 w-full"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <VscFolder className="text-amber-400 text-xs flex-shrink-0" />
                                            <input
                                                autoFocus
                                                value={editItemName}
                                                onChange={(e) => setEditItemName(e.target.value)}
                                                onBlur={(e) => handleRenameSubmit(item.id, e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") setEditingItemId(null);
                                                }}
                                                className="bg-[#1e1e1e] border border-blue-500 text-white px-1 py-0.5 rounded text-xs w-full focus:outline-none"
                                            />
                                            <button type="submit" className="text-green-400 hover:text-green-300 flex-shrink-0">
                                                <VscCheck className="text-xs" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingItemId(null)}
                                                className="text-red-400 hover:text-red-300 flex-shrink-0"
                                            >
                                                <VscClose className="text-xs" />
                                            </button>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-1.5 overflow-hidden truncate min-w-0">
                                                <span className="text-gray-500 hover:text-gray-300 flex-shrink-0">
                                                    {isOpen ? (
                                                        <VscChevronDown className="text-xs" />
                                                    ) : (
                                                        <VscChevronRight className="text-xs" />
                                                    )}
                                                </span>
                                                {isOpen ? (
                                                    <VscFolderOpened className="text-amber-400 text-sm flex-shrink-0" />
                                                ) : (
                                                    <VscFolder className="text-amber-400 text-sm flex-shrink-0" />
                                                )}
                                                <span className="truncate text-[12px] font-medium">{item.name}</span>
                                            </div>

                                            {/* Folder Actions on Hover */}
                                            {!isReadOnly && (
                                                <div className="hidden group-hover:flex items-center gap-1 text-gray-400 flex-shrink-0 ml-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCreatingState({ type: "file", parentId: item.id });
                                                            setCollapsedFolders((prev) => {
                                                                const next = new Set(prev);
                                                                next.delete(item.id);
                                                                return next;
                                                            });
                                                        }}
                                                        title="New File inside folder"
                                                        className="hover:text-blue-400 transition p-0.5"
                                                    >
                                                        <VscNewFile className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCreatingState({ type: "folder", parentId: item.id });
                                                            setCollapsedFolders((prev) => {
                                                                const next = new Set(prev);
                                                                next.delete(item.id);
                                                                return next;
                                                            });
                                                        }}
                                                        title="New Folder inside folder"
                                                        className="hover:text-amber-400 transition p-0.5"
                                                    >
                                                        <VscNewFolder className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => startEditing(item, e)}
                                                        title="Rename folder"
                                                        className="hover:text-yellow-400 transition p-0.5"
                                                    >
                                                        <VscEdit className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`Delete folder "${item.name}" and all its contents?`)) {
                                                                deleteItem(item.id);
                                                            }
                                                        }}
                                                        title="Delete folder"
                                                        className="hover:text-red-400 transition p-0.5"
                                                    >
                                                        <VscTrash className="text-xs" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Render nested items */}
                                {isOpen && renderTree(item.id, depth + 1)}
                            </div>
                        );
                    } else {
                        // File item
                        const isActive = item.id === activeFileId;
                        const isEditing = editingItemId === item.id;

                        return (
                            <div
                                key={item.id}
                                onClick={() => !isEditing && onSelectFile(item.id)}
                                className={`group flex items-center justify-between pr-2 py-1 cursor-pointer transition select-none ${
                                    isActive
                                        ? "bg-[#37373d] text-white border-l-2 border-blue-500"
                                        : "hover:bg-[#2a2d2e] text-gray-300 hover:text-white border-l-2 border-transparent"
                                }`}
                                style={{ paddingLeft: `${depth * 14 + 18}px` }}
                            >
                                {isEditing ? (
                                    <form
                                        onSubmit={(e) => handleRenameSubmit(item.id, e)}
                                        className="flex items-center gap-1 w-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {getFileIcon(editItemName || item.name)}
                                        <input
                                            autoFocus
                                            value={editItemName}
                                            onChange={(e) => setEditItemName(e.target.value)}
                                            onBlur={(e) => handleRenameSubmit(item.id, e)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") setEditingItemId(null);
                                            }}
                                            className="bg-[#1e1e1e] border border-blue-500 text-white px-1 py-0.5 rounded text-xs w-full focus:outline-none"
                                        />
                                        <button type="submit" className="text-green-400 hover:text-green-300 flex-shrink-0">
                                            <VscCheck className="text-xs" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingItemId(null)}
                                            className="text-red-400 hover:text-red-300 flex-shrink-0"
                                        >
                                            <VscClose className="text-xs" />
                                        </button>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1.5 overflow-hidden truncate min-w-0">
                                            {getFileIcon(item.name)}
                                            <span className="truncate text-[12px]">{item.name}</span>
                                            {item.isUnsaved && (
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 opacity-60"
                                                    title="Unsaved changes"
                                                />
                                            )}
                                        </div>

                                        {/* File Actions on Hover */}
                                        {!isReadOnly && (
                                            <div className="hidden group-hover:flex items-center gap-1 text-gray-500 flex-shrink-0 ml-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSaveFileLocally(item);
                                                    }}
                                                    title="Download"
                                                    className="hover:text-green-400 transition p-0.5"
                                                >
                                                    <VscDownload className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={(e) => startEditing(item, e)}
                                                    title="Rename"
                                                    className="hover:text-yellow-400 transition p-0.5"
                                                >
                                                    <VscEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteItem(item.id);
                                                    }}
                                                    title="Delete"
                                                    className="hover:text-red-400 transition p-0.5"
                                                >
                                                    <VscTrash className="text-xs" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    }
                })}
            </div>
        );
    };

    const totalFilesCount = files.filter((f) => !f.isFolder).length;

    return (
        <div
            className="w-56 bg-[#181818] border-r border-[#252526] text-gray-300 flex flex-col h-full select-none flex-shrink-0"
            style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace", fontSize: "12px" }}
            onClick={() => setSelectedFolderId(null)}
        >
            {/* Explorer Header */}
            <div className="px-3 py-2 border-b border-[#252526] flex items-center justify-between bg-[#1e1e1e]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <VscFiles className="text-blue-400 text-xs" /> Explorer
                </span>
                {!isReadOnly && (
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCreatingState({ type: "file", parentId: selectedFolderId });
                                setIsWorkspaceOpen(true);
                                if (selectedFolderId) {
                                    setCollapsedFolders((prev) => {
                                        const next = new Set(prev);
                                        next.delete(selectedFolderId);
                                        return next;
                                    });
                                }
                            }}
                            title={selectedFolderId ? "New File in selected folder" : "New File"}
                            className="p-1 hover:bg-[#2a2d2e] hover:text-white rounded transition text-gray-400"
                        >
                            <VscNewFile className="text-sm" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCreatingState({ type: "folder", parentId: selectedFolderId });
                                setIsWorkspaceOpen(true);
                                if (selectedFolderId) {
                                    setCollapsedFolders((prev) => {
                                        const next = new Set(prev);
                                        next.delete(selectedFolderId);
                                        return next;
                                    });
                                }
                            }}
                            title={selectedFolderId ? "New Folder in selected folder" : "New Folder"}
                            className="p-1 hover:bg-[#2a2d2e] hover:text-white rounded transition text-gray-400"
                        >
                            <VscNewFolder className="text-sm" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCollapseAll();
                            }}
                            title="Collapse All Folders"
                            className="p-1 hover:bg-[#2a2d2e] hover:text-white rounded transition text-gray-400"
                        >
                            <VscCollapseAll className="text-sm" />
                        </button>
                    </div>
                )}
            </div>

            {/* Search / Filter */}
            <div className="px-2 py-1.5 border-b border-[#252526]">
                <div className="flex items-center bg-[#252526] border border-[#3c3c3c] rounded px-2 py-1 gap-1.5 focus-within:border-blue-500 transition">
                    <VscSearch className="text-gray-500 text-xs flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Filter files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-gray-200 focus:outline-none w-full text-[11px]"
                    />
                </div>
            </div>

            {/* Tree Section */}
            <div className="flex-1 overflow-y-auto py-1">
                {/* Workspace Root Node */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsWorkspaceOpen((v) => !v);
                        setSelectedFolderId(null);
                    }}
                    className={`group flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[10px] text-gray-400 uppercase tracking-wider font-bold select-none ${
                        selectedFolderId === null ? "bg-[#222225]" : ""
                    }`}
                >
                    <div className="flex items-center gap-1">
                        {isWorkspaceOpen ? <VscChevronDown className="text-xs" /> : <VscChevronRight className="text-xs" />}
                        <span className="ml-0.5">Workspace ({totalFilesCount})</span>
                    </div>
                    {!isReadOnly && (
                        <div className="hidden group-hover:flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCreatingState({ type: "file", parentId: null });
                                    setIsWorkspaceOpen(true);
                                }}
                                title="New File at root"
                                className="hover:text-blue-400 text-gray-400 p-0.5"
                            >
                                <VscNewFile className="text-xs" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCreatingState({ type: "folder", parentId: null });
                                    setIsWorkspaceOpen(true);
                                }}
                                title="New Folder at root"
                                className="hover:text-amber-400 text-gray-400 p-0.5"
                            >
                                <VscNewFolder className="text-xs" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Render Workspace Tree */}
                {isWorkspaceOpen && renderTree(null, 0)}

                {matchingItemIds && matchingItemIds.size === 0 && (
                    <div className="pl-5 py-3 text-gray-500 italic text-[11px]">
                        No matching files or folders.
                    </div>
                )}
            </div>
        </div>
    );
}
