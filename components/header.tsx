import SpeedLimit from "./speed-limit";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1 className="text-xl font-bold">CyberUp!</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold">14:26</span>
        <span className="text-sm font-bold">26 °C</span>
        <span className="text-sm text-muted-foreground">Soleggiato</span>
        <SpeedLimit size={24} speed={50} />
      </div>
    </header>
  );
}
