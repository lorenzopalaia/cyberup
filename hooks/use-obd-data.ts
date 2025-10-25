import { useContext } from "react";
import { OBDContext } from "@/hooks/obd-context";

export default function useOBDData() {
  const ctx = useContext(OBDContext);
  if (!ctx) {
    throw new Error("useOBDData must be used within an OBDProvider");
  }
  return ctx;
}
