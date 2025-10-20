"use client";

import { useEffect, useState } from "react";
import { Gauge } from "@/components/gauge";
import { METRICS } from "@/lib/metrics";

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
          <Gauge
            value={data.speed}
            min={METRICS.speed.min}
            max={METRICS.speed.max}
            label={METRICS.speed.label}
            metric="speed"
          />
        </div>

        {/* RPM */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge
            value={data.rpm}
            min={METRICS.rpm.min}
            max={METRICS.rpm.max}
            label={METRICS.rpm.label}
            metric="rpm"
          />
        </div>

        {/* Fuel Level */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge
            value={data.fuelLevel}
            min={METRICS.fuelLevel.min}
            max={METRICS.fuelLevel.max}
            label={METRICS.fuelLevel.label}
            metric="fuelLevel"
          />
        </div>

        {/* Engine Temp */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge
            value={data.engineTemp}
            min={METRICS.engineTemp.min}
            max={METRICS.engineTemp.max}
            label={METRICS.engineTemp.label}
            metric="engineTemp"
          />
        </div>

        {/* Battery */}
        <div className="bg-card p-4 rounded-lg">
          <Gauge
            value={data.battery}
            min={METRICS.battery.min}
            max={METRICS.battery.max}
            label={METRICS.battery.label}
            metric="battery"
          />
        </div>
      </div>
    </div>
  );
}
