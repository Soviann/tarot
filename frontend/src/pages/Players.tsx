import { Pencil, Plus } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { FAB, Modal, PlayerAvatar, SearchInput } from "../components/ui";
import { useCreatePlayer } from "../hooks/useCreatePlayer";
import { usePlayerGroups } from "../hooks/usePlayerGroups";
import { usePlayers } from "../hooks/usePlayers";
import { useUpdatePlayer } from "../hooks/useUpdatePlayer";
import { ApiError } from "../services/api";
import type { Player } from "../types/api";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#78716c",
] as const;

export default function Players() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editColor, setEditColor] = useState<string | null>(null);
  const [editGroupIds, setEditGroupIds] = useState<number[]>([]);

  const { isPending, players } = usePlayers(search);
  const { groups } = usePlayerGroups();
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
      setEditActive(player.active);
      setEditColor(player.color);
      setEditGroupIds(player.playerGroups.map((g) => g.id));
      setEditName(player.name);
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
        {
          active: editActive,
          color: editColor,
          id: editingPlayer.id,
          name: trimmed,
          playerGroups: editGroupIds.map((id) => `/api/player-groups/${id}`),
        },
        { onSuccess: () => closeEditModal() },
      );
    },
    [closeEditModal, editActive, editColor, editGroupIds, editName, editingPlayer, updatePlayer],
  );

  const toggleGroup = useCallback(
    (groupId: number) => {
      setEditGroupIds((prev) =>
        prev.includes(groupId)
          ? prev.filter((id) => id !== groupId)
          : [...prev, groupId],
      );
    },
    [],
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
                color={player.color}
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
            {updatePlayer.isError && !isEditDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Erreur lors de la modification.
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              Couleur
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                  editColor === null
                    ? "bg-accent-500 text-white"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                }`}
                onClick={() => setEditColor(null)}
                type="button"
              >
                Auto
              </button>
              {PRESET_COLORS.map((c) => (
                <button
                  aria-checked={editColor === c}
                  aria-label={c}
                  className={`size-7 rounded-full transition-shadow ${
                    editColor === c ? "ring-2 ring-accent-500 ring-offset-2" : ""
                  }`}
                  key={c}
                  onClick={() => setEditColor(c)}
                  role="radio"
                  style={{ backgroundColor: c }}
                  type="button"
                />
              ))}
              <label className="relative">
                <span className="sr-only">Couleur personnalisée</span>
                <input
                  className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  onChange={(e) => setEditColor(e.target.value)}
                  type="color"
                  value={editColor ?? "#000000"}
                />
              </label>
            </div>
          </div>
          {groups.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-secondary">
                Groupes
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => {
                  const isSelected = editGroupIds.includes(group.id);
                  return (
                    <button
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-accent-500 text-white"
                          : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                      }`}
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      type="button"
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
