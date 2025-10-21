"use client";

import { Area, AreaChart as _AreaChart } from "recharts";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { DATA_POINTS } from "@/lib/ws-config";

const chartConfig = {
  data: {
    label: "Data",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type AreaChartProps = {
  chartData?: number[];
  useGradient?: boolean;
  maxPoints?: number;
};

export function AreaChart({
  chartData,
  useGradient,
  maxPoints,
}: AreaChartProps) {
  const effectiveMax = maxPoints ?? DATA_POINTS;
  const rechartsData = (chartData ?? [])
    .slice(-effectiveMax)
    .map((value) => ({ data: value }));

  return (
    <ChartContainer config={chartConfig} data-max-points={effectiveMax}>
      <_AreaChart accessibilityLayer data={rechartsData}>
        {useGradient && (
          <defs>
            <linearGradient id="fillData" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-data)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-data)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
        )}
        <Area
          dataKey="data"
          type="natural"
          fill="url(#fillData)"
          fillOpacity={0.4}
          stroke="var(--color-data)"
          stackId="a"
        />
      </_AreaChart>
    </ChartContainer>
  );
}
