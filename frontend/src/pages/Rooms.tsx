import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Plus, LogIn, LogOut, Users, Clock, Loader } from "lucide-react";
import { toast } from "sonner";
import { createNewRoom, joinExistingRoom, getMyRooms } from "@/services/roomApi.ts";

interface RoomData {
  id: number;
  name: string;
  room_code: string;
  owner_id: string;
  owner_username: string;
  is_active: boolean;
  participant_count: number;
  createdAt: string;
  updatedAt: string;
}

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Rooms = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const fetchRooms = async () => {
    try {
      const response = await getMyRooms();
      if (response?.success) {
        setAvailableRooms(response.data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    setIsCreating(true);
    try {
      const response = await createNewRoom({ name: roomName });

      if (response?.success) {
        toast.success(response.message || "Room created successfully!");
        navigate(`/editor/${response.data.room.id}`);
      } else {
        toast.error(response?.message || "Failed to create room");
      }
    } catch (error) {
      toast.error("Unexpected error while creating room");
      console.error("Create Room Error:", error);
    } finally {
      setIsCreating(false);
      setRoomName("");
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    setIsJoining(true);
    try {
      const response = await joinExistingRoom({ roomCode: roomCode.trim() });
      if (response?.success) {
        toast.success(response.message || "Joined room successfully!");
        navigate(`/editor/${response.data.room.id}`);
      } else {
        toast.error(response?.message || "Failed to join room");
      }
    } catch (error) {
      toast.error("Failed to join room");
    } finally {
      setIsJoining(false);
      setRoomCode("");
    }
  };

  const handleEnterRoom = (roomId: number) => {
    navigate(`/editor/${roomId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                C
              </span>
            </div>
            <h1 className="text-xl font-bold">CollabCode</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome,{" "}
              <span className="text-foreground font-medium">
                {user?.username}
              </span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Your Coding Rooms</h2>
          <p className="text-muted-foreground text-lg">
            Create a new room or join an existing one to start collaborating
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Room Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Room
              </CardTitle>
              <CardDescription>
                Start a new collaborative coding session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Name</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter room the room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating && <Loader className="animate-spin" />}
                Create Room
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Join Existing Room
              </CardTitle>
              <CardDescription>
                Enter a room code to join a session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter room code (e.g., abc123)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
              </div>
              <Button
                onClick={() => handleJoinRoom()}
                disabled={isJoining || !roomCode.trim()}
                className="w-full"
                size="lg"
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Rooms */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Your Rooms</h3>
          <div className="grid gap-4">
            {isLoadingRooms ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading rooms...</p>
                </CardContent>
              </Card>
            ) : availableRooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No rooms yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create a new room or join one with a code to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableRooms.map((room) => (
                <Card
                  key={room.id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-lg">{room.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.participant_count} participant
                            {room.participant_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Created {formatTimeAgo(room.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEnterRoom(room.id)}
                      >
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-12 bg-accent/5 border-accent/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">How it works</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create a room and share the code with your team</li>
                  <li>• Join existing rooms to collaborate in real-time</li>
                  <li>• See who's online and chat while coding</li>
                  <li>• Run code together using the integrated terminal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Rooms;
