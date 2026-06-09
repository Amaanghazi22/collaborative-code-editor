import EditorHeader from "@/components/editor/EditorHeader.tsx";
import FileSidebar from "@/components/editor/FileSidebar.tsx";
import CodeEditor from "@/components/editor/CodeEditor.tsx";
import ChatPanel from "@/components/editor/ChatPanel.tsx";
import TerminalPanel from "@/components/editor/TerminalPanel.tsx";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext.tsx";
import { getRoomDetails } from "@/services/roomApi.ts";
import { toast } from "sonner";

interface RoomInfo {
  name: string;
  room_code: string;
}

const Editor = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { joinRoom, leaveRoom, activeUsers } = useSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState("main.js");
  const [language, setLanguage] = useState("javascript");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  // Ref to get current editor code — populated by CodeEditor on mount
  const getCodeRef = useRef<() => string>(() => "");
  const runTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!roomId) return;

    joinRoom(roomId);

    getRoomDetails(roomId).then((response) => {
      if (response?.success) {
        setRoomInfo({
          name: response.data.room.name,
          room_code: response.data.room.room_code,
        });
      } else {
        const status = response?.status ?? 0;
        if (status === 404) {
          toast.error("Room not found");
          navigate("/rooms");
        } else if (status === 403) {
          toast.error("You are not a member of this room");
          navigate("/rooms");
        } else {
          toast.error("Failed to load room details");
        }
      }
    });

    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom, navigate]);

  const handleFileSelect = (fileName: string, fileLang: string) => {
    setSelectedFile(fileName);
    setLanguage(fileLang);
  };

  // Run button: open terminal + trigger execution
  const handleRun = useCallback(() => {
    setIsTerminalOpen(true);
    // Small delay so TerminalPanel mounts before we fire run
    setTimeout(() => runTriggerRef.current?.(), 50);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      <EditorHeader
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleTerminal={handleRun}
        isSidebarOpen={isSidebarOpen}
        isChatOpen={isChatOpen}
        selectedFile={selectedFile}
        language={language}
        activeUsers={activeUsers}
        roomCode={roomInfo?.room_code}
      />

      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && (
          <FileSidebar
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            roomCode={roomInfo?.room_code}
            roomName={roomInfo?.name}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <CodeEditor
              selectedFile={selectedFile}
              language={language}
              roomId={roomId}
              onGetCodeRef={(fn) => { getCodeRef.current = fn; }}
            />
            {isChatOpen && (
              <ChatPanel onClose={() => setIsChatOpen(false)} roomId={roomId} />
            )}
          </div>

          {isTerminalOpen && (
            <TerminalPanel
              onClose={() => setIsTerminalOpen(false)}
              language={language}
              getCode={() => getCodeRef.current()}
              onRunTriggerRef={(fn) => { runTriggerRef.current = fn; }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
