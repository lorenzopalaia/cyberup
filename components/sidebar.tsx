import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Gauge, Navigation } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <Card className="flex h-screen flex-col gap-4 p-4">
      <Link href="/">
        <Button
          aria-label="Home"
          className="mx-auto flex h-12 w-12 items-center justify-center p-0"
        >
          <Home size={20} />
        </Button>
      </Link>

      <Link href="/metrics">
        <Button
          aria-label="Metriche"
          className="mx-auto flex h-12 w-12 items-center justify-center p-0"
        >
          <Gauge size={20} />
        </Button>
      </Link>

      <Link href="/navigation">
        <Button
          aria-label="Navigazione"
          className="mx-auto flex h-12 w-12 items-center justify-center p-0"
        >
          <Navigation size={20} />
        </Button>
      </Link>
    </Card>
  );
}
