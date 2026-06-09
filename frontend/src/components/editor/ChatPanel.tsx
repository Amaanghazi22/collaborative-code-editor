import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Send, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useSocket } from "@/contexts/SocketContext.tsx";
import { getRoomMessages } from "@/services/roomApi.ts";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  color: string;
}

interface ChatPanelProps {
  onClose: () => void;
  roomId?: string;
}

const ChatPanel = ({ onClose, roomId }: ChatPanelProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();
  // Pull the socket directly from context so the listener is tied to the
  // same instance that SocketContext manages — avoids timing issues where
  // getSocket() is called before the socket is stored in the singleton.
  const { socket } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted history when roomId is available
  useEffect(() => {
    if (!roomId) return;
    getRoomMessages(roomId).then((res) => {
      if (res?.success && Array.isArray(res.data?.messages)) {
        setMessages(res.data.messages);
      }
    });
  }, [roomId]);

  // Register chat:message listener on the socket instance from context.
  // Using `socket` (not getSocket()) as the dependency means this effect
  // re-runs if the socket instance is replaced (reconnection), so the
  // listener is always attached to the live socket.
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:message", handleMessage);
    };
  }, [socket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !socket) return;
    socket.emit("chat:message", { content: message });
    setMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      <div className="h-9 border-b border-border flex items-center justify-between px-3">
        <span className="text-xs font-medium">CHAT</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <Avatar
                  className="h-7 w-7 flex-shrink-0"
                  style={{ boxShadow: `0 0 0 1px ${msg.color}` }}
                >
                  <AvatarFallback
                    className="text-xs text-background"
                    style={{ backgroundColor: msg.color }}
                  >
                    {msg.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">
                      {msg.userId === user?.id ? "You" : msg.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 h-8 text-sm bg-secondary border-border"
          />
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={handleSend}
            disabled={!message.trim() || !socket}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
