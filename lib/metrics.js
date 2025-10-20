export const METRICS = {
  speed: {
    key: "speed",
    label: "Speed",
    min: 0,
    max: 180,
    step: 1,
    initial: 0,
    colorFor(value) {
      if (value < 130) return "#10B981";
      if (value < 150) return "#F59E0B";
      return "#EF4444";
    },
  },

  rpm: {
    key: "rpm",
    label: "RPM",
    min: 0,
    max: 6500,
    step: 100,
    initial: 800,
    colorFor(value) {
      if (value < 3500) return "#10B981";
      if (value < 5000) return "#F59E0B";
      return "#EF4444";
    },
  },

  fuelLevel: {
    key: "fuelLevel",
    label: "Fuel",
    min: 0,
    max: 100,
    step: 1,
    initial: 100,
    colorFor(value) {
      const pct = value / 100;
      if (pct <= 0.1) return "#EF4444";
      if (pct <= 0.25) return "#F59E0B";
      return "#10B981";
    },
  },

  engineTemp: {
    key: "engineTemp",
    label: "Engine Temp.",
    min: 70,
    max: 105,
    step: 1,
    initial: 90,
    colorFor(value) {
      if (value < 95) return "#10B981";
      if (value < 100) return "#F59E0B";
      return "#EF4444";
    },
  },

  batteryVoltage: {
    key: "batteryVoltage",
    label: "batteryVoltage",
    min: 11.8,
    max: 14.6,
    step: 0.1,
    initial: 12.6,
    colorFor(value) {
      if (value < 12.0 || value > 13.5) return "#EF4444";
      if ((value >= 12.0 && value < 12.3) || (value > 13.0 && value <= 13.5))
        return "#F59E0B";
      return "#10B981";
    },
  },
};

export default METRICS;
