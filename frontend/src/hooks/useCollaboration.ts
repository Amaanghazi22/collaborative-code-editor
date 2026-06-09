import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";
import { getSocket } from "@/services/socket";

export function useCollaboration(
  editorInstance: editor.IStandaloneCodeEditor | null,
  monacoInstance: typeof import("monaco-editor") | null,
  roomId: string | undefined
) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!editorInstance || !monacoInstance || !roomId) return;
    if (initializedRef.current) return;

    const socket = getSocket();
    if (!socket) return;

    initializedRef.current = true;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText("monaco");

    // Receive initial sync from server
    const handleSync = ({ update }: { update: string }) => {
      const binaryUpdate = Uint8Array.from(
        atob(update)
          .split("")
          .map((c) => c.charCodeAt(0))
      );
      Y.applyUpdate(ydoc, binaryUpdate);
      setIsSynced(true);

      // Bind Y.Text to Monaco after initial sync
      if (!bindingRef.current) {
        const model = editorInstance.getModel();
        if (model) {
          bindingRef.current = new MonacoBinding(
            ytext,
            model,
            new Set([editorInstance])
          );
        }
      }
    };

    // Receive incremental updates from other users
    const handleUpdate = ({ update }: { update: string }) => {
      const binaryUpdate = Uint8Array.from(
        atob(update)
          .split("")
          .map((c) => c.charCodeAt(0))
      );
      Y.applyUpdate(ydoc, binaryUpdate, "remote");
    };

    socket.on("doc:sync", handleSync);
    socket.on("doc:update", handleUpdate);

    // Send local changes to server
    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== "remote") {
        const base64 = btoa(String.fromCharCode(...update));
        socket.emit("doc:update", { update: base64 });
      }
    };
    ydoc.on("update", onUpdate);

    return () => {
      socket.off("doc:sync", handleSync);
      socket.off("doc:update", handleUpdate);
      ydoc.off("update", onUpdate);
      bindingRef.current?.destroy();
      bindingRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
      initializedRef.current = false;
      setIsSynced(false);
    };
  }, [editorInstance, monacoInstance, roomId]);

  return { isSynced };
}
