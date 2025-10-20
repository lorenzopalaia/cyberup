"use client";

import { useEffect, useState } from "react";
import { Gauge } from "@/components/gauge";

interface OBDData {
  speed: number;
  rpm: number;
  fuelLevel: number;
  engineTemp: number;
  battery: number;
}

export default function Home() {
  const [data, setData] = useState<OBDData>({
    speed: 0,
    rpm: 0,
    fuelLevel: 0,
    engineTemp: 0,
    battery: 0,
  });

  useEffect(() => {
    // connect to the dedicated websocket path on the server
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setData(message);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mock OBD Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Speed */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge value={data.speed} min={0} max={180} label="Speed" />
        </div>

        {/* RPM */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge value={data.rpm} min={0} max={6500} label="RPM" />
        </div>

        {/* Fuel Level */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge value={data.fuelLevel} min={0} max={100} label="Fuel" />
        </div>

        {/* Engine Temp */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge
            value={data.engineTemp}
            min={70}
            max={105}
            label="Engine Temp."
          />
        </div>

        {/* Battery */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge value={data.battery} min={11.8} max={14.6} label="Battery" />
        </div>
      </div>
    </div>
  );
}
