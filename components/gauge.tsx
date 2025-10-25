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
  data?: keyof typeof DATA;
  startDeg?: number;
  clockwise?: boolean;
  redArcStartDeg?: number;
};

import { DATA } from "@/lib/data";

export function Gauge({
  value = 0,
  min = 0,
  max = 360,
  label = "Gauge",
  data,
  startDeg = 90,
  clockwise = true,
  redArcStartDeg = 270,
}: GaugeProps) {
  const startAngle = startDeg;
  const endAngle = clockwise ? startDeg - 360 : startDeg + 360;
  const angleRange = Math.abs(endAngle - startAngle);

  const clamped = Math.min(Math.max(value, min), max);
  const proportion = max === min ? 0 : (clamped - min) / (max - min);
  const mappedAngle = proportion * angleRange;

  const pct = proportion;

  let arcColor = "#10B981";

  if (data && DATA[data] && typeof DATA[data].colorFor === "function") {
    try {
      arcColor = DATA[data].colorFor(clamped);
    } catch {
      console.warn("DATA colorFor failed for", data);
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
        outerRadius={120}
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
                const cx = (viewBox.cx ?? 0) as number;
                const cy = (viewBox.cy ?? 0) as number;
                const arcRadius = 94;

                const redArcStartAngle = redArcStartDeg - 180;
                const segStartAngle = 0;
                const segEndAngle =
                  redArcStartAngle +
                  (clockwise ? -angleRange * 0.5 : angleRange * 0.5);

                const polarToCartesian = (
                  cx: number,
                  cy: number,
                  r: number,
                  angleDeg: number,
                ) => {
                  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
                  return {
                    x: cx + r * Math.cos(angleRad),
                    y: cy + r * Math.sin(angleRad),
                  };
                };

                const describeArc = (
                  cx: number,
                  cy: number,
                  r: number,
                  startAngle: number,
                  endAngle: number,
                  clockwiseFlag: boolean,
                ) => {
                  const start = polarToCartesian(cx, cy, r, startAngle);
                  const end = polarToCartesian(cx, cy, r, endAngle);
                  const delta = Math.abs(endAngle - startAngle);
                  const largeArcFlag = delta <= 180 ? "0" : "1";
                  const sweepFlag = clockwiseFlag ? "0" : "1";
                  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
                };

                const pathD = describeArc(
                  cx,
                  cy,
                  arcRadius,
                  segStartAngle,
                  segEndAngle,
                  clockwise,
                );

                return (
                  <g>
                    <path
                      d={pathD}
                      stroke="#EF4444"
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={cx}
                        y={cy}
                        className="fill-foreground text-4xl font-bold"
                      >
                        {clamped.toLocaleString()}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 24}
                        className="fill-muted-foreground"
                      >
                        {label}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy - 104}
                        className="fill-muted-foreground"
                      >
                        {min}
                      </tspan>
                      <tspan
                        x={cx + 78}
                        y={cy - 78}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.125)}
                      </tspan>
                      <tspan
                        x={cx + 104}
                        y={cy}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.25)}
                      </tspan>
                      <tspan
                        x={cx + 78}
                        y={cy + 78}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.375)}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 104}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.5)}
                      </tspan>
                      <tspan
                        x={cx - 78}
                        y={cy + 78}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.625)}
                      </tspan>
                      <tspan
                        x={cx - 104}
                        y={cy}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.75)}
                      </tspan>
                      <tspan
                        x={cx - 78}
                        y={cy - 78}
                        className="fill-muted-foreground"
                      >
                        {Math.round(max * 0.875)}
                      </tspan>
                    </text>
                  </g>
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
