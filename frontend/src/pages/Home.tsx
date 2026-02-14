import { CircleHelp, Moon, Sun } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PlayerSelector from "../components/PlayerSelector";
import SessionList from "../components/SessionList";
import { useCreateSession } from "../hooks/useCreateSession";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import type { Session } from "../types/api";

const REQUIRED_PLAYERS = 5;

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
  const { isDark, toggle } = useTheme();
  const { toast } = useToast();

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
  }, [canStart, createSession, navigate, selectedPlayerIds]);

  return (
    <div className="flex flex-col gap-6 overflow-x-hidden p-4 lg:p-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            Sessions récentes
          </h2>
          <div className="flex gap-1">
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
