"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";

export const description = "A radial chart with text";

type GaugeProps = {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  startDeg?: number;
  clockwise?: boolean;
};

export function Gauge({
  value = 0,
  min = 0,
  max = 360,
  label = "Gauge",
  startDeg = 90,
  clockwise = true,
}: GaugeProps) {
  // angoli del grafico: startDeg è il grado da cui parte l'arco;
  // se `clockwise` è true l'arco scorre in senso orario (end < start),
  // altrimenti in senso antiorario (end > start).
  const startAngle = startDeg;
  const endAngle = clockwise ? startDeg - 360 : startDeg + 360;
  const angleRange = Math.abs(endAngle - startAngle);

  // clamp e mappatura [min, max] -> [0, angleRange]
  const clamped = Math.min(Math.max(value, min), max);
  const proportion = max === min ? 0 : (clamped - min) / (max - min);
  const mappedAngle = proportion * angleRange;

  // colore in base alla percentuale rispetto al massimo
  const pct = proportion; // 0..1
  let arcColor = "#10B981"; // green (default)
  if (pct >= 0.9) {
    arcColor = "#EF4444"; // red
  } else if (pct >= 0.7) {
    arcColor = "#F59E0B"; // yellow
  }

  const chartData = [
    {
      browser: "safari",
      // il valore passato al grafico rappresenta l'angolo mappato
      visitors: mappedAngle,
      fill: arcColor,
    },
  ];

  const chartConfig = {
    visitors: {
      label,
    },
    safari: {
      label: "Safari",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={80}
        outerRadius={110}
      >
        <PolarAngleAxis type="number" domain={[0, angleRange]} tick={false} />
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar
          dataKey="visitors"
          background
          cornerRadius={10}
          fill={arcColor}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-4xl font-bold"
                    >
                      {clamped.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      {label}
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
