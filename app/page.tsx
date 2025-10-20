"use client";

import { useEffect, useState } from "react";

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
    <div>
      <h1>Mock OBD Dashboard</h1>
      <p>Speed: {data.speed} km/h</p>
      <p>RPM: {data.rpm}</p>
      <p>Fuel Level: {data.fuelLevel} %</p>
      <p>Engine Temperature: {data.engineTemp} °C</p>
      <p>Battery Voltage: {data.battery.toFixed(1)} V</p>
    </div>
  );
}
