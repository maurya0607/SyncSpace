import { FaCircle } from "react-icons/fa";

export default function UserList({ users }) {
    return (
        <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 mr-1">Online:</span>
            {users.length === 0 && (
                <span className="text-xs text-gray-500 italic">No users</span>
            )}
            {users.map((user, i) => (
                <div
                    key={user._id || user.socketId || i}
                    title={user.name || "User"}
                    className="flex items-center gap-1.5 bg-gray-700 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                    <FaCircle className="text-green-400 text-[8px]" />
                    <span className="text-gray-200">{user.name || "User"}</span>
                </div>
            ))}
        </div>
    );
}
