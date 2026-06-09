import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Code2, Users, Zap, Shield } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CodeCollaborate</span>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 mb-20">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Code Together, <span className="text-primary">Build Faster</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time collaborative code editor with instant execution. Perfect
            for interviews, pair programming, and team development.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Coding Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              View Demo
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {[
            {
              icon: Users,
              title: "Real-time Collaboration",
              description:
                "Work together with your team in real-time. See changes instantly as they happen.",
            },
            {
              icon: Zap,
              title: "Instant Execution",
              description:
                "Run code in 75+ languages with Judge0 API integration. Get results in milliseconds.",
            },
            {
              icon: Code2,
              title: "Rich Code Editor",
              description:
                "Monaco editor with syntax highlighting, IntelliSense, and code completion.",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              description:
                "Your code is secure with sandboxed execution and private sessions.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;
