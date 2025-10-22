import React from "react";
import { Progress } from "@/components/ui/progress";
import { DATA } from "@/lib/data";

type HorizontalBarProps = {
  value: number;
  additionalValue?: number;
  min: number;
  max: number;
  unit: string;
  additionalUnit?: string;
  Icon?: React.ElementType;
  iconClassName?: string;

  data?: keyof typeof DATA;
};

export function HorizontalBar({
  value,
  additionalValue,
  min,
  max,
  unit,
  additionalUnit,
  Icon,
  iconClassName = "w-4 h-4",
  data,
}: HorizontalBarProps) {
  const normalizedValue = ((value - min) / (max - min)) * 100;

  let color = "#10B981";

  let resolvedMetric: keyof typeof DATA | undefined = data;
  if (!resolvedMetric) {
    const keys = Object.keys(DATA) as Array<keyof typeof DATA>;
    for (const k of keys) {
      const m = DATA[k];

      const eps = 1e-6;
      if (Math.abs(m.min - min) < eps && Math.abs(m.max - max) < eps) {
        resolvedMetric = k;
        break;
      }
    }
  }

  if (
    resolvedMetric &&
    DATA[resolvedMetric] &&
    typeof DATA[resolvedMetric].colorFor === "function"
  ) {
    try {
      color = DATA[resolvedMetric].colorFor(value);
    } catch {
      console.warn("DATA colorFor failed for", resolvedMetric);
    }
  } else {
    const pct = max === min ? 0 : (value - min) / (max - min);
    if (pct < 0.7) color = "#10B981";
    else if (pct < 0.9) color = "#F59E0B";
    else color = "#EF4444";
  }

  const wrapperStyle = { ["--hb-indicator"]: color } as React.CSSProperties;

  return (
    <div className="w-48 space-y-2" style={wrapperStyle}>
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm">
          {value}
          {unit}
        </span>
        <span className="text-muted-foreground text-sm">
          {additionalValue}
          {additionalUnit}
        </span>
      </div>
      <div className="[&_[data-slot=progress-indicator]]:bg-[var(--hb-indicator)]">
        <Progress value={normalizedValue} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs">
          {min}
          {unit}
        </span>
        {Icon ? (
          <Icon className={iconClassName} />
        ) : (
          <span className={iconClassName} />
        )}
        <span className="text-xs">
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
