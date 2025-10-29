"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [percent, setPercent] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // connetti al WS server (porta default 3001 nel progetto)
    const defaultUrl = `${location.protocol}//${location.hostname}:3001`;
    const socket = io(defaultUrl, { path: "/ws" });
    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("connected to ws");
    });

    socket.on("updateProgress", (data: any) => {
      if (data && typeof data.percent === "number") {
        setPercent(data.percent);
      }
    });

    socket.on("updateError", (data: any) => {
      // per ora mostriamo nulla in caso di errore e logghiamo
      console.error("update error", data);
      setPercent(null);
    });

    socket.on("updateComplete", () => {
      setPercent(100);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleUpdate = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("triggerUpdate");
      // reset percent while starting
      setPercent(0);
    } else {
      console.warn("Socket non connesso");
    }
  };

  return (
    <div className="w-full space-y-8">
      <Button onClick={handleUpdate}>Update</Button>
      <div aria-live="polite" className="mt-2">
        {percent !== null ? <div>{percent}%</div> : null}
      </div>
    </div>
  );
}
