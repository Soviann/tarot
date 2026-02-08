import { CircleHelp } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface-secondary pb-16 text-text-primary lg:pb-20">
      <header className="flex justify-end p-2 lg:mx-auto lg:max-w-4xl">
        <Link
          aria-label="Aide"
          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-tertiary"
          to="/aide"
        >
          <CircleHelp className="size-5 lg:size-6" />
        </Link>
      </header>
      <main className="animate-fade-in lg:mx-auto lg:max-w-4xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
