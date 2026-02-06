import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface-secondary pb-16 text-text-primary">
      <main className="animate-fade-in">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
