"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

function ProgressDialog({
  open,
  onOpenChange,
  percent,
  message,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  percent: number;
  message: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent disableClose={percent < 100}>
        <DialogHeader>
          <DialogTitle>Aggiornamento in corso...</DialogTitle>
          <DialogDescription>
            {percent >= 100
              ? message || "Aggiornamento completato"
              : message || "Attendere prego."}
          </DialogDescription>
        </DialogHeader>
        <Progress value={percent} />
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const [percent, setPercent] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const defaultUrl = `${location.protocol}//${location.hostname}:3001`;
    const socket = io(defaultUrl, { path: "/ws" });
    socketRef.current = socket;

    socket.on("connect", () => {
      // connected
    });

    socket.on("updateProgress", (data: any) => {
      if (data && typeof data.percent === "number") {
        setPercent(data.percent);
        if (data.message && typeof data.message === "string") {
          setStatusMessage(data.message);
        } else if (data.stage && typeof data.stage === "string") {
          // map basic stages to italian  messages
          const stageMap: Record<string, string> = {
            start: "Inizio update",
            fetch: "Fetch completato",
            "pull-start": "Avvio pull",
            pull: "Pull completato",
            "build-start": "Avvio build",
            build: "Build completato",
            "up-to-date": "Repository aggiornato",
            done: "Completato",
          };
          setStatusMessage(stageMap[data.stage] || data.stage);
        }
      }
    });

    socket.on("updateError", (data: any) => {
      console.error("update error", data);
      setStatusMessage(data?.message || "Errore durante l'update");
      setPercent(null);
      setIsDialogOpen(false);
    });

    socket.on("updateComplete", () => {
      setPercent(100);
      setStatusMessage("Aggiornamento completato");
    });

    socket.on("disconnect", () => {
      setIsDialogOpen(false);
      setPercent(null);
      setStatusMessage(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleUpdate = () => {
    setIsDialogOpen(true);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("triggerUpdate");
      setPercent(0);
      setStatusMessage("Inizio update");
    } else {
      console.warn("Socket not connected");
    }
  };

  return (
    <div className="w-full space-y-8">
      <Button onClick={handleUpdate}>Update</Button>

      {/* Dialog controllato come nell'esempio fornito */}
      <ProgressDialog
        open={isDialogOpen}
        onOpenChange={(v) => {
          // quando l'utente chiude il dialog resetta lo stato
          setIsDialogOpen(v);
          if (!v) setPercent(null);
          if (!v) setStatusMessage(null);
        }}
        percent={percent ?? 0}
        message={statusMessage}
      />
    </div>
  );
}
