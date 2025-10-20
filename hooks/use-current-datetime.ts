import { useState, useEffect } from "react";

function formatNow(date: Date): string {
  const year = date.getFullYear();
  const day = String(date.getDate());

  const italianMonths = [
    "gen",
    "feb",
    "mar",
    "apr",
    "mag",
    "giu",
    "lug",
    "ago",
    "set",
    "ott",
    "nov",
    "dic",
  ];
  const month = italianMonths[date.getMonth()];

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
}

export default function useCurrentDatetime(): string {
  const [now, setNow] = useState(() => formatNow(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(formatNow(new Date()));
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  return now;
}
