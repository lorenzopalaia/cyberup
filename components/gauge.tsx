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

type GaugeProps = {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  metric?: keyof typeof METRICS;
  startDeg?: number;
  clockwise?: boolean;
};

import { METRICS } from "@/lib/metrics";

export function Gauge({
  value = 0,
  min = 0,
  max = 360,
  label = "Gauge",
  metric,
  startDeg = 90,
  clockwise = true,
}: GaugeProps) {
  const startAngle = startDeg;
  const endAngle = clockwise ? startDeg - 360 : startDeg + 360;
  const angleRange = Math.abs(endAngle - startAngle);

  const clamped = Math.min(Math.max(value, min), max);
  const proportion = max === min ? 0 : (clamped - min) / (max - min);
  const mappedAngle = proportion * angleRange;

  const pct = proportion;

  let arcColor = "#10B981";

  if (
    metric &&
    METRICS[metric] &&
    typeof METRICS[metric].colorFor === "function"
  ) {
    try {
      arcColor = METRICS[metric].colorFor(clamped);
    } catch {
      console.warn("METRICS colorFor failed for", metric);
    }
  } else {
    const normalizedLabel = String(label).toLowerCase();

    if (normalizedLabel.includes("fuel")) {
      if (pct <= 0.1) {
        arcColor = "#EF4444";
      } else if (pct <= 0.3) {
        arcColor = "#F59E0B";
      } else {
        arcColor = "#10B981";
      }
    } else if (normalizedLabel.includes("batteryVoltage")) {
      const volts = clamped;
      if (volts < 12.0 || volts > 13.5) {
        arcColor = "#EF4444";
      } else if (
        (volts >= 12.0 && volts < 12.3) ||
        (volts > 13.0 && volts <= 13.5)
      ) {
        arcColor = "#F59E0B";
      } else {
        arcColor = "#10B981";
      }
    } else {
      if (pct >= 0.9) {
        arcColor = "#EF4444";
      } else if (pct >= 0.7) {
        arcColor = "#F59E0B";
      }
    }
  }

  const chartData = [
    {
      browser: "safari",

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
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 104}
                      className="fill-muted-foreground"
                    >
                      {min}
                    </tspan>
                    <tspan
                      x={(viewBox.cx || 0) + 78}
                      y={(viewBox.cy || 0) - 78}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.125)}
                    </tspan>
                    <tspan
                      x={(viewBox.cx || 0) + 104}
                      y={viewBox.cy}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.25)}
                    </tspan>
                    <tspan
                      x={(viewBox.cx || 0) + 78}
                      y={(viewBox.cy || 0) + 78}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.375)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 104}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.5)}
                    </tspan>
                    <tspan
                      x={(viewBox.cx || 0) - 78}
                      y={(viewBox.cy || 0) + 78}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.625)}
                    </tspan>
                    <tspan
                      x={(viewBox.cx || 0) - 104}
                      y={viewBox.cy}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.75)}
                    </tspan>
                    <tspan
                      x={(viewBox.cx || 0) - 78}
                      y={(viewBox.cy || 0) - 78}
                      className="fill-muted-foreground"
                    >
                      {Math.round(max * 0.875)}
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
