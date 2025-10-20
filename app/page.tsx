"use client";

import Image from "next/image";
import { Gauge } from "@/components/gauge";
import { HorizontalBar } from "@/components/horizontal-bar";
import { ThermometerSnowflake, Fuel, BatteryCharging } from "lucide-react";
import { TbRoad } from "react-icons/tb";
import METRICS from "@/lib/metrics";
import useOBDData from "@/hooks/use-obd-data";

export default function Home() {
  const obdData = useOBDData();

  return (
    <main className="w-full space-y-8">
      <div className="flex justify-center">
        <HorizontalBar
          value={obdData.engineTemp}
          metric="engineTemp"
          min={METRICS.engineTemp.min}
          max={METRICS.engineTemp.max}
          unit="°C"
          Icon={ThermometerSnowflake}
        />
      </div>
      <div className="flex justify-center items-center gap-8">
        <div className="w-96">
          <Gauge
            value={obdData.rpm}
            min={METRICS.rpm.min}
            max={METRICS.rpm.max}
            label="RPM"
            metric="rpm"
          />
        </div>
        <Image
          className="w-44 h-auto"
          src="/car.webp"
          alt="Car Image"
          width={390}
          height={694}
        />
        <div className="w-96">
          <Gauge
            value={obdData.speed}
            min={METRICS.speed.min}
            max={METRICS.speed.max}
            label="KM/H"
            metric="speed"
          />
        </div>
      </div>
      <div className="flex justify-between items-center px-16">
        <HorizontalBar
          value={obdData.fuelLevel}
          metric="fuelLevel"
          min={METRICS.fuelLevel.min}
          max={METRICS.fuelLevel.max}
          unit="%"
          Icon={Fuel}
        />
        <div className="flex items-center gap-2">
          <TbRoad size={24} />
          <span className="text-2xl font-medium">{obdData.odometer}KM</span>
        </div>
        <HorizontalBar
          value={Number(obdData.batteryVoltage.toFixed(1))}
          metric="batteryVoltage"
          min={METRICS.batteryVoltage.min}
          max={METRICS.batteryVoltage.max}
          unit="V"
          Icon={BatteryCharging}
        />
      </div>
    </main>
  );
}
