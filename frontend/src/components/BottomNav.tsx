import { NavLink } from "react-router-dom";

const tabs = [
  { icon: "\u{1F3E0}", label: "Accueil", to: "/" },
  { icon: "\u{1F4CA}", label: "Stats", to: "/stats" },
  { icon: "\u{1F465}", label: "Joueurs", to: "/players" },
] as const;

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around">
        {tabs.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 text-xs ${
                isActive
                  ? "text-[#1e3a5f] font-semibold"
                  : "text-gray-500"
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
