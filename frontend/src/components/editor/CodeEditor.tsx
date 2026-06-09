import { Editor, OnMount } from "@monaco-editor/react";
import { useState, useRef, useCallback } from "react";
import { useCollaboration } from "@/hooks/useCollaboration.ts";
import { useCursors } from "@/hooks/useCursors.ts";
import { useSocket } from "@/contexts/SocketContext.tsx";
import type { editor } from "monaco-editor";

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  html: "HTML",
  css: "CSS",
  json: "JSON",
};

interface CodeEditorProps {
  selectedFile?: string;
  language?: string;
  roomId?: string;
  onGetCodeRef?: (fn: () => string) => void;
}

const CodeEditor = ({
  selectedFile = "main.js",
  language = "javascript",
  roomId,
  onGetCodeRef,
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { activeUsers } = useSocket();

  const { isSynced } = useCollaboration(
    isEditorReady ? editorRef.current : null,
    isEditorReady ? monacoRef.current : null,
    roomId
  );

  useCursors(isEditorReady ? editorRef.current : null, roomId);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Expose getCode to parent (for TerminalPanel run)
    if (onGetCodeRef) {
      onGetCodeRef(() => editor.getValue());
    }

    setIsEditorReady(true);
  }, [onGetCodeRef]);

  return (
    <div className="flex-1 flex flex-col bg-editor-bg overflow-hidden">
      <div className="h-9 border-b border-border flex items-center px-4 bg-card">
        <span className="text-xs text-muted-foreground">
          Editing: {selectedFile}
          {isSynced ? " • Synced" : " • Connecting..."}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* key={language} remounts editor when language changes so syntax highlighting updates */}
        <Editor
          key={language}
          height="100%"
          language={language}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            lineNumbers: "on",
            rulers: [80, 120],
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Status bar */}
      <div className="h-6 bg-card border-t border-border flex items-center justify-between px-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{LANGUAGE_LABELS[language] ?? language}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>{activeUsers.length} active user{activeUsers.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
