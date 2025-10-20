"use client";

import SpeedLimit from "@/components/speed-limit";
import useOBDData from "@/hooks/use-obd-data";
import useCurrentDatetime from "@/hooks/use-current-datetime";

export default function Header() {
  const obdData = useOBDData();
  const currentDatetime = useCurrentDatetime();

  return (
    <header className="flex items-center justify-between p-4">
      <h1 className="text-xl font-bold">CyberUp!</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold">{obdData.temperature}°C</span>
        <span className="text-muted-foreground text-sm">{currentDatetime}</span>
        <SpeedLimit size={24} speed={50} />
      </div>
    </header>
  );
}
