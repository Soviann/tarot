import { ArrowLeft, Check, Pencil, Trash2, UserMinus, UserPlus } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PlayerSelector from "../components/PlayerSelector";
import { Modal, PlayerAvatar } from "../components/ui";
import { useCloseGroupSessions } from "../hooks/useCloseGroupSessions";
import { useDeletePlayerGroup } from "../hooks/useDeletePlayerGroup";
import { usePlayerGroup } from "../hooks/usePlayerGroup";
import { useUpdatePlayerGroup } from "../hooks/useUpdatePlayerGroup";
import { ApiError } from "../services/api";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = Number(id);
  const { group, isPending } = usePlayerGroup(groupId);
  const closeGroupSessions = useCloseGroupSessions();
  const updateGroup = useUpdatePlayerGroup();
  const deleteGroup = useDeletePlayerGroup();

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const startEditName = useCallback(() => {
    if (!group) return;
    updateGroup.reset();
    setEditName(group.name);
    setEditingName(true);
  }, [group, updateGroup]);

  const handleNameSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = editName.trim();
      if (!trimmed) return;
      updateGroup.mutate(
        { id: groupId, name: trimmed },
        { onSuccess: () => setEditingName(false) },
      );
    },
    [editName, groupId, updateGroup],
  );

  const openAddModal = useCallback(() => {
    if (!group) return;
    setSelectedPlayerIds(group.players.map((p) => p.id));
    setAddModalOpen(true);
  }, [group]);

  const handleUpdatePlayers = useCallback(() => {
    updateGroup.mutate(
      {
        id: groupId,
        players: selectedPlayerIds.map((pid) => `/api/players/${pid}`),
      },
      { onSuccess: () => setAddModalOpen(false) },
    );
  }, [groupId, selectedPlayerIds, updateGroup]);

  const handleRemovePlayer = useCallback(
    (playerId: number) => {
      if (!group) return;
      const remaining = group.players
        .filter((p) => p.id !== playerId)
        .map((p) => `/api/players/${p.id}`);
      updateGroup.mutate({ id: groupId, players: remaining });
    },
    [group, groupId, updateGroup],
  );

  const handleDelete = useCallback(() => {
    deleteGroup.mutate(groupId, {
      onSuccess: () => navigate("/groups"),
    });
  }, [deleteGroup, groupId, navigate]);

  const isNameDuplicate =
    updateGroup.isError &&
    updateGroup.error instanceof ApiError &&
    updateGroup.error.status === 422;

  if (isPending) {
    return (
      <div className="p-4 lg:p-8">
        <p className="py-8 text-center text-text-muted">Chargement…</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-4 lg:p-8">
        <p className="py-8 text-center text-text-muted">Groupe introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <header className="flex items-center gap-3">
        <button
          aria-label="Retour"
          className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary"
          onClick={() => navigate("/groups")}
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        {editingName ? (
          <form className="flex flex-1 items-center gap-2" onSubmit={handleNameSubmit}>
            <input
              className="flex-1 rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-lg font-bold text-text-primary focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              onChange={(e) => setEditName(e.target.value)}
              required
              type="text"
              value={editName}
            />
            <button
              aria-label="Valider"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full bg-accent-500 text-white transition-colors hover:bg-accent-600"
              disabled={updateGroup.isPending}
              type="submit"
            >
              <Check size={18} />
            </button>
          </form>
        ) : (
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">
              {group.name}
            </h1>
            <button
              aria-label="Modifier le nom"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary"
              onClick={startEditName}
              type="button"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
      </header>

      {isNameDuplicate && (
        <p className="text-sm text-red-500">Ce nom est déjà utilisé.</p>
      )}

      {/* Clôturer les sessions */}
      <button
        className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-700"
        disabled={closeGroupSessions.isPending}
        onClick={() => {
          if (window.confirm("Voulez-vous clôturer toutes les sessions ouvertes de ce groupe ?")) {
            closeGroupSessions.mutate(groupId);
          }
        }}
        type="button"
      >
        {closeGroupSessions.isPending ? "Clôture en cours…" : "Clôturer les sessions"}
      </button>

      {/* Membres */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">
            Membres ({group.players.length})
          </h2>
          <button
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-accent-500 transition-colors hover:bg-surface-secondary"
            onClick={openAddModal}
            type="button"
          >
            <UserPlus size={16} />
            Ajouter
          </button>
        </div>

        {group.players.length === 0 && (
          <p className="py-4 text-center text-text-muted">
            Aucun membre dans ce groupe
          </p>
        )}

        {group.players.length > 0 && (
          <ul className="flex flex-col gap-2">
            {group.players.map((player) => (
              <li
                className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3"
                key={player.id}
              >
                <PlayerAvatar color={player.color} name={player.name} playerId={player.id} />
                <p className="min-w-0 flex-1 truncate font-medium text-text-primary">
                  {player.name}
                </p>
                <button
                  aria-label={`Retirer ${player.name}`}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-red-100 hover:text-red-500"
                  disabled={updateGroup.isPending}
                  onClick={() => handleRemovePlayer(player.id)}
                  type="button"
                >
                  <UserMinus size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Supprimer le groupe */}
      <section className="pt-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 font-medium text-red-500 transition-colors hover:bg-red-50"
          onClick={() => setDeleteModalOpen(true)}
          type="button"
        >
          <Trash2 size={18} />
          Supprimer le groupe
        </button>
      </section>

      {/* Modal ajout de joueurs */}
      <Modal
        onClose={() => setAddModalOpen(false)}
        open={addModalOpen}
        title="Gérer les membres"
      >
        <div className="flex flex-col gap-4">
          <PlayerSelector
            maxPlayers={Infinity}
            onSelectionChange={setSelectedPlayerIds}
            selectedPlayerIds={selectedPlayerIds}
          />
          <button
            className="rounded-lg bg-accent-500 px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            disabled={updateGroup.isPending}
            onClick={handleUpdatePlayers}
            type="button"
          >
            Enregistrer
          </button>
        </div>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        onClose={() => setDeleteModalOpen(false)}
        open={deleteModalOpen}
        title="Supprimer le groupe"
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary">
            Supprimer le groupe <strong>{group.name}</strong> ?
            Les sessions et joueurs ne seront pas affectés.
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-lg border border-surface-border px-4 py-2 font-medium text-text-primary transition-colors hover:bg-surface-secondary"
              onClick={() => setDeleteModalOpen(false)}
              type="button"
            >
              Annuler
            </button>
            <button
              className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              disabled={deleteGroup.isPending}
              onClick={handleDelete}
              type="button"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
