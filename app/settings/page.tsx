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
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  percent: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiornamento in corso...</DialogTitle>
          <DialogDescription>Attendere prego.</DialogDescription>
        </DialogHeader>
        <Progress value={percent} />
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const [percent, setPercent] = useState<number | null>(null);
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
      }
    });

    socket.on("updateError", (data: any) => {
      console.error("update error", data);
      setPercent(null);
      setIsDialogOpen(false);
    });

    socket.on("updateComplete", () => {
      setPercent(100);
    });

    socket.on("disconnect", () => {
      setIsDialogOpen(false);
      setPercent(null);
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
        }}
        percent={percent ?? 0}
      />
    </div>
  );
}
