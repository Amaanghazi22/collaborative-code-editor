import EditorHeader from "@/components/editor/EditorHeader.tsx";
import FileSidebar from "@/components/editor/FileSidebar.tsx";
import CodeEditor from "@/components/editor/CodeEditor.tsx";
import ChatPanel from "@/components/editor/ChatPanel.tsx";
import TerminalPanel from "@/components/editor/TerminalPanel.tsx";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext.tsx";
import { getRoomDetails } from "@/services/roomApi.ts";

interface RoomInfo {
  name: string;
  room_code: string;
}

const Index = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { joinRoom, leaveRoom, activeUsers } = useSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState("main.js");
  const [language, setLanguage] = useState("javascript");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);

      // Fetch room details for room code and name
      getRoomDetails(roomId).then((response) => {
        if (response?.success) {
          setRoomInfo({
            name: response.data.room.name,
            room_code: response.data.room.room_code,
          });
        }
      });
    }
    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom]);

  const handleFileSelect = (fileName: string, fileLang: string) => {
    setSelectedFile(fileName);
    setLanguage(fileLang);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      <EditorHeader
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
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
            <CodeEditor selectedFile={selectedFile} language={language} roomId={roomId} />
            {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
          </div>

          {isTerminalOpen && (
            <TerminalPanel onClose={() => setIsTerminalOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
