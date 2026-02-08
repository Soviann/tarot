import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface-secondary pb-16 text-text-primary lg:pb-20">
      <main className="animate-fade-in lg:mx-auto lg:max-w-4xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
