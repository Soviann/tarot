import { CircleHelp, Moon, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import BottomNav from "./BottomNav";

export default function Layout() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-surface-secondary pb-16 text-text-primary lg:pb-20">
      <header className="flex justify-end gap-1 p-2 lg:mx-auto lg:max-w-4xl">
        <button
          aria-label="Changer de thème"
          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-tertiary"
          onClick={toggle}
          type="button"
        >
          {isDark ? (
            <Sun className="size-5 lg:size-6" />
          ) : (
            <Moon className="size-5 lg:size-6" />
          )}
        </button>
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
