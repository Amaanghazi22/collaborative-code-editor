import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Terminal, X, Play } from "lucide-react";
import { useState } from "react";

interface TerminalPanelProps {
  onClose: () => void;
}

const TerminalPanel = ({ onClose }: TerminalPanelProps) => {
  const [terminalOutput, setTerminalOutput] = useState(`$ npm start

> collab-code@1.0.0 start
> react-scripts start

Starting development server...
Compiled successfully!

You can now view collab-code in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.5:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully`);

  const [consoleOutput, setConsoleOutput] =
    useState(`[LOG] Application initialized
[INFO] WebSocket connected to session
[LOG] 3 users are active in this session
[INFO] Code synchronized successfully`);

  const handleRunCode = async () => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalOutput(
      (prev) => `${prev}\n\n[${timestamp}] Submitting code to Judge0 API...`
    );

    // TODO: Replace with actual Judge0 API call
    // Example Judge0 API integration:
    //
    // const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
    // const JUDGE0_API_KEY = 'YOUR_RAPIDAPI_KEY'; // Store in environment variable
    //
    // const response = await fetch(`${JUDGE0_API_URL}?base64_encoded=false&wait=true`, {
    //   method: 'POST',
    //   headers: {
    //     'content-type': 'application/json',
    //     'X-RapidAPI-Key': JUDGE0_API_KEY,
    //     'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    //   },
    //   body: JSON.stringify({
    //     source_code: codeContent, // Get from Monaco editor
    //     language_id: getLanguageId(language), // Map language to Judge0 ID
    //     stdin: "",
    //     cpu_time_limit: 2,
    //     memory_limit: 128000
    //   })
    // });
    //
    // const result = await response.json();
    //
    // Language ID mapping for Judge0:
    // JavaScript: 63, Python: 71, Java: 62, C++: 54, C: 50, etc.

    // Mock execution for UI demonstration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setTerminalOutput(
      (prev) =>
        `${prev}\n[${timestamp}] Compilation successful ✓\n[${timestamp}] Execution completed in 0.123s`
    );
    setConsoleOutput(
      (prev) =>
        `${prev}\n[${timestamp}] Output:\nHello, World!\n[${timestamp}] Exit code: 0`
    );
  };

  return (
    <div className="h-64 border-t border-border bg-card flex flex-col">
      <Tabs defaultValue="terminal" className="flex-1 flex flex-col">
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
            <TabsTrigger
              value="console"
              className="h-7 px-3 text-xs data-[state=active]:bg-secondary"
            >
              Console
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRunCode}
              title="Run code"
            >
              <Play className="h-3 w-3" />
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
            <pre className="p-3 font-mono text-xs text-foreground whitespace-pre-wrap">
              {terminalOutput}
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 font-mono text-xs text-muted-foreground">
              No output yet. Run your code to see the results here.
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="console" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <pre className="p-3 font-mono text-xs text-foreground whitespace-pre-wrap">
              {consoleOutput}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerminalPanel;
