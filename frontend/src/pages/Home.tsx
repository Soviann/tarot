import { CircleHelp, Moon, Sun } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PlayerSelector from "../components/PlayerSelector";
import SessionList from "../components/SessionList";
import { useCreateSession } from "../hooks/useCreateSession";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { getSeasonYear, SEASONAL_DISMISSED_KEY } from "../hooks/useSeasonalTheme";
import { isChristmasPeriod } from "../services/christmasSeason";
import { getThemeConfig } from "../services/themeRegistry";
import type { Session } from "../types/api";

const REQUIRED_PLAYERS = 5;

function ThemeToggle({ resolvedTheme, setTheme }: { resolvedTheme?: string; setTheme: (t: string) => void }) {
  const customTheme = getThemeConfig(resolvedTheme);
  const inChristmasSeason = isChristmasPeriod();

  const handleToggle = () => {
    if (resolvedTheme === "noel") {
      localStorage.setItem(SEASONAL_DISMISSED_KEY, getSeasonYear());
      setTheme("light");
    } else if (resolvedTheme === "dark") {
      if (inChristmasSeason) {
        setTheme("noel");
      } else {
        setTheme("light");
      }
    } else if (resolvedTheme === "light") {
      setTheme("dark");
    } else if (customTheme) {
      setTheme("light");
    } else {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }
  };

  return (
    <button
      aria-label="Changer de thème"
      className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-tertiary"
      onClick={handleToggle}
      type="button"
    >
      {resolvedTheme === "noel" ? (
        <img alt="noel" className="size-5 lg:size-6" src="/images/noel/santa-hat.png" />
      ) : customTheme ? (
        <img alt={customTheme.name} className="size-5 lg:size-6" src={customTheme.logo} />
      ) : resolvedTheme === "dark" ? (
        <Sun className="size-5 lg:size-6" />
      ) : (
        <Moon className="size-5 lg:size-6" />
      )}
    </button>
  );
}

export const MOTIVATIONAL_MESSAGES = [
  "Les cartes n'attendent que vous !",
  "La table est prête, il ne manque plus que les joueurs !",
  "Qui prend ? Créez une session pour le découvrir !",
  "Petit, Garde ou Garde Sans ? Il n'y a qu'une façon de le savoir…",
  "Le donneur est prêt. Et vous ?",
  "Le tarot, c'est mieux à plusieurs. Lancez-vous !",
];

export default function Home() {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const createSession = useCreateSession();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const motivationalMessage = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    [],
  );

  const canStart =
    selectedPlayerIds.length === REQUIRED_PLAYERS && !createSession.isPending;

  const handleStart = useCallback(() => {
    if (!canStart) return;
    createSession.mutate(selectedPlayerIds, {
      onSuccess: (session: Session) => {
        toast("Session créée");
        navigate(`/sessions/${session.id}`);
      },
    });
  }, [canStart, createSession, navigate, selectedPlayerIds, toast]);

  return (
    <div className="flex flex-col gap-6 overflow-x-hidden p-4 lg:p-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            Sessions récentes
          </h2>
          <div className="flex gap-1">
            <ThemeToggle resolvedTheme={resolvedTheme} setTheme={setTheme} />
            <Link
              aria-label="Aide"
              className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-tertiary"
              to="/aide"
            >
              <CircleHelp className="size-5 lg:size-6" />
            </Link>
          </div>
        </div>
        <SessionList />
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-bold text-text-primary">
          Nouvelle session
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {motivationalMessage}
        </p>

        <PlayerSelector
          isPending={createSession.isPending}
          onSelectionChange={setSelectedPlayerIds}
          onStart={handleStart}
          selectedPlayerIds={selectedPlayerIds}
        />

        {createSession.isError && (
          <p className="mt-2 text-sm text-red-500">
            Erreur lors de la création de la session.
          </p>
        )}
      </section>
    </div>
  );
}
