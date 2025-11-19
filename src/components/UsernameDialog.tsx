import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UsernameDialogProps {
  open: boolean;
  onSave: (username: string) => void;
}

export const UsernameDialog = ({ open, onSave }: UsernameDialogProps) => {
  const [username, setUsername] = useState("");

  const handleSave = () => {
    if (username.trim()) {
      onSave(username.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Task Manager</DialogTitle>
          <DialogDescription>
            Please enter your name to personalize your experience
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!username.trim()}>
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
