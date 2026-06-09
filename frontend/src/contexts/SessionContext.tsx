import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext.tsx";

interface Participant {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  color: string;
}

interface Session {
  id: string;
  createdBy: string;
  createdAt: string;
  participants: Participant[];
}

interface SessionContextType {
  currentSession: Session | null;
  createSession: () => string;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  participants: Participant[];
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    // Load session from localStorage if exists
    const savedSession = localStorage.getItem("current_session");
    if (savedSession) {
      setCurrentSession(JSON.parse(savedSession));
    }
  }, []);

  const createSession = () => {
    if (!user) throw new Error("User must be logged in to create a session");

    const sessionId = Math.random().toString(36).substring(2, 9);
    const newSession: Session = {
      id: sessionId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      participants: [
        {
          id: user.id,
          name: user.username,
          email: user.email,
          joinedAt: new Date().toISOString(),
          color: COLORS[0],
        },
      ],
    };

    setCurrentSession(newSession);
    localStorage.setItem("current_session", JSON.stringify(newSession));

    return sessionId;
  };

  const joinSession = (sessionId: string) => {
    if (!user) throw new Error("User must be logged in to join a session");

    // In a real app, this would fetch the session from backend
    // For now, we'll simulate it with localStorage
    const savedSession = localStorage.getItem(`session_${sessionId}`);

    let session: Session;
    if (savedSession) {
      session = JSON.parse(savedSession);
    } else {
      // Create new session if doesn't exist (first user joining)
      session = {
        id: sessionId,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        participants: [],
      };
    }

    // Check if user already in session
    const alreadyJoined = session.participants.find((p) => p.id === user.id);
    if (!alreadyJoined) {
      const colorIndex = session.participants.length % COLORS.length;
      session.participants.push({
        id: user.id,
        name: user.username,
        email: user.email,
        joinedAt: new Date().toISOString(),
        color: COLORS[colorIndex],
      });
    }

    setCurrentSession(session);
    localStorage.setItem("current_session", JSON.stringify(session));
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
  };

  const leaveSession = () => {
    if (currentSession && user) {
      const updatedSession = {
        ...currentSession,
        participants: currentSession.participants.filter(
          (p) => p.id !== user.id
        ),
      };

      localStorage.setItem(
        `session_${currentSession.id}`,
        JSON.stringify(updatedSession)
      );
    }

    setCurrentSession(null);
    localStorage.removeItem("current_session");
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        createSession,
        joinSession,
        leaveSession,
        participants: currentSession?.participants || [],
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
