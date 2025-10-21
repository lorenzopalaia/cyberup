import { useEffect, useState } from "react";
import { DATA_POINTS } from "@/lib/ws-config";

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

// Return type includes the two history queues
export default function useOBDData(): OBDData & {
  temperatureHistory: number[];
  fuelConsumptionHistory: number[];
  batteryVoltageHistory: number[];
} {
  const [data, setData] = useState<OBDData>({
    speed: 0,
    rpm: 800,
    fuelLevel: 100,
    engineTemp: 90,
    batteryVoltage: 12.6,
    temperature: 20,
    odometer: 0,
    fuelConsumption: 18,
    throttlePosition: 0,
    residualKms: 0,
  });

  // Histories (queues) of up to DATA_POINTS elements
  const [temperatureHistory, setTemperatureHistory] = useState<number[]>([
    data.temperature,
  ]);
  const [fuelConsumptionHistory, setFuelConsumptionHistory] = useState<
    number[]
  >([data.fuelConsumption]);
  const [batteryVoltageHistory, setBatteryVoltageHistory] = useState<number[]>([
    data.batteryVoltage,
  ]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as Partial<OBDData>;

      // Computed values
      const residualKms = Math.round((735 * (message.fuelLevel ?? 0)) / 100);
      const incoming: OBDData = {
        speed: message.speed ?? 0,
        rpm: message.rpm ?? 0,
        fuelLevel: message.fuelLevel ?? 0,
        engineTemp: message.engineTemp ?? 0,
        batteryVoltage: message.batteryVoltage ?? 0,
        temperature: message.temperature ?? 0,
        odometer: message.odometer ?? 0,
        fuelConsumption: message.fuelConsumption ?? 0,
        throttlePosition: message.throttlePosition ?? 0,
        residualKms,
      };

      // Update main data
      setData(incoming);

      // Push into temperature history, keep length <= DATA_POINTS
      setTemperatureHistory((prev) => {
        const next = prev.concat(incoming.temperature);
        if (next.length > DATA_POINTS)
          next.splice(0, next.length - DATA_POINTS);
        return next;
      });

      // Push into fuel consumption history, keep length <= DATA_POINTS
      setFuelConsumptionHistory((prev) => {
        const next = prev.concat(incoming.fuelConsumption);
        if (next.length > DATA_POINTS)
          next.splice(0, next.length - DATA_POINTS);
        return next;
      });

      // Push into battery voltage history, keep length <= DATA_POINTS
      setBatteryVoltageHistory((prev) => {
        const next = prev.concat(incoming.batteryVoltage);
        if (next.length > DATA_POINTS)
          next.splice(0, next.length - DATA_POINTS);
        return next;
      });
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

  return {
    ...data,
    temperatureHistory,
    fuelConsumptionHistory,
    batteryVoltageHistory,
  };
}
