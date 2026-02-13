import { Plus, Trash2, Users } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayerSelector from "../components/PlayerSelector";
import { FAB, Modal } from "../components/ui";
import { useCreatePlayerGroup } from "../hooks/useCreatePlayerGroup";
import { useDeletePlayerGroup } from "../hooks/useDeletePlayerGroup";
import { usePlayerGroups } from "../hooks/usePlayerGroups";
import { ApiError } from "../services/api";
import type { PlayerGroup } from "../types/api";

export default function Groups() {
  const navigate = useNavigate();
  const { groups, isPending } = usePlayerGroups();
  const createGroup = useCreatePlayerGroup();
  const deleteGroup = useDeletePlayerGroup();

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [deletingGroup, setDeletingGroup] = useState<PlayerGroup | null>(null);

  const openModal = useCallback(() => {
    createGroup.reset();
    setNewName("");
    setSelectedPlayerIds([]);
    setModalOpen(true);
  }, [createGroup]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = newName.trim();
      if (!trimmed) return;
      createGroup.mutate(
        {
          name: trimmed,
          players: selectedPlayerIds.map((id) => `/api/players/${id}`),
        },
        { onSuccess: () => closeModal() },
      );
    },
    [closeModal, createGroup, newName, selectedPlayerIds],
  );

  const handleDelete = useCallback(() => {
    if (!deletingGroup) return;
    deleteGroup.mutate(deletingGroup.id, {
      onSuccess: () => setDeletingGroup(null),
    });
  }, [deleteGroup, deletingGroup]);

  const isDuplicate =
    createGroup.isError &&
    createGroup.error instanceof ApiError &&
    createGroup.error.status === 422;

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Groupes</h1>
        {!isPending && (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-100 text-sm font-medium text-accent-700">
            {groups.length}
          </span>
        )}
      </header>

      {isPending && (
        <p className="py-8 text-center text-text-muted">Chargement…</p>
      )}

      {!isPending && groups.length === 0 && (
        <p className="py-8 text-center text-text-muted">
          Aucun groupe créé
        </p>
      )}

      {!isPending && groups.length > 0 && (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <li
              className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3"
              key={group.id}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-3"
                onClick={() => navigate(`/groups/${group.id}`)}
                type="button"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <Users size={20} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium text-text-primary">
                    {group.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(group.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </button>
              <button
                aria-label={`Supprimer ${group.name}`}
                className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-red-100 hover:text-red-500"
                onClick={() => setDeletingGroup(group)}
                type="button"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FAB
        aria-label="Créer un groupe"
        icon={<Plus size={24} />}
        onClick={openModal}
      />

      {/* Modal création groupe */}
      <Modal onClose={closeModal} open={modalOpen} title="Nouveau groupe">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <input
              className="w-full rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du groupe"
              required
              type="text"
              value={newName}
            />
            {isDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Ce nom est déjà utilisé.
              </p>
            )}
            {createGroup.isError && !isDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Erreur lors de la création.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              Membres du groupe
            </p>
            <PlayerSelector
              maxPlayers={Infinity}
              onSelectionChange={setSelectedPlayerIds}
              selectedPlayerIds={selectedPlayerIds}
            />
          </div>

          <button
            className="rounded-lg bg-accent-500 px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            disabled={createGroup.isPending || !newName.trim()}
            type="submit"
          >
            Créer
          </button>
        </form>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        onClose={() => setDeletingGroup(null)}
        open={deletingGroup !== null}
        title="Supprimer le groupe"
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary">
            Supprimer le groupe <strong>{deletingGroup?.name}</strong> ?
            Les sessions et joueurs ne seront pas affectés.
          </p>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-lg border border-surface-border px-4 py-2 font-medium text-text-primary transition-colors hover:bg-surface-secondary"
              onClick={() => setDeletingGroup(null)}
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
