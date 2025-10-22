import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  Gauge,
  Navigation,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Home", Icon: Home, color: "text-amber-500" },
  {
    href: "/navigation",
    label: "Navig.",
    Icon: Navigation,
    color: "text-orange-500",
  },
  {
    href: "/metrics",
    label: "Metriche",
    Icon: Gauge,
    color: "text-sky-500",
  },
  {
    href: "/settings",
    label: "Impost.",
    Icon: Settings,
    color: "text-emerald-500",
  },
  {
    href: "/other",
    label: "Altro",
    Icon: LayoutDashboard,
    color: "text-stone-500",
  },
];

export default function Sidebar() {
  return (
    <Card className="flex h-screen flex-col gap-4 p-4">
      {navItems.map(({ href, label, Icon, color }) => (
        <Link key={href} href={href}>
          <Button
            variant="secondary"
            aria-label={label}
            className="flex h-20 w-20 flex-col items-center justify-center"
          >
            <Icon size={20} className={color} />
            <span className="text-[10px]">{label}</span>
          </Button>
        </Link>
      ))}
    </Card>
  );
}
