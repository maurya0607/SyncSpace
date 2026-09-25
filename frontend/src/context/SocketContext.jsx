import { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { token, user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token) return;

        const socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
            auth: {
                token
            }
        });

        socketInstance.on("connect", () => {
            setConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token]);

    const joinRoom = (roomId) => {
        if (socket) {
            socket.emit("join-room", { roomId, user });
        }
    };

    const leaveRoom = (roomId) => {
        if (socket) {
            socket.emit("leave-room", roomId);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, connected, joinRoom, leaveRoom }}>
            {children}
        </SocketContext.Provider>
    );
};
