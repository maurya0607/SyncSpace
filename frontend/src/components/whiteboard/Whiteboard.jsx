import { useState, useRef, useEffect, useContext } from "react";
import { Stage, Layer, Line, Rect, Circle } from "react-konva";
import Toolbar from "./Toolbar";
import CursorOverlay from "./CursorOverlay";
import { AuthContext } from "../../context/AuthContext";

export default function Whiteboard({ socket, roomId, initialShapes, isReadOnly }) {
    const { user } = useContext(AuthContext);
    const [tool, setTool] = useState("pen");
    const [color, setColor] = useState("#3b82f6");
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [shapes, setShapes] = useState(initialShapes || []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [remoteCursors, setRemoteCursors] = useState({});
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

    useEffect(() => {
        if (initialShapes && initialShapes.length > 0) {
            setShapes(initialShapes);
        }
    }, [initialShapes]);

    // Resize canvas dynamically to parent container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                const h = containerRef.current.offsetHeight;
                if (w > 0 && h > 0) {
                    setDimensions({
                        width: w,
                        height: Math.max(100, h - 42)
                    });
                }
            }
        };
        updateSize();
        window.addEventListener("resize", updateSize);

        let resizeObserver;
        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                updateSize();
            });
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener("resize", updateSize);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    // Socket event listeners for real-time drawing & cursor sync
    useEffect(() => {
        if (!socket) return;

        socket.on("whiteboard-state", (serverShapes) => {
            setShapes(serverShapes);
        });

        socket.on("whiteboard-draw", (newShape) => {
            setShapes((prev) => [...prev, newShape]);
        });

        socket.on("whiteboard-draw-update", (updatedShape) => {
            setShapes((prev) => {
                const next = [...prev];
                if (next.length > 0) {
                    next[next.length - 1] = updatedShape;
                }
                return next;
            });
        });

        socket.on("whiteboard-clear", () => {
            setShapes([]);
        });

        socket.on("cursor-update", ({ socketId, position, user: cursorUser }) => {
            setRemoteCursors((prev) => ({
                ...prev,
                [socketId]: { position, user: cursorUser }
            }));
        });

        socket.on("cursor-remove", ({ socketId }) => {
            setRemoteCursors((prev) => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
        });

        return () => {
            socket.off("whiteboard-state");
            socket.off("whiteboard-draw");
            socket.off("whiteboard-draw-update");
            socket.off("whiteboard-clear");
            socket.off("cursor-update");
            socket.off("cursor-remove");
        };
    }, [socket]);

    const handleMouseDown = (e) => {
        if (isReadOnly) return;
        setIsDrawing(true);
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        let newShape = null;
        const currentStrokeColor = tool === "eraser" ? "#1f2937" : color;

        if (tool === "pen" || tool === "eraser") {
            newShape = {
                id: Date.now().toString(),
                type: "line",
                points: [pos.x, pos.y],
                stroke: currentStrokeColor,
                strokeWidth: strokeWidth,
            };
        } else if (tool === "line") {
            newShape = {
                id: Date.now().toString(),
                type: "line",
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: currentStrokeColor,
                strokeWidth: strokeWidth,
            };
        } else if (tool === "rectangle") {
            newShape = {
                id: Date.now().toString(),
                type: "rectangle",
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                stroke: currentStrokeColor,
                strokeWidth: strokeWidth,
            };
        } else if (tool === "circle") {
            newShape = {
                id: Date.now().toString(),
                type: "circle",
                x: pos.x,
                y: pos.y,
                radius: 0,
                stroke: currentStrokeColor,
                strokeWidth: strokeWidth,
            };
        }

        if (newShape) {
            setShapes((prev) => [...prev, newShape]);
            if (socket) {
                socket.emit("whiteboard-draw-start", { roomId, shape: newShape });
            }
        }
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Emit cursor position for presence
        if (socket && user) {
            socket.emit("cursor-move", { roomId, position: pos, user });
        }

        if (!isDrawing || shapes.length === 0 || isReadOnly) return;

        setShapes((prev) => {
            const updated = [...prev];
            const lastShape = { ...updated[updated.length - 1] };

            if (lastShape.type === "line" && (tool === "pen" || tool === "eraser")) {
                lastShape.points = [...lastShape.points, pos.x, pos.y];
            } else if (lastShape.type === "line" && tool === "line") {
                lastShape.points = [lastShape.points[0], lastShape.points[1], pos.x, pos.y];
            } else if (lastShape.type === "rectangle") {
                lastShape.width = pos.x - lastShape.x;
                lastShape.height = pos.y - lastShape.y;
            } else if (lastShape.type === "circle") {
                const dx = pos.x - lastShape.x;
                const dy = pos.y - lastShape.y;
                lastShape.radius = Math.sqrt(dx * dx + dy * dy);
            }

            updated[updated.length - 1] = lastShape;

            if (socket) {
                socket.emit("whiteboard-draw-progress", { roomId, shape: lastShape });
            }

            return updated;
        });
    };

    const handleMouseUp = () => {
        if (!isDrawing || isReadOnly) return;
        setIsDrawing(false);
        if (socket && shapes.length > 0) {
            socket.emit("whiteboard-draw-end", { roomId, shape: shapes[shapes.length - 1] });
        }
    };

    const handleClear = () => {
        if (isReadOnly) return;
        setShapes([]);
        if (socket) {
            socket.emit("whiteboard-clear", { roomId });
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-800 overflow-hidden select-none relative">
            {!isReadOnly && (
                <Toolbar
                    tool={tool}
                    setTool={setTool}
                    color={color}
                    setColor={setColor}
                    strokeWidth={strokeWidth}
                    setStrokeWidth={setStrokeWidth}
                    handleClear={handleClear}
                />
            )}
            <div className="flex-1 w-full relative">
                <CursorOverlay remoteCursors={remoteCursors} />
                <Stage
                    width={dimensions.width}
                    height={dimensions.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                >
                    <Layer>
                        {shapes.map((s, i) => {
                            if (s.type === "line") {
                                return (
                                    <Line
                                        key={s.id || i}
                                        points={s.points}
                                        stroke={s.stroke}
                                        strokeWidth={s.strokeWidth}
                                        tension={0.4}
                                        lineCap="round"
                                        lineJoin="round"
                                    />
                                );
                            } else if (s.type === "rectangle") {
                                return (
                                    <Rect
                                        key={s.id || i}
                                        x={s.x}
                                        y={s.y}
                                        width={s.width}
                                        height={s.height}
                                        stroke={s.stroke}
                                        strokeWidth={s.strokeWidth}
                                        cornerRadius={4}
                                    />
                                );
                            } else if (s.type === "circle") {
                                return (
                                    <Circle
                                        key={s.id || i}
                                        x={s.x}
                                        y={s.y}
                                        radius={s.radius}
                                        stroke={s.stroke}
                                        strokeWidth={s.strokeWidth}
                                    />
                                );
                            }
                            return null;
                        })}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}
