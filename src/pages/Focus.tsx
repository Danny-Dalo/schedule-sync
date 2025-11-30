import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SessionType = "focus" | "break";

const Focus = () => {
  const navigate = useNavigate();
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    if (sessionType === "focus") {
      setSessionCount((prev) => prev + 1);
      setSessionType("break");
      setTimeLeft(breakDuration * 60);
    } else {
      setSessionType("focus");
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionType("focus");
    setTimeLeft(focusDuration * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleFocusDurationChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setFocusDuration(num);
      if (sessionType === "focus" && !isRunning) {
        setTimeLeft(num * 60);
      }
    }
  };

  const handleBreakDurationChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setBreakDuration(num);
      if (sessionType === "break" && !isRunning) {
        setTimeLeft(num * 60);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = sessionType === "focus" 
    ? ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Tasks
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Focus Session</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              {sessionType === "focus" ? (
                <Brain className="w-8 h-8 text-primary" />
              ) : (
                <Coffee className="w-8 h-8 text-accent" />
              )}
              <h2 className="text-2xl font-semibold text-foreground">
                {sessionType === "focus" ? "Focus Time" : "Break Time"}
              </h2>
            </div>

            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke={sessionType === "focus" ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-foreground">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-lg">
              Sessions completed: {sessionCount}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleStartPause}
              className="w-32"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-5 w-5" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" /> Start
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              className="w-32"
            >
              <RotateCcw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
              <Input
                id="focus-duration"
                type="number"
                min="1"
                value={focusDuration}
                onChange={(e) => handleFocusDurationChange(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Break Duration (minutes)</Label>
              <Input
                id="break-duration"
                type="number"
                min="1"
                value={breakDuration}
                onChange={(e) => handleBreakDurationChange(e.target.value)}
                disabled={isRunning}
              />
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Focus;
