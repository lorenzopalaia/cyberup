import { useEffect, useState } from "react";

interface OBDData {
  speed: number;
  rpm: number;
  fuelLevel: number;
  engineTemp: number;
  batteryVoltage: number;
  temperature: number;
  odometer: number;
  fuelConsumption: number;
  throttlePosition: number;
  residualKms: number;
}

export default function useOBDData() {
  const [data, setData] = useState<OBDData>({
    speed: 0,
    rpm: 0,
    fuelLevel: 0,
    engineTemp: 0,
    batteryVoltage: 0,
    temperature: 0,
    odometer: 0,
    fuelConsumption: 0,
    throttlePosition: 0,
    residualKms: 0,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Computed values
      const residualKms = Math.round(735 * (message.fuelLevel / 100));
      message.residualKms = residualKms;

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

  return data;
}
