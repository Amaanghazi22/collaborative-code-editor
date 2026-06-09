import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Copy, FileCode, Users } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useSocket } from "@/contexts/SocketContext.tsx";
import { toast } from "sonner";

interface FileSidebarProps {
  onFileSelect: (fileName: string, language: string) => void;
  selectedFile: string;
  roomCode?: string;
  roomName?: string;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", file: "main.js" },
  { value: "typescript", label: "TypeScript", file: "main.ts" },
  { value: "python", label: "Python", file: "main.py" },
  { value: "java", label: "Java", file: "Main.java" },
  { value: "cpp", label: "C++", file: "main.cpp" },
  { value: "c", label: "C", file: "main.c" },
  { value: "html", label: "HTML", file: "index.html" },
  { value: "css", label: "CSS", file: "style.css" },
  { value: "json", label: "JSON", file: "data.json" },
];

const FileSidebar = ({
  onFileSelect,
  selectedFile,
  roomCode,
  roomName,
}: FileSidebarProps) => {
  const { activeUsers } = useSocket();

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!");
    }
  };

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="h-9 border-b border-sidebar-border flex items-center px-3">
        <span className="text-xs font-medium text-sidebar-foreground">
          ROOM INFO
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-5">
          {/* Room Details */}
          {(roomName || roomCode) && (
            <div className="space-y-2">
              {roomName && (
                <p className="text-sm font-medium text-sidebar-foreground">
                  {roomName}
                </p>
              )}
              {roomCode && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="font-mono tracking-widest text-xs"
                  >
                    {roomCode}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-sidebar-accent"
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Language / File Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileCode className="h-3.5 w-3.5" />
              <span>LANGUAGE</span>
            </div>
            <div className="space-y-0.5">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang.value}
                  variant="ghost"
                  className={`w-full justify-start h-7 px-2 text-sm hover:bg-sidebar-accent ${
                    selectedFile === lang.file ? "bg-sidebar-accent" : ""
                  }`}
                  onClick={() => onFileSelect(lang.file, lang.value)}
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                PARTICIPANTS ({activeUsers.length})
              </span>
            </div>
            <div className="space-y-1">
              {activeUsers.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center gap-2 px-2 py-1 rounded-md"
                >
                  <Avatar
                    className="h-6 w-6"
                    style={{ boxShadow: `0 0 0 1px ${u.color}` }}
                  >
                    <AvatarFallback
                      className="text-[10px] text-background font-medium"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-sidebar-foreground">
                    {u.username}
                  </span>
                  <span
                    className="ml-auto h-2 w-2 rounded-full"
                    style={{ backgroundColor: u.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileSidebar;
