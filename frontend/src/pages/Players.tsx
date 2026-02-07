import { Plus } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { FAB, Modal, PlayerAvatar, SearchInput } from "../components/ui";
import { useCreatePlayer } from "../hooks/useCreatePlayer";
import { usePlayers } from "../hooks/usePlayers";
import { ApiError } from "../services/api";

export default function Players() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { isPending, players } = usePlayers(search);
  const createPlayer = useCreatePlayer();

  const openModal = useCallback(() => {
    createPlayer.reset();
    setNewName("");
    setModalOpen(true);
  }, [createPlayer]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = newName.trim();
      if (!trimmed) return;
      createPlayer.mutate(trimmed, {
        onSuccess: () => closeModal(),
      });
    },
    [closeModal, createPlayer, newName],
  );

  const isDuplicate =
    createPlayer.isError &&
    createPlayer.error instanceof ApiError &&
    createPlayer.error.status === 422;

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Joueurs</h1>
        {!isPending && (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-100 text-sm font-medium text-accent-700">
            {players.length}
          </span>
        )}
      </header>

      <SearchInput
        onSearch={setSearch}
        placeholder="Rechercher un joueur…"
      />

      {isPending && (
        <p className="py-8 text-center text-text-muted">Chargement…</p>
      )}

      {!isPending && players.length === 0 && (
        <p className="py-8 text-center text-text-muted">
          Aucun joueur trouvé
        </p>
      )}

      {!isPending && players.length > 0 && (
        <ul className="flex flex-col gap-2">
          {players.map((player) => (
            <li
              className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3"
              key={player.id}
            >
              <PlayerAvatar name={player.name} playerId={player.id} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">
                  {player.name}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(player.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FAB
        aria-label="Ajouter un joueur"
        icon={<Plus size={24} />}
        onClick={openModal}
      />

      <Modal onClose={closeModal} open={modalOpen} title="Nouveau joueur">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <input
              className="w-full rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du joueur"
              required
              type="text"
              value={newName}
            />
            {isDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Ce nom est déjà utilisé.
              </p>
            )}
            {createPlayer.isError && !isDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Erreur lors de la création.
              </p>
            )}
          </div>
          <button
            className="rounded-lg bg-accent-500 px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            disabled={createPlayer.isPending}
            type="submit"
          >
            Ajouter
          </button>
        </form>
      </Modal>
    </div>
  );
}
