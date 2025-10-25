"use client";

import React, { createContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { DATA_POINTS } from "@/lib/ws-config";
import { ERROR_MAP } from "@/lib/errors";

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

export type OBDContextValue = OBDData & {
  temperatureHistory: number[];
  fuelConsumptionHistory: number[];
  batteryVoltageHistory: number[];
  errorCode: string | null;
  errorMessage: { title: string; description: string } | null;
  clearError: () => void;
};

export const OBDContext = createContext<OBDContextValue | undefined>(undefined);

export function OBDProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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

  const [temperatureHistory, setTemperatureHistory] = useState<number[]>([
    data.temperature,
  ]);
  const [fuelConsumptionHistory, setFuelConsumptionHistory] = useState<
    number[]
  >([data.fuelConsumption]);
  const [batteryVoltageHistory, setBatteryVoltageHistory] = useState<number[]>([
    data.batteryVoltage,
  ]);

  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<{
    title: string;
    description: string;
  } | null>(null);

  function clearError() {
    setErrorCode(null);
    setErrorMessage(null);
  }

  useEffect(() => {
    const envPort = process.env.WS_PORT || "3001";
    const url = `http://localhost:${envPort}`;

    const socket: Socket = io(url, {
      path: "/ws",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected", socket.id);
    });

    socket.on("update", (message: any) => {
      const messageData = message as Partial<OBDData>;

      const residualKms = Math.round(
        (735 * (messageData.fuelLevel ?? 0)) / 100,
      );
      const incoming: OBDData = {
        speed: messageData.speed ?? 0,
        rpm: messageData.rpm ?? 0,
        fuelLevel: messageData.fuelLevel ?? 0,
        engineTemp: messageData.engineTemp ?? 0,
        batteryVoltage: messageData.batteryVoltage ?? 0,
        temperature: messageData.temperature ?? 0,
        odometer: messageData.odometer ?? 0,
        fuelConsumption: messageData.fuelConsumption ?? 0,
        throttlePosition: messageData.throttlePosition ?? 0,
        residualKms,
      };

      setData(incoming);

      setTemperatureHistory((prev) => {
        const next = prev.concat(incoming.temperature);
        if (next.length > DATA_POINTS)
          next.splice(0, next.length - DATA_POINTS);
        return next;
      });

      setFuelConsumptionHistory((prev) => {
        const next = prev.concat(incoming.fuelConsumption);
        if (next.length > DATA_POINTS)
          next.splice(0, next.length - DATA_POINTS);
        return next;
      });

      setBatteryVoltageHistory((prev) => {
        const next = prev.concat(incoming.batteryVoltage);
        if (next.length > DATA_POINTS)
          next.splice(0, next.length - DATA_POINTS);
        return next;
      });
    });

    socket.on("errorCode", (payload: any) => {
      if (payload && payload.errorCode) {
        const code = String(payload.errorCode);
        setErrorCode(code);
        setErrorMessage(ERROR_MAP[code] ?? { title: code, description: "" });
      }
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket.IO connect error:", err);
    });

    socket.on("disconnect", (reason: any) => {
      console.log("Socket.IO disconnected:", reason);
    });

    return () => {
      try {
        socket.disconnect();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  const value: OBDContextValue = {
    ...data,
    temperatureHistory,
    fuelConsumptionHistory,
    batteryVoltageHistory,
    errorCode,
    errorMessage,
    clearError,
  };

  return <OBDContext.Provider value={value}>{children}</OBDContext.Provider>;
}
