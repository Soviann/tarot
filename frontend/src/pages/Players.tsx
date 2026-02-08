import { Pencil, Plus } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { FAB, Modal, PlayerAvatar, SearchInput } from "../components/ui";
import { useCreatePlayer } from "../hooks/useCreatePlayer";
import { usePlayers } from "../hooks/usePlayers";
import { useUpdatePlayer } from "../hooks/useUpdatePlayer";
import { ApiError } from "../services/api";
import type { Player } from "../types/api";

export default function Players() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  const { isPending, players } = usePlayers(search);
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();

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

  const openEditModal = useCallback(
    (player: Player) => {
      updatePlayer.reset();
      setEditingPlayer(player);
      setEditName(player.name);
      setEditActive(player.active);
    },
    [updatePlayer],
  );

  const closeEditModal = useCallback(() => {
    setEditingPlayer(null);
  }, []);

  const handleEditSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!editingPlayer) return;
      const trimmed = editName.trim();
      if (!trimmed) return;
      updatePlayer.mutate(
        { active: editActive, id: editingPlayer.id, name: trimmed },
        { onSuccess: () => closeEditModal() },
      );
    },
    [closeEditModal, editActive, editName, editingPlayer, updatePlayer],
  );

  const isDuplicate =
    createPlayer.isError &&
    createPlayer.error instanceof ApiError &&
    createPlayer.error.status === 422;

  const isEditDuplicate =
    updatePlayer.isError &&
    updatePlayer.error instanceof ApiError &&
    updatePlayer.error.status === 422;

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
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
              <PlayerAvatar
                className={player.active ? "" : "opacity-50"}
                name={player.name}
                playerId={player.id}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate font-medium ${
                      player.active
                        ? "text-text-primary"
                        : "text-text-muted line-through"
                    }`}
                  >
                    {player.name}
                  </p>
                  {!player.active && (
                    <span className="shrink-0 rounded bg-surface-tertiary px-1.5 py-0.5 text-xs text-text-muted">
                      Inactif
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {new Date(player.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <button
                aria-label={`Modifier ${player.name}`}
                className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-tertiary"
                onClick={() => openEditModal(player)}
                type="button"
              >
                <Pencil size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FAB
        aria-label="Ajouter un joueur"
        icon={<Plus size={24} />}
        onClick={openModal}
      />

      {/* Modal création joueur */}
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

      {/* Modal édition joueur */}
      <Modal
        onClose={closeEditModal}
        open={editingPlayer !== null}
        title="Modifier le joueur"
      >
        <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
          <div>
            <input
              className="w-full rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nom du joueur"
              required
              type="text"
              value={editName}
            />
            {isEditDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Ce nom est déjà utilisé.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Joueur actif
            </span>
            <button
              aria-checked={editActive}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                editActive ? "bg-accent-500" : "bg-surface-tertiary"
              }`}
              onClick={() => setEditActive(!editActive)}
              role="switch"
              type="button"
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${
                  editActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <button
            className="rounded-lg bg-accent-500 px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            disabled={updatePlayer.isPending}
            type="submit"
          >
            Enregistrer
          </button>
        </form>
      </Modal>
    </div>
  );
}
