import React from "react";

type Props = {
  size?: number;
  speed?: number | string;
  className?: string;
};

export default function SpeedLimit({
  size = 120,
  speed = "50",
  className,
}: Props) {
  const s = Math.max(24, size);
  const center = s / 2;
  const outerR = center;
  const innerR = center * 0.78;
  const textSize = Math.floor(s * 0.42);

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      role="img"
      aria-label={`Speed limit ${speed}`}
      className={className}
    >
      <circle cx={center} cy={center} r={outerR} fill="#c8102e" />
      <circle cx={center} cy={center} r={innerR} fill="#fff" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Inter, Arial, sans-serif"
        fontSize={textSize}
        fontWeight={700}
        fill="#000"
      >
        {speed}
      </text>
    </svg>
  );
}
