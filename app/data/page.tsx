"use client";

import Image from "next/image";
import { Gauge } from "@/components/gauge";
import { HorizontalBar } from "@/components/horizontal-bar";
import { ThermometerSnowflake, Fuel, BatteryCharging } from "lucide-react";
import { TbRoad } from "react-icons/tb";
import { SiCarthrottle } from "react-icons/si";
import { PiGasCan } from "react-icons/pi";
import { DATA } from "@/lib/data";
import useOBDData from "@/hooks/use-obd-data";

export default function Data() {
  const obdData = useOBDData();

  return (
    <main className="w-full space-y-8">
      <div className="flex items-center justify-between px-16">
        <HorizontalBar
          value={Number(obdData.fuelConsumption.toFixed(2))}
          data="fuelConsumption"
          min={DATA.fuelConsumption.min}
          max={DATA.fuelConsumption.max}
          unit="KM/L"
          Icon={Fuel}
        />
        <HorizontalBar
          value={obdData.fuelLevel}
          additionalValue={obdData.residualKms}
          data="fuelLevel"
          min={DATA.fuelLevel.min}
          max={DATA.fuelLevel.max}
          unit="%"
          additionalUnit="KM"
          Icon={PiGasCan}
        />
        <HorizontalBar
          value={obdData.throttlePosition}
          data="throttlePosition"
          min={DATA.throttlePosition.min}
          max={DATA.throttlePosition.max}
          unit="%"
          Icon={SiCarthrottle}
        />
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="w-96">
          <Gauge
            value={obdData.rpm}
            min={DATA.rpm.min}
            max={DATA.rpm.max}
            label="RPM"
            data="rpm"
            redArcStartDeg={(DATA.rpm.redValue / DATA.rpm.max) * 360}
          />
        </div>
        <Image
          className="h-auto w-44"
          src="/car.webp"
          alt="Car Image"
          width={390}
          height={694}
        />
        <div className="w-96">
          <Gauge
            value={obdData.speed}
            min={DATA.speed.min}
            max={DATA.speed.max}
            label="KM/H"
            data="speed"
            redArcStartDeg={(DATA.speed.redValue / DATA.speed.max) * 360}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-16">
        <HorizontalBar
          value={obdData.engineTemp}
          data="engineTemp"
          min={DATA.engineTemp.min}
          max={DATA.engineTemp.max}
          unit="°C"
          Icon={ThermometerSnowflake}
        />
        <div className="flex items-center gap-2">
          <TbRoad size={24} />
          <span className="text-2xl font-medium">{obdData.odometer}KM</span>
        </div>
        <HorizontalBar
          value={Number(obdData.batteryVoltage.toFixed(1))}
          data="batteryVoltage"
          min={DATA.batteryVoltage.min}
          max={DATA.batteryVoltage.max}
          unit="V"
          Icon={BatteryCharging}
        />
      </div>
    </main>
  );
}
