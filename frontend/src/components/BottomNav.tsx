import { BarChart3, Home, Users, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs: ReadonlyArray<{ Icon: LucideIcon; label: string; to: string }> = [
  { Icon: Home, label: "Accueil", to: "/" },
  { Icon: BarChart3, label: "Stats", to: "/stats" },
  { Icon: UsersRound, label: "Groupes", to: "/groups" },
  { Icon: Users, label: "Joueurs", to: "/players" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-surface-border bg-surface-primary pb-safe lg:left-1/2 lg:max-w-4xl lg:-translate-x-1/2 lg:rounded-t-xl">
      <div className="flex justify-around">
        {tabs.map(({ Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center px-4 py-2 text-xs transition-colors ${
                isActive
                  ? "font-semibold text-accent-500"
                  : "text-text-secondary"
              }`
            }
          >
            <Icon className="mb-0.5 size-5 lg:size-6" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
