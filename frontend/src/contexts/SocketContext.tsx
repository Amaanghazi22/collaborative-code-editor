import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext.tsx";
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket.ts";

export interface ActiveUser {
  userId: string;
  username: string;
  color: string;
}

interface SocketContextType {
  socket: Socket | null;
  activeUsers: ActiveUser[];
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomId = useRef<string | null>(null);

  // Connect socket when user logs in, disconnect on logout
  useEffect(() => {
    if (user?.token) {
      const socket = connectSocket(user.token);

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));

      return () => {
        socket.off("connect");
        socket.off("disconnect");
      };
    } else {
      disconnectSocket();
      setIsConnected(false);
      setActiveUsers([]);
    }
  }, [user?.token]);

  // Subscribe to presence events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUsers = (users: ActiveUser[]) => {
      setActiveUsers(users);
    };

    const handleUserJoined = (newUser: ActiveUser) => {
      setActiveUsers((prev) => {
        if (prev.some((u) => u.userId === newUser.userId)) return prev;
        return [...prev, newUser];
      });
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on("room:users", handleUsers);
    socket.on("room:user-joined", handleUserJoined);
    socket.on("room:user-left", handleUserLeft);

    return () => {
      socket.off("room:users", handleUsers);
      socket.off("room:user-joined", handleUserJoined);
      socket.off("room:user-left", handleUserLeft);
    };
  }, [isConnected]);

  const joinRoom = useCallback((roomId: string) => {
    const socket = getSocket();
    if (!socket) return;

    // Leave current room first if in one
    if (currentRoomId.current) {
      socket.emit("room:leave");
    }

    currentRoomId.current = roomId;
    socket.emit("room:join", { roomId });
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    if (!socket || !currentRoomId.current) return;

    socket.emit("room:leave");
    currentRoomId.current = null;
    setActiveUsers([]);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: getSocket(),
        activeUsers,
        joinRoom,
        leaveRoom,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
