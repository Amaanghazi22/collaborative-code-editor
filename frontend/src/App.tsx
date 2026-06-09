import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { SessionProvider } from "@/contexts/SessionContext.tsx";
import { SocketProvider } from "@/contexts/SocketContext.tsx";
import { ProtectedRoute } from "@/components/ProtectedRoute.tsx";
import Landing from "./pages/Landing.tsx";
import Auth from "./pages/Auth.tsx";
import Editor from "./pages/Editor.tsx";
import NotFound from "./pages/NotFound.tsx";
import SessionJoin from "./pages/SessionJoin.tsx";
import Rooms from "./pages/Rooms.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <SessionProvider>
          <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <Rooms />
                  </ProtectedRoute>
                }
              />
              <Route path="/session/:sessionId" element={<SessionJoin />} />
              <Route
                path="/editor/:roomId"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </SessionProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
