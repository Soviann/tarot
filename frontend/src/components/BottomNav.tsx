import { BarChart3, Home, Users, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs: ReadonlyArray<{
  Icon: LucideIcon;
  activeClass: string;
  label: string;
  to: string;
}> = [
  { Icon: Home, activeClass: "border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400", label: "Accueil", to: "/" },
  { Icon: BarChart3, activeClass: "border-emerald-500 text-emerald-500 dark:border-emerald-400 dark:text-emerald-400", label: "Stats", to: "/stats" },
  { Icon: UsersRound, activeClass: "border-violet-500 text-violet-500 dark:border-violet-400 dark:text-violet-400", label: "Groupes", to: "/groups" },
  { Icon: Users, activeClass: "border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400", label: "Joueurs", to: "/players" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-surface-border bg-surface-primary pb-safe lg:left-1/2 lg:max-w-4xl lg:-translate-x-1/2 lg:rounded-t-xl">
      <div className="flex justify-around">
        {tabs.map(({ Icon, activeClass, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center border-t-2 px-4 py-2 text-xs transition-colors ${
                isActive
                  ? `font-semibold ${activeClass}`
                  : "border-transparent text-text-secondary"
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
