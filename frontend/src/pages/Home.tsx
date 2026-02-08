import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayerSelector from "../components/PlayerSelector";
import SessionList from "../components/SessionList";
import { useCreateSession } from "../hooks/useCreateSession";
import type { Session } from "../types/api";

const REQUIRED_PLAYERS = 5;

export default function Home() {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const createSession = useCreateSession();
  const navigate = useNavigate();

  const canStart =
    selectedPlayerIds.length === REQUIRED_PLAYERS && !createSession.isPending;

  const handleStart = useCallback(() => {
    if (!canStart) return;
    createSession.mutate(selectedPlayerIds, {
      onSuccess: (session: Session) => {
        navigate(`/sessions/${session.id}`);
      },
    });
  }, [canStart, createSession, navigate, selectedPlayerIds]);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold text-text-primary">
          Nouvelle session
        </h1>

        <PlayerSelector
          onSelectionChange={setSelectedPlayerIds}
          selectedPlayerIds={selectedPlayerIds}
        />

        {createSession.isError && (
          <p className="mt-2 text-sm text-red-500">
            Erreur lors de la création de la session.
          </p>
        )}

        <button
          className="mt-4 w-full rounded-lg bg-accent-500 py-3 font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
          disabled={!canStart}
          onClick={handleStart}
          type="button"
        >
          Démarrer
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Sessions récentes
        </h2>
        <SessionList />
      </section>
    </div>
  );
}
