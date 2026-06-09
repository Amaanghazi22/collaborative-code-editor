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
import { connectSocket, disconnectSocket } from "@/services/socket.ts";

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

function deduplicateUsers(users: ActiveUser[]): ActiveUser[] {
  const seen = new Set<string>();
  return users.filter((u) => {
    if (seen.has(u.userId)) return false;
    seen.add(u.userId);
    return true;
  });
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.token) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setActiveUsers([]);
      return;
    }

    const sock = connectSocket(user.token);
    setSocket(sock);
    // Sync initial connected state (socket may already be connected)
    setIsConnected(sock.connected);

    // ── Connection state ──────────────────────────────────────────────────
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // ── Presence events ───────────────────────────────────────────────────
    // Register IMMEDIATELY on the socket instance (not in a separate effect
    // that depends on isConnected state) so we never miss room:users that
    // arrives before a state-driven re-subscription would fire.
    const onRoomUsers = (users: ActiveUser[]) => {
      setActiveUsers(deduplicateUsers(users));
    };

    const onUserJoined = (newUser: ActiveUser) => {
      setActiveUsers((prev) => {
        if (prev.some((u) => u.userId === newUser.userId)) return prev;
        return [...prev, newUser];
      });
    };

    const onUserLeft = ({ userId }: { userId: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    sock.on("room:users", onRoomUsers);
    sock.on("room:user-joined", onUserJoined);
    sock.on("room:user-left", onUserLeft);

    return () => {
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
      sock.off("room:users", onRoomUsers);
      sock.off("room:user-joined", onUserJoined);
      sock.off("room:user-left", onUserLeft);
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setActiveUsers([]);
    };
  }, [user?.token]);

  const joinRoom = useCallback(
    (roomId: string) => {
      if (!socket) return;
      if (currentRoomId.current) {
        socket.emit("room:leave");
        setActiveUsers([]);
      }
      currentRoomId.current = roomId;
      socket.emit("room:join", { roomId });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket || !currentRoomId.current) return;
    socket.emit("room:leave");
    currentRoomId.current = null;
    setActiveUsers([]);
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{ socket, activeUsers, joinRoom, leaveRoom, isConnected }}
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
