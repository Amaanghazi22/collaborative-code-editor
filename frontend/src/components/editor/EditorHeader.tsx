import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.tsx";
import type { ActiveUser } from "@/contexts/SocketContext.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  PanelLeft,
  MessageSquare,
  Play,
  Users,
  Share2,
  Settings,
  Code2,
  LogOut,
} from "lucide-react";
import ShareDialog from "./ShareDialog.tsx";
import { toast } from "sonner";

interface EditorHeaderProps {
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  onToggleTerminal: () => void;
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  selectedFile: string;
  language: string;
  activeUsers: ActiveUser[];
  roomCode?: string;
}

const EditorHeader = ({
  onToggleSidebar,
  onToggleChat,
  onToggleTerminal,
  isSidebarOpen,
  isChatOpen,
  selectedFile,
  language,
  activeUsers,
  roomCode,
}: EditorHeaderProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3 gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hover:bg-secondary"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 px-2">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">CollabCode</span>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{selectedFile}</span>
          <Badge variant="secondary" className="text-xs capitalize">
            {language}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-secondary"
          onClick={onToggleTerminal}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Run
        </Button>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground mr-1" />
          <div className="flex -space-x-2">
            {activeUsers.map((u) => (
              <Avatar
                key={u.userId}
                className="h-7 w-7 border-2 border-background"
                style={{ boxShadow: `0 0 0 1px ${u.color}` }}
              >
                <AvatarFallback
                  className="text-xs text-background font-medium"
                  style={{ backgroundColor: u.color }}
                >
                  {u.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {activeUsers.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              {activeUsers.length}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleChat}
          className="hover:bg-secondary"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary"
          onClick={() => toast.info("Settings coming soon!")}
        >
          <Settings className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {user?.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} roomCode={roomCode} />
    </header>
  );
};

export default EditorHeader;
