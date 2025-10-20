import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Navigation } from "lucide-react";

export default function Sidebar() {
  return (
    <Card className="flex flex-col gap-4 p-4 h-screen">
      <Button
        aria-label="Home"
        className="w-12 h-12 p-0 mx-auto flex items-center justify-center"
      >
        <Home size={20} />
      </Button>

      <Button
        aria-label="Navigazione"
        className="w-12 h-12 p-0 mx-auto flex items-center justify-center"
      >
        <Navigation size={20} />
      </Button>
    </Card>
  );
}
