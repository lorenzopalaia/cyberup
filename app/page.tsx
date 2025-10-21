"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart } from "@/components/area-chart";
import { Thermometer, Fuel, BatteryCharging } from "lucide-react";
import useObdData from "@/hooks/use-obd-data";

export default function Home() {
  const obdData = useObdData();

  return (
    <main className="w-full space-y-8">
      <h1 className="text-4xl">
        <span className="text-muted-foreground">Ciao, </span>
        <span className="font-bold">Lorenzo</span>
      </h1>
      <div className="flex gap-4">
        {/* Temperature Card */}
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer />
              Temperatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obdData ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">
                    {obdData.temperature}
                  </div>
                  <div className="text-muted-foreground">°C</div>
                </div>
                <AreaChart chartData={obdData.temperatureHistory} />
              </div>
            ) : (
              "Loading..."
            )}
          </CardContent>
        </Card>
        {/* Consumption Card */}
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel />
              Consumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obdData ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">
                    {Number(obdData.fuelConsumption.toFixed(1))}
                  </div>
                  <div className="text-muted-foreground">KM/L</div>
                </div>
                <AreaChart chartData={obdData.fuelConsumptionHistory} />
              </div>
            ) : (
              "Loading..."
            )}
          </CardContent>
        </Card>
        {/* Battery Voltage Card */}
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BatteryCharging />
              Voltaggio Batteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obdData ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">
                    {Number(obdData.batteryVoltage.toFixed(1))}
                  </div>
                  <div className="text-muted-foreground">V</div>
                </div>
                <AreaChart chartData={obdData.batteryVoltageHistory} />
              </div>
            ) : (
              "Loading..."
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
