import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

type SessionType = "focus" | "break";

export function FocusSessionSidebar() {
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    if (sessionType === "focus") {
      toast.success("Focus session complete! Time for a break.");
      setSessionType("break");
      setTimeLeft(breakDuration * 60);
    } else {
      toast.success("Break complete! Ready for another focus session?");
      setSessionType("focus");
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionType === "focus" ? focusDuration * 60 : breakDuration * 60);
  };

  const handleFocusDurationChange = (value: string) => {
    const num = parseInt(value) || 1;
    setFocusDuration(Math.max(1, num));
    if (sessionType === "focus" && !isRunning) {
      setTimeLeft(Math.max(1, num) * 60);
    }
  };

  const handleBreakDurationChange = (value: string) => {
    const num = parseInt(value) || 1;
    setBreakDuration(Math.max(1, num));
    if (sessionType === "break" && !isRunning) {
      setTimeLeft(Math.max(1, num) * 60);
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
    <Sidebar className="border-l">
      <SidebarHeader className="border-b p-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {sessionType === "focus" ? (
            <>
              <Brain className="h-5 w-5 text-primary" />
              Focus Session
            </>
          ) : (
            <>
              <Coffee className="h-5 w-5 text-accent" />
              Break Time
            </>
          )}
        </h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-4 py-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute inset-0 w-48 h-48 -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                    className={sessionType === "focus" ? "text-primary" : "text-accent"}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="text-center z-10">
                  <div className="text-4xl font-bold text-foreground">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {sessionType === "focus" ? "Focus" : "Break"}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="lg" variant="secondary" className="gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent className="px-4 space-y-4">
            <div>
              <Label htmlFor="focus-duration" className="text-sm text-muted-foreground">
                Focus Duration (minutes)
              </Label>
              <Input
                id="focus-duration"
                type="number"
                min="1"
                value={focusDuration}
                onChange={(e) => handleFocusDurationChange(e.target.value)}
                disabled={isRunning}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="break-duration" className="text-sm text-muted-foreground">
                Break Duration (minutes)
              </Label>
              <Input
                id="break-duration"
                type="number"
                min="1"
                value={breakDuration}
                onChange={(e) => handleBreakDurationChange(e.target.value)}
                disabled={isRunning}
                className="mt-1"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
