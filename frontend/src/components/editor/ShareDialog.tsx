import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/contexts/SocketContext.tsx";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode?: string;
}

const ShareDialog = ({ open, onOpenChange, roomCode }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { activeUsers } = useSocket();
  const shareUrl = roomCode
    ? `${window.location.origin}/session/${roomCode}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Session</DialogTitle>
          <DialogDescription>
            Share this link or room code with others to collaborate in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {roomCode && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Room Code</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-md px-3 py-2 text-center font-mono text-lg tracking-widest">
                  {roomCode}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="link" className="text-xs text-muted-foreground">
              Share Link
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="link"
                value={shareUrl}
                readOnly
                className="h-9 flex-1"
              />
              <Button
                type="button"
                size="icon"
                className="h-9 w-9"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <strong>Active users:</strong> {activeUsers.length} |{" "}
            Anyone with this link or code can join and edit in real-time
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
