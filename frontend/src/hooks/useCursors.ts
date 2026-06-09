import { useEffect, useRef, useCallback } from "react";
import type { editor } from "monaco-editor";
import { getSocket } from "@/services/socket";

interface CursorData {
  userId: string;
  username: string;
  color: string;
  position: { lineNumber: number; column: number };
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;
}

// Map userId to their decoration IDs so we can update them
const userDecorations = new Map<string, string[]>();

export function useCursors(
  editorInstance: editor.IStandaloneCodeEditor | null,
  roomId: string | undefined
) {
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emit local cursor position changes (throttled)
  const emitCursorPosition = useCallback(() => {
    if (!editorInstance) return;
    const socket = getSocket();
    if (!socket) return;

    const position = editorInstance.getPosition();
    const selection = editorInstance.getSelection();

    if (!position) return;

    let selectionData = null;
    if (
      selection &&
      (selection.startLineNumber !== selection.endLineNumber ||
        selection.startColumn !== selection.endColumn)
    ) {
      selectionData = {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn,
      };
    }

    socket.emit("cursor:move", {
      position: {
        lineNumber: position.lineNumber,
        column: position.column,
      },
      selection: selectionData,
    });
  }, [editorInstance]);

  const throttledEmit = useCallback(() => {
    if (throttleRef.current) return;
    throttleRef.current = setTimeout(() => {
      emitCursorPosition();
      throttleRef.current = null;
    }, 50);
  }, [emitCursorPosition]);

  useEffect(() => {
    if (!editorInstance || !roomId) return;
    const socket = getSocket();
    if (!socket) return;

    // Listen for local cursor/selection changes
    const cursorDisposable = editorInstance.onDidChangeCursorPosition(() => {
      throttledEmit();
    });
    const selectionDisposable = editorInstance.onDidChangeCursorSelection(() => {
      throttledEmit();
    });

    // Listen for remote cursor updates
    const handleCursorUpdate = (data: CursorData) => {
      const { userId, username, color, position, selection } = data;

      const decorations: editor.IModelDeltaDecoration[] = [];

      // Cursor line decoration
      decorations.push({
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        options: {
          className: "remote-cursor",
          beforeContentClassName: "remote-cursor-line",
          hoverMessage: { value: username },
          stickiness: 1, // NeverGrowsWhenTypingAtEdges
          // Inject dynamic color via CSS custom property
          inlineClassName: undefined,
        },
      });

      // Cursor label (shown above the cursor)
      decorations.push({
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        options: {
          after: {
            content: ` ${username}`,
            inlineClassName: "remote-cursor-label",
          },
          stickiness: 1,
        },
      });

      // Selection highlight
      if (selection) {
        decorations.push({
          range: {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          },
          options: {
            className: "remote-selection",
            stickiness: 1,
          },
        });
      }

      // Apply decorations, replacing any previous ones for this user
      const oldDecorations = userDecorations.get(userId) || [];
      const model = editorInstance.getModel();
      if (model) {
        const newDecorationIds = editorInstance.deltaDecorations(
          oldDecorations,
          decorations
        );
        userDecorations.set(userId, newDecorationIds);
      }

      // Inject dynamic CSS for this user's color
      injectCursorStyle(userId, color);
    };

    // Clean up cursor decorations when a user leaves
    const handleUserLeft = ({ userId }: { userId: string }) => {
      const oldDecorations = userDecorations.get(userId) || [];
      if (oldDecorations.length > 0) {
        editorInstance.deltaDecorations(oldDecorations, []);
        userDecorations.delete(userId);
      }
      removeCursorStyle(userId);
    };

    socket.on("cursor:update", handleCursorUpdate);
    socket.on("room:user-left", handleUserLeft);

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
      socket.off("cursor:update", handleCursorUpdate);
      socket.off("room:user-left", handleUserLeft);

      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      // Clean up all decorations
      for (const [userId, decorationIds] of userDecorations) {
        editorInstance.deltaDecorations(decorationIds, []);
        removeCursorStyle(userId);
      }
      userDecorations.clear();
    };
  }, [editorInstance, roomId, throttledEmit]);
}

// Dynamically inject CSS for each user's cursor color
function injectCursorStyle(userId: string, color: string) {
  const styleId = `cursor-style-${userId}`;
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = `
    /* Styles are applied via deltaDecorations className matching */
  `;

  // We use a global approach: set CSS variables per user
  document.documentElement.style.setProperty(`--cursor-color-${userId.slice(0, 8)}`, color);
}

function removeCursorStyle(userId: string) {
  const style = document.getElementById(`cursor-style-${userId}`);
  if (style) style.remove();
  document.documentElement.style.removeProperty(`--cursor-color-${userId.slice(0, 8)}`);
}
