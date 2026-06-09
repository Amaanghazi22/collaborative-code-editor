import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Terminal, X, Play, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface TerminalPanelProps {
  onClose: () => void;
  language?: string;
  getCode?: () => string;
  onRunTriggerRef?: (fn: () => void) => void;
}

const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  html: 41,
  css: 41,
  json: 41,
};

const JUDGE0_URL = import.meta.env.VITE_JUDGE0_URL?.replace(/\/$/, "");
const JUDGE0_KEY = import.meta.env.VITE_JUDGE0_API_KEY;
// Only send RapidAPI headers when using the hosted service (key present).
// Self-hosted Judge0 (localhost or Render) needs no auth headers.
const rapidApiHeaders: Record<string, string> = JUDGE0_KEY
  ? { "X-RapidAPI-Key": JUDGE0_KEY, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" }
  : {};

interface OutputLine {
  text: string;
  type: "info" | "success" | "error" | "log";
}

const TerminalPanel = ({ onClose, language = "javascript", getCode, onRunTriggerRef }: TerminalPanelProps) => {
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLine = (text: string, type: OutputLine["type"] = "log") => {
    setOutputLines((prev) => [...prev, { text, type }]);
  };

  const handleRunCode = useCallback(async () => {
    if (isRunning) return;

    const code = getCode?.() ?? "";
    if (!code.trim()) {
      addLine("Nothing to run — editor is empty.", "info");
      return;
    }

    if (!JUDGE0_URL) {
      addLine(
        "Code execution not configured. Set VITE_JUDGE0_URL in .env (e.g. http://localhost:2358)",
        "error"
      );
      return;
    }

    setIsRunning(true);
    const langId = JUDGE0_LANGUAGE_IDS[language] ?? 63;
    addLine(`▶ Running ${language}...`, "info");

    try {
      const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...rapidApiHeaders,
        },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: "",
          cpu_time_limit: 5,
          memory_limit: 128000,
        }),
      });

      if (!submitRes.ok) throw new Error(`Submit failed: ${submitRes.status}`);
      const { token } = await submitRes.json();

      // Poll for result
      let result = null;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(
          `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
          {
            headers: { ...rapidApiHeaders },
          }
        );
        result = await pollRes.json();
        if (result.status?.id > 2) break; // done (not In Queue / Processing)
      }

      if (!result) throw new Error("Timed out waiting for result");

      if (result.stdout) addLine(result.stdout.trimEnd(), "success");
      if (result.stderr) addLine(result.stderr.trimEnd(), "error");
      if (result.compile_output) addLine(result.compile_output.trimEnd(), "error");

      const statusDesc = result.status?.description ?? "Unknown";
      const time = result.time ? ` in ${result.time}s` : "";
      const mem = result.memory ? `, ${Math.round(result.memory / 1024)}KB` : "";
      addLine(`✓ ${statusDesc}${time}${mem}`, result.status?.id === 3 ? "success" : "error");
    } catch (err) {
      addLine(`Error: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, language, getCode]);

  // Expose run function to parent so header Run button can trigger it
  useEffect(() => {
    if (onRunTriggerRef) onRunTriggerRef(handleRunCode);
  }, [onRunTriggerRef, handleRunCode]);

  const colorClass = (type: OutputLine["type"]) => {
    switch (type) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      case "info": return "text-blue-400";
      default: return "text-foreground";
    }
  };

  return (
    <div className="h-64 border-t border-border bg-card flex flex-col">
      <Tabs defaultValue="output" className="flex-1 flex flex-col">
        <div className="h-9 border-b border-border flex items-center justify-between px-3">
          <TabsList className="h-7 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="terminal"
              className="h-7 px-3 text-xs data-[state=active]:bg-secondary"
            >
              <Terminal className="h-3 w-3 mr-1.5" />
              Terminal
            </TabsTrigger>
            <TabsTrigger
              value="output"
              className="h-7 px-3 text-xs data-[state=active]:bg-secondary"
            >
              Output
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRunCode}
              disabled={isRunning}
              title="Run code"
            >
              <Play className={`h-3 w-3 ${isRunning ? "animate-pulse" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setOutputLines([])}
              title="Clear output"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <TabsContent value="terminal" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 font-mono text-xs text-muted-foreground">
              <p>Interactive terminal not available in browser.</p>
              <p className="mt-1">Use the Output tab to run code via the ▶ button.</p>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0">
          <ScrollArea className="h-full">
            {outputLines.length === 0 ? (
              <div className="p-3 font-mono text-xs text-muted-foreground">
                {JUDGE0_URL
                  ? "Press ▶ to run your code."
                  : "Code execution requires VITE_JUDGE0_URL + VITE_JUDGE0_API_KEY in .env — press ▶ for details."}
              </div>
            ) : (
              <pre className="p-3 font-mono text-xs whitespace-pre-wrap">
                {outputLines.map((line, i) => (
                  <span key={i} className={`block ${colorClass(line.type)}`}>
                    {line.text}
                  </span>
                ))}
                {isRunning && (
                  <span className="inline-block w-2 h-3.5 bg-primary animate-pulse ml-1" />
                )}
              </pre>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerminalPanel;
