import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { joinExistingRoom } from "@/services/roomApi.ts";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SessionJoin = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Store room code to join after login
      if (sessionId) {
        localStorage.setItem("pending_room_code", sessionId);
        toast.info("Please login to join the session");
      }
      navigate("/auth");
      return;
    }

    if (sessionId && !joining) {
      setJoining(true);
      joinExistingRoom({ roomCode: sessionId })
        .then((response) => {
          if (response?.success) {
            toast.success("Joined room successfully!");
            navigate(`/editor/${response.data.room.id}`);
          } else {
            toast.error(response?.message || "Invalid room code");
            navigate("/rooms");
          }
        })
        .catch(() => {
          toast.error("Failed to join room");
          navigate("/rooms");
        });
    }
  }, [user, isLoading, sessionId, navigate, joining]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Joining session...</p>
      </div>
    </div>
  );
};

export default SessionJoin;
