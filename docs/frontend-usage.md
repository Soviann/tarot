# Guide d'utilisation — Composants Frontend

Ce document référence l'ensemble des composants UI, hooks et types disponibles dans le frontend.
Il doit être mis à jour à chaque ajout ou modification de composant.

## Table des matières

- [Thème et mode sombre](#thème-et-mode-sombre)
- [Types / Enums](#types--enums)
- [Hooks](#hooks)
- [Pages](#pages)
- [Composants UI](#composants-ui)
- [Utilitaire de test](#utilitaire-de-test)
- [Compatibilité TV](#compatibilité-tv)

---

## Thème et mode sombre

### Tokens de couleur

Définis dans `frontend/src/index.css` via `@theme`. Utilisables directement comme classes Tailwind :

| Catégorie | Tokens | Exemple Tailwind |
|-----------|--------|------------------|
| **Accent** | `accent-50` à `accent-900` | `bg-accent-500`, `text-accent-300` |
| **Surface** | `surface-primary`, `surface-secondary`, `surface-tertiary`, `surface-elevated`, `surface-border` | `bg-surface-primary`, `border-surface-border` |
| **Texte** | `text-primary`, `text-secondary`, `text-muted`, `text-inverse` | `text-text-primary` |
| **Score** | `score-positive`, `score-negative` | `text-score-positive` |
| **Contrat** | `contract-petite`, `contract-garde`, `contract-garde-sans`, `contract-garde-contre` | `bg-contract-garde` |
| **Avatar** | `avatar-0` à `avatar-9` | `bg-avatar-3` |

### Mode sombre

Le mode sombre est géré via la classe `.dark` sur `<html>`. Les tokens de surface, texte et score sont automatiquement redéfinis.

Le toggle est intégré dans le `Layout.tsx` (header, icône Sun/Moon de `lucide-react`). Il appelle `useTheme().toggle()`.

L'application doit être wrappée dans `<ThemeProvider>` (déjà fait dans `App.tsx`).

---

## Types / Enums

### Types API

**Fichier** : `frontend/src/types/api.ts`

Interfaces TypeScript correspondant aux réponses JSON-LD de l'API :

```ts
import type { HydraCollection, Player } from "./types/api";
```

| Type | Champs |
|------|--------|
| `CumulativeScore` | `playerId: number`, `playerName: string`, `score: number` |
| `Game` | `id`, `chelem`, `completedAt`, `contract`, `createdAt`, `dealer`, `newBadges?: Record<string, Badge[]> \| null`, `oudlers`, `partner`, `petitAuBout`, `poignee`, `poigneeOwner`, `points`, `position`, `scoreEntries`, `status`, `taker` |
| `GamePlayer` | `color: string \| null`, `id: number`, `name: string` |
| `HydraCollection<T>` | `member: T[]`, `totalItems: number` |
| `PaginatedCollection<T>` | extends `HydraCollection<T>` + `hydra:view?: { hydra:next?: string }` |
| `Player` | `active: boolean`, `color: string \| null`, `createdAt: string`, `id: number`, `lastActivityAt: string \| null`, `name: string`, `playerGroups: PlayerGroup[]` |
| `PlayerGroup` | `createdAt: string`, `id: number`, `name: string` |
| `PlayerGroupDetail` | extends `PlayerGroup` + `players: GamePlayer[]` |
| `ScoreEntry` | `id: number`, `player: GamePlayer`, `score: number` |
| `Session` | `id: number`, `createdAt: string`, `isActive: boolean`, `lastPlayedAt: string`, `playerGroup: PlayerGroup \| null`, `players: SessionPlayer[]` |
| `SessionAward` | `description: string`, `playerColor: string \| null`, `playerId: number`, `playerName: string`, `title: string` |
| `SessionDetail` | `id`, `createdAt`, `currentDealer`, `inProgressGame: Game \| null`, `isActive`, `playerGroup: PlayerGroup \| null`, `players: GamePlayer[]`, `cumulativeScores: CumulativeScore[]`, `starEvents: StarEvent[]` |
| `SessionHighlights` | `bestGame`, `duration: number`, `lastPlace`, `mostPlayedContract`, `mvp`, `totalGames: number`, `totalStars: number`, `worstGame` |
| `SessionPlayer` | `color: string \| null`, `id: number`, `name: string` |
| `SessionRankingEntry` | `playerColor: string \| null`, `playerId: number`, `playerName: string`, `position: number`, `score: number` |
| `SessionSummary` | `awards: SessionAward[]`, `highlights: SessionHighlights`, `ranking: SessionRankingEntry[]`, `scoreSpread: number` |
| `Badge` | `description: string`, `emoji: string`, `label: string`, `type: string`, `unlockedAt: string \| null` |
| `StarEvent` | `id: number`, `createdAt: string`, `newBadges?: Record<string, Badge[]> \| null`, `player: GamePlayer` |
| `ContractDistributionEntry` | `contract: Contract`, `count: number`, `percentage: number` |
| `ContractSuccessRatePlayer` | `color: string \| null`, `contracts: PlayerContractEntry[]`, `id: number`, `name: string` |
| `EloHistoryEntry` | `date: string`, `gameId: number`, `ratingAfter: number`, `ratingChange: number` |
| `EloRankingEntry` | `eloRating: number`, `gamesPlayed: number`, `playerColor: string \| null`, `playerId: number`, `playerName: string` |
| `EloEvolutionPlayer` | `history: { date: string; gameId: number; ratingAfter: number }[]`, `playerColor: string \| null`, `playerId: number`, `playerName: string` |
| `GlobalStatistics` | `averageGameDuration: number \| null`, `contractDistribution: ContractDistributionEntry[]`, `contractSuccessRateByPlayer: ContractSuccessRatePlayer[]`, `eloEvolution: EloEvolutionPlayer[]`, `eloRanking: EloRankingEntry[]`, `leaderboard: LeaderboardEntry[]`, `totalGames`, `totalPlayTime: number`, `totalSessions`, `totalStars` |
| `LeaderboardEntry` | `gamesAsTaker`, `gamesPlayed`, `playerColor: string \| null`, `playerId`, `playerName`, `totalScore`, `winRate`, `wins` |
| `PlayerContractEntry` | `contract: Contract`, `count`, `winRate`, `wins` |
| `PersonalRecord` | `contract: string \| null`, `date: string`, `sessionId: number \| null`, `type: string`, `value: number` |
| `PlayerStatistics` | `badges: Badge[]`, `averageGameDurationSeconds: number \| null`, `averageScore`, `bestGameScore`, `contractDistribution`, `eloHistory: EloHistoryEntry[]`, `eloRating: number`, `gamesAsDefender`, `gamesAsPartner`, `gamesAsTaker`, `gamesPlayed`, `player`, `playerGroups: { id: number; name: string }[]`, `records: PersonalRecord[]`, `recentScores`, `sessionsPlayed`, `starPenalties`, `totalPlayTimeSeconds: number`, `totalStars`, `winRateAsTaker`, `worstGameScore` |
| `RecentScoreEntry` | `date: string`, `gameId: number`, `score: number`, `sessionId: number` |

### `ApiError`

**Fichier** : `frontend/src/services/api.ts`

Classe d'erreur enrichie lancée par `apiFetch` quand la réponse HTTP n'est pas `ok` :

```ts
import { ApiError } from "./services/api";

try {
  await apiFetch("/players", { method: "POST", body: JSON.stringify({ name }) });
} catch (err) {
  if (err instanceof ApiError && err.status === 422) {
    console.log(err.body); // corps RFC 7807
  }
}
```

| Propriété | Type | Description |
|-----------|------|-------------|
| `status` | `number` | Code HTTP (ex. 422) |
| `body` | `unknown` | Corps de la réponse parsé en JSON |
| `message` | `string` | Message d'erreur (`"API error: 422"`) |

### Enums

**Fichier** : `frontend/src/types/enums.ts`

Miroir TypeScript des enums backend PHP. Utilisation en tant que valeur et type :

```tsx
import { Contract } from "./types/enums";
import type { Contract as ContractType } from "./types/enums";

// Comme valeur
const c = Contract.Garde; // "garde"

// Comme type
function foo(contract: ContractType) { ... }
```

| Enum | Valeurs |
|------|---------|
| `Chelem` | `AnnouncedLost`, `AnnouncedWon`, `None`, `NotAnnouncedWon` |
| `Contract` | `Garde`, `GardeContre`, `GardeSans`, `Petite` |
| `GameStatus` | `Completed`, `InProgress` |
| `Poignee` | `Double`, `None`, `Simple`, `Triple` |
| `Side` | `Attack`, `Defense`, `None` |

---

## Hooks

### `useTheme`

**Fichier** : `hooks/useTheme.ts`

```ts
const { isDark, toggle } = useTheme();
```

- `isDark` : `boolean` — état courant du thème
- `toggle()` — bascule light/dark, persiste dans `localStorage("theme")`

**Prérequis** : composant dans un `<ThemeProvider>`.

### `useToast`

**Fichier** : `hooks/useToast.ts`

```ts
const { dismiss, toast, toastError, toasts } = useToast();
```

- `toast(message)` — affiche un toast de succès (auto-dismiss 2 s)
- `toastError(message)` — affiche un toast d'erreur (auto-dismiss 3 s)
- `dismiss(id)` — ferme un toast manuellement
- `toasts` — liste des toasts actifs (`ToastItem[]`)

**Prérequis** : composant dans un `<ToastProvider>` (déjà dans `App.tsx`).

### `useAnimatedCounter`

**Fichier** : `hooks/useAnimatedCounter.ts`

Anime un compteur de 0 vers la valeur cible avec easing (`easeOutCubic`).

```ts
const displayed = useAnimatedCounter(score, {
  animated: true,   // défaut: true
  duration: 500,    // défaut: 500ms
});
```

### `usePlayers`

**Fichier** : `hooks/usePlayers.ts`

Récupère la liste des joueurs via l'API et applique un filtrage côté client.

```ts
const { isPending, players } = usePlayers(search);
```

| Retour | Type | Description |
|--------|------|-------------|
| `players` | `Player[]` | Liste filtrée (ou complète si `search` vide) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| `isSuccess` | `boolean` | `true` quand les données sont disponibles |
| …autres | — | Tous les champs de `UseQueryResult` |

### `useCreatePlayer`

**Fichier** : `hooks/useCreatePlayer.ts`

Mutation pour créer un nouveau joueur. Invalide le cache `["players"]` en cas de succès.

```ts
const createPlayer = useCreatePlayer();

createPlayer.mutate("Alice", {
  onSuccess: () => closeModal(),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(name: string) => void` | Lance la création |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur (ex. doublon 422) |
| `error` | `ApiError \| null` | Détails de l'erreur |
| `reset()` | `() => void` | Réinitialise l'état d'erreur |

### `useUpdatePlayer`

**Fichier** : `hooks/useUpdatePlayer.ts`

Mutation pour modifier un joueur (nom, statut actif, couleur, groupes). Envoie un PATCH avec `application/merge-patch+json`.
Invalide le cache `["players"]` en cas de succès.

```ts
const updatePlayer = useUpdatePlayer();

updatePlayer.mutate({ id: 1, name: "Alicia", active: false, color: "#ef4444" }, {
  onSuccess: () => closeModal(),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(input: { id: number, name?: string, active?: boolean, color?: string \| null, playerGroups?: string[] }) => void` | Lance la modification |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur (ex. doublon 422) |
| `error` | `ApiError \| null` | Détails de l'erreur |
| `reset()` | `() => void` | Réinitialise l'état d'erreur |

### `useCreateSession`

**Fichier** : `hooks/useCreateSession.ts`

Mutation pour créer (ou reprendre) une session. Convertit les IDs joueurs en IRIs API Platform.
Invalide le cache `["sessions"]` en cas de succès.

```ts
const createSession = useCreateSession();

createSession.mutate([1, 2, 3, 4, 5], {
  onSuccess: (session) => navigate(`/sessions/${session.id}`),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(playerIds: number[]) => void` | Lance la création |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useCreateGame`

**Fichier** : `hooks/useCreateGame.ts`

Mutation pour créer une nouvelle donne dans une session. Envoie un POST avec le contrat et l'IRI du preneur.
Invalide le cache `["session", sessionId]` en cas de succès.

```ts
const createGame = useCreateGame(sessionId);

createGame.mutate({ contract: "garde", takerId: 3 });
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(input: { contract: Contract, takerId: number }) => void` | Lance la création |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useCompleteGame`

**Fichier** : `hooks/useCompleteGame.ts`

Mutation pour compléter ou modifier une donne. Envoie un PATCH avec `Content-Type: application/merge-patch+json`.
Invalide le cache `["session", sessionId]` en cas de succès.

```ts
const completeGame = useCompleteGame(gameId, sessionId);

completeGame.mutate({
  chelem: "none",
  oudlers: 2,
  partnerId: 3,       // null pour self-call
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 45,
  status: "completed",
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(input: CompleteGameInput) => void` | Lance la complétion |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useDeleteGame`

**Fichier** : `hooks/useDeleteGame.ts`

Mutation pour supprimer une donne. Envoie un DELETE et invalide le cache session en cas de succès.

```ts
const deleteGame = useDeleteGame(gameId, sessionId);

deleteGame.mutate(undefined, {
  onSuccess: () => closeModal(),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `() => void` | Lance la suppression |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur (ex. pas la dernière donne 422) |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useAddStar`

**Fichier** : `hooks/useAddStar.ts`

Mutation pour ajouter une étoile à un joueur dans une session. Envoie un POST à `/sessions/{id}/star-events`.
Invalide le cache `["session", sessionId]` en cas de succès.

```ts
const addStar = useAddStar(sessionId);

addStar.mutate(playerId);
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(playerId: number) => void` | Lance l'ajout d'étoile |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur (ex. joueur pas dans la session 422) |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useUpdateDealer`

**Fichier** : `hooks/useUpdateDealer.ts`

Mutation pour changer le donneur d'une session. Envoie un PATCH à `/sessions/{id}` avec `Content-Type: application/merge-patch+json`.
Invalide le cache `["session", sessionId]` en cas de succès.

```ts
const updateDealer = useUpdateDealer(sessionId);

updateDealer.mutate(playerId, {
  onSuccess: () => closeModal(),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(playerId: number) => void` | Lance la mise à jour du donneur |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur (ex. joueur pas dans la session 422) |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useGlobalStats`

**Fichier** : `hooks/useGlobalStats.ts`

Récupère les statistiques globales (classement, répartition des contrats, totaux) via l'API. Accepte un ID de groupe optionnel pour filtrer.

```ts
const { isPending, stats } = useGlobalStats();          // toutes les sessions
const { isPending, stats } = useGlobalStats(groupId);   // sessions du groupe
```

| Retour | Type | Description |
|--------|------|-------------|
| `stats` | `GlobalStatistics \| null` | Statistiques globales (`null` pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| …autres | — | Tous les champs de `UseQueryResult` |

### `usePlayerStats`

**Fichier** : `hooks/usePlayerStats.ts`

Récupère les statistiques détaillées d'un joueur via l'API. Accepte un ID de groupe optionnel pour filtrer.

```ts
const { isPending, stats } = usePlayerStats(playerId);             // toutes les sessions
const { isPending, stats } = usePlayerStats(playerId, groupId);    // sessions du groupe
```

| Retour | Type | Description |
|--------|------|-------------|
| `stats` | `PlayerStatistics \| null` | Statistiques du joueur (`null` pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| …autres | — | Tous les champs de `UseQueryResult` |

### `useDebounce`

**Fichier** : `hooks/useDebounce.ts`

Retourne une valeur retardée qui ne se met à jour qu'après un délai sans changement.

```ts
const debouncedQuery = useDebounce(searchQuery, 300);
```

### `useSessionGames`

**Fichier** : `hooks/useSessionGames.ts`

Récupère les donnes terminées d'une session avec pagination infinie (10 par page, triées par position décroissante).

```ts
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSessionGames(sessionId);
const allGames = data?.pages.flatMap(p => p.member) ?? [];
```

| Retour | Type | Description |
|--------|------|-------------|
| `data` | `InfiniteData<PaginatedCollection<Game>>` | Pages de donnes chargées |
| `hasNextPage` | `boolean` | `true` s'il reste des pages à charger |
| `fetchNextPage` | `() => void` | Charge la page suivante |
| `isFetchingNextPage` | `boolean` | `true` pendant le chargement de la page suivante |
| …autres | — | Tous les champs de `UseInfiniteQueryResult` |

**Query key** : `["session", sessionId, "games"]` — invalidé automatiquement par prefix matching quand `["session", sessionId]` est invalidé par les mutations existantes.

### `useCloseGroupSessions`

**Fichier** : `hooks/useCloseGroupSessions.ts`

Mutation pour clôturer toutes les sessions ouvertes d'un groupe de joueurs. Invalide le cache `["sessions"]`.

```ts
const closeGroupSessions = useCloseGroupSessions();

closeGroupSessions.mutate(groupId);
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(groupId: number) => void` | Lance la clôture en masse |
| `isPending` | `boolean` | `true` pendant la requête |

### `useCloseSession`

**Fichier** : `hooks/useCloseSession.ts`

Mutation pour clôturer ou réouvrir une session (PATCH `isActive`). Invalide les caches `["session", id]` et `["sessions"]`.

```ts
const closeSession = useCloseSession(sessionId);

closeSession.mutate(false); // clôturer
closeSession.mutate(true);  // réouvrir
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(isActive: boolean) => void` | Lance la modification |
| `isPending` | `boolean` | `true` pendant la requête |

### `useSession`

**Fichier** : `hooks/useSession.ts`

Récupère le détail d'une session (joueurs, scores cumulés, donne en cours) via l'API.

```ts
const { isPending, session } = useSession(sessionId);
```

| Retour | Type | Description |
|--------|------|-------------|
| `session` | `SessionDetail \| null` | Détail de la session (`null` pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| `isSuccess` | `boolean` | `true` quand les données sont disponibles |
| …autres | — | Tous les champs de `UseQueryResult` |

### `useSessions`

**Fichier** : `hooks/useSessions.ts`

Récupère la liste des sessions via l'API.

```ts
const { isPending, sessions } = useSessions();
```

| Retour | Type | Description |
|--------|------|-------------|
| `sessions` | `Session[]` | Liste des sessions (vide pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| `isSuccess` | `boolean` | `true` quand les données sont disponibles |
| …autres | — | Tous les champs de `UseQueryResult` |

### `useSessionSummary`

**Fichier** : `hooks/useSessionSummary.ts`

Récupère le récapitulatif d'une session (classement, faits marquants, titres humoristiques) via l'endpoint `GET /api/sessions/{id}/summary`.

```ts
const { data, isPending } = useSessionSummary(sessionId);
```

| Retour | Type | Description |
|--------|------|-------------|
| `data` | `SessionSummary \| undefined` | Récapitulatif complet (ranking, highlights, awards) |
| `isPending` | `boolean` | `true` pendant le chargement |
| …autres | — | Tous les champs de `UseQueryResult` |

### `usePlayerGroups`

**Fichier** : `hooks/usePlayerGroups.ts`

Récupère la liste des groupes de joueurs via l'API.

```ts
const { groups, isPending } = usePlayerGroups();
```

| Retour | Type | Description |
|--------|------|-------------|
| `groups` | `PlayerGroup[]` | Liste des groupes (vide pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |

### `usePlayerGroup`

**Fichier** : `hooks/usePlayerGroup.ts`

Récupère le détail d'un groupe (avec la liste des joueurs membres).

```ts
const { group, isPending } = usePlayerGroup(groupId);
```

| Retour | Type | Description |
|--------|------|-------------|
| `group` | `PlayerGroupDetail \| null` | Détail du groupe (`null` pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |

### `useCreatePlayerGroup`

**Fichier** : `hooks/useCreatePlayerGroup.ts`

Mutation pour créer un groupe. Invalide les caches `["playerGroups"]` et `["players"]`.

```ts
const create = useCreatePlayerGroup();
create.mutate({ name: "Soirée du mardi", playerIds: [1, 2, 3] });
```

### `useUpdatePlayerGroup`

**Fichier** : `hooks/useUpdatePlayerGroup.ts`

Mutation pour modifier un groupe (nom et/ou membres). Envoie un PATCH.
Invalide les caches `["playerGroups"]`, `["playerGroup", id]` et `["players"]`.

```ts
const update = useUpdatePlayerGroup();
update.mutate({ id: 1, name: "Nouveau nom", playerIds: [1, 2, 3, 4] });
```

### `useDeletePlayerGroup`

**Fichier** : `hooks/useDeletePlayerGroup.ts`

Mutation pour supprimer un groupe. Invalide les caches `["playerGroups"]` et `["players"]`.

```ts
const remove = useDeletePlayerGroup();
remove.mutate(groupId);
```

### `useUpdateSessionGroup`

**Fichier** : `hooks/useUpdateSessionGroup.ts`

Mutation pour changer le groupe d'une session. Envoie un PATCH. Invalide le cache session et `["sessions"]`.

```ts
const updateGroup = useUpdateSessionGroup(sessionId);
updateGroup.mutate(groupId);     // assigner un groupe
updateGroup.mutate(null);        // retirer le groupe
```

---

## Pages

### Accueil (`Home`)

**Fichier** : `pages/Home.tsx`

Écran principal : sessions récentes en haut, sélection de joueurs en bas (zone du pouce).

**Fonctionnalités** :
- Sessions récentes (`SessionList`) affichées en premier pour un accès rapide
- Sélection de 5 joueurs via `PlayerSelector` (composant contrôlé)
- Bouton « Démarrer la session » intégré dans `PlayerSelector` (apparaît quand 5 joueurs sélectionnés, remplace la barre de recherche)
- Redirection vers `/sessions/:id` après création
- Message d'erreur si la création échoue

**Hooks utilisés** : `useCreateSession`, `useNavigate`

### Aide (`Help`)

**Fichier** : `pages/Help.tsx`

Page d'aide in-app reprenant le contenu du guide utilisateur (`docs/user-guide.md`).

**Route** : `/aide`

**Fonctionnalités** :
- Section « Installation » toujours visible
- 13 sections en accordéon dépliable (`AccordionSection`, composant local) dont une section « Badges » listant les 15 badges par catégorie (données statiques dans `BADGE_CATEGORIES`)
- Lien vers le dépôt GitHub en bas de page
- Bouton retour vers l'accueil
- Accessible via l'icône `CircleHelp` sur la page d'accueil (`Home.tsx`), à droite du titre « Sessions récentes »

**Hooks utilisés** : aucun (contenu statique)

### Joueurs (`Players`)

**Fichier** : `pages/Players.tsx`

Écran de gestion des joueurs : liste, recherche, ajout, modification et désactivation.

**Fonctionnalités** :
- Liste tous les joueurs avec avatar et date de création
- Recherche par nom (filtrage côté client via `SearchInput`)
- Bouton FAB (+) pour ouvrir le formulaire d'ajout
- Formulaire dans un `Modal` avec validation (doublon → message d'erreur)
- Bouton crayon (✏️) sur chaque joueur pour ouvrir la modale de modification
- Modale de modification : champ nom pré-rempli + sélecteur de couleur (Auto / 10 presets / color picker) + attribution de groupes + toggle actif/inactif + bouton « Enregistrer »
- Joueurs inactifs : nom barré (`line-through`), badge « Inactif », avatar grisé (`opacity-50`)
- États : chargement, liste vide, résultats

**Hooks utilisés** : `usePlayers`, `useCreatePlayer`, `useUpdatePlayer`

### Groupes (`Groups`)

**Fichier** : `pages/Groups.tsx`

Écran de gestion des groupes de joueurs : liste, création et suppression.

**Route** : `/groups`

**Fonctionnalités** :
- Liste des groupes avec nombre de membres
- Bouton FAB (+) pour créer un groupe (modale avec nom + `PlayerSelector` sans limite de joueurs)
- Suppression avec confirmation
- Navigation vers `/groups/:id` au clic

**Hooks utilisés** : `usePlayerGroups`, `useCreatePlayerGroup`, `useDeletePlayerGroup`, `useNavigate`

### Détail d'un groupe (`GroupDetail`)

**Fichier** : `pages/GroupDetail.tsx`

Écran de détail et modification d'un groupe.

**Route** : `/groups/:id`

**Fonctionnalités** :
- Modification du nom inline (bouton crayon)
- Liste des membres avec avatar et bouton de retrait
- Ajout de membres via modale `PlayerSelector`
- Clôture des sessions ouvertes du groupe avec modale de confirmation
- Suppression du groupe avec confirmation
- Bouton retour vers `/groups`

**Hooks utilisés** : `usePlayerGroup`, `useUpdatePlayerGroup`, `useDeletePlayerGroup`, `useNavigate`

### Statistiques globales (`Stats`)

**Fichier** : `pages/Stats.tsx`

Écran de statistiques globales avec classement, métriques et répartition des contrats.

**Route** : `/stats`

**Fonctionnalités** :
- Filtre par groupe (`GroupFilter`) — filtre toutes les statistiques par groupe de joueurs
- Métriques clés : total de donnes, de sessions, durée moyenne par donne et temps de jeu total (si disponible)
- Classement (`Leaderboard`) trié par score total décroissant
- **Menu déroulant de section** : les sections détaillées sont accessibles via un `<select>` (une seule visible à la fois) — Classement ELO, Évolution ELO, Répartition des contrats, Taux de réussite par contrat
- Navigation vers le détail d'un joueur au clic (propage le filtre groupe via `?group=`)
- États : chargement, erreur

**Hooks utilisés** : `useGlobalStats`, `usePlayerGroups` (via `GroupFilter`), `useNavigate`

### Statistiques joueur (`PlayerStats`)

**Fichier** : `pages/PlayerStats.tsx`

Écran de statistiques détaillées d'un joueur.

**Route** : `/stats/player/:id`

**Fonctionnalités** :
- Avatar, nom du joueur
- Filtre par groupe (`GroupFilter`) — filtre les statistiques par groupe (initialisation depuis `?group=`)
- Métriques clés : donnes jouées, taux de victoire, score moyen, ELO, sessions, durée moyenne par donne et temps de jeu total (si disponible)
- Groupes du joueur : badges cliquables renvoyant vers `/groups/:id`
- **Menu déroulant de section** : les sections détaillées sont accessibles via un `<select>` (une seule visible à la fois) — Records personnels, Badges, Répartition des rôles, Contrats, Évolution des scores, Évolution ELO
- Bouton retour vers `/stats`
- États : chargement, joueur introuvable

**Hooks utilisés** : `usePlayerStats`, `usePlayerGroups` (via `GroupFilter`), `useNavigate`

### Session (`SessionPage`)

**Fichier** : `pages/SessionPage.tsx`

Écran principal de suivi d'une session de Tarot : tableau des scores, donne en cours, historique.

**Route** : `/sessions/:id`

**Fonctionnalités** :
- Tableau des scores cumulés (composant `Scoreboard`) avec avatars et scores colorés
- Graphique d'évolution des scores (`ScoreEvolutionChart`) visible quand ≥ 2 donnes terminées (basé sur les donnes chargées)
- Bandeau « donne en cours » (`InProgressBanner`) si `session.inProgressGame` est non nul
- Historique des donnes terminées (`GameList`) paginé côté serveur (10 par page, bouton « Voir plus »)
- Bouton FAB (+) pour démarrer une nouvelle donne (désactivé si donne en cours)
- Menu overflow (`OverflowMenu`) regroupant : récap, partage QR, changement de joueurs, changement de groupe, clôture/réouverture de session
- Bandeau « Session terminée » (ambre) quand `isActive === false`
- FAB masqué quand la session est clôturée
- Bouton retour vers l'accueil
- États : chargement, session introuvable

**Hooks utilisés** : `useSession`, `useSessionGames`, `useAddStar`, `useCloseSession`, `useCreateGame`, `useCreateSession` (via SwapPlayersModal), `useCompleteGame`, `useDeleteGame`, `usePlayerGroups`, `useUpdateDealer`, `useUpdateSessionGroup`, `useNavigate`

**Modales** :
- `AddStarModal` : confirmation avant attribution d'étoile à un joueur
- `BadgeUnlockedModal` : annonce des badges débloqués (après complétion de donne ou ajout d'étoile)
- `ChangeDealerModal` : sélection manuelle du donneur parmi les 5 joueurs
- `ChangeGroupModal` : sélection du groupe pour la session (visible uniquement si des groupes existent)
- `CompleteGameModal` : complétion ou modification d'une donne (étape 2)
- `DeleteGameModal` : confirmation de suppression de la dernière donne
- Modale de confirmation de clôture de session (inline `<Modal>`)
- `NewGameModal` : sélection preneur + contrat (étape 1)
- `ShareQrCodeModal` : affichage d'un QR code encodant l'URL de la session avec mode plein écran
- `SwapPlayersModal` : changement de joueurs avec navigation vers la session résultante

### Récapitulatif de session (`SessionSummary`)

**Fichier** : `pages/SessionSummary.tsx`

Écran récapitulatif visuel d'une session, optimisé pour le screenshot et le partage.

**Route** : `/sessions/:id/summary`

**Fonctionnalités** :
- Podium des 3 premiers (médailles or/argent/bronze, avatars colorés)
- Classement complet des 5 joueurs avec scores colorés
- Grille de faits marquants (MVP, Lanterne rouge, Meilleure/Pire donne, Contrat favori, Durée, Donnes, Étoiles)
- Titres humoristiques (Le Boucher, L'Éternel Défenseur, Le Flambeur) — visibles à partir de 3 donnes
- Partage en image via `html-to-image` + Web Share API (fallback : téléchargement PNG)
- Lien retour vers la session

**Hooks utilisés** : `useSessionSummary`

---

## Composants métier

### `BadgeGrid`

**Fichier** : `components/BadgeGrid.tsx`

Grille affichant les badges d'un joueur. Seuls les badges débloqués sont visibles par défaut ; un bouton toggle permet de révéler/masquer les badges verrouillés. Titre avec compteur (X/Y).

| Prop | Type | Description |
|------|------|-------------|
| `badges` | `Badge[]` | *requis* — liste des 15 badges (avec `unlockedAt` null ou date) |

**Fonctionnalités** :
- Header « Badges (X/Y) » avec compteur débloqués/total
- Grille 3 colonnes mobile, 5 colonnes TV (`grid-cols-3 lg:grid-cols-5`)
- Badges débloqués : fond élevé, emoji + nom + date au format `fr-FR`
- Badges verrouillés masqués par défaut ; bouton « Voir les X restants » / « Masquer les badges verrouillés » pour toggle
- Badges verrouillés (quand révélés) : fond secondaire, `opacity-40`

### `BadgeUnlockedModal`

**Fichier** : `components/BadgeUnlockedModal.tsx`

Modale annonçant les badges nouvellement débloqués, groupés par joueur.

| Prop | Type | Description |
|------|------|-------------|
| `newBadges` | `Record<string, Badge[]>` | *requis* — nouveaux badges par ID joueur |
| `onClose` | `() => void` | *requis* — fermeture |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `players` | `GamePlayer[]` | *requis* — joueurs de la session (pour résoudre noms/avatars) |

**Fonctionnalités** :
- Titre « Nouveau(x) badge(s) débloqué(s) ! »
- Pour chaque joueur : avatar + nom, puis liste des badges (emoji + nom + description)
- Bouton « Fermer »
- Retourne `null` si aucun badge dans `newBadges`

### `PlayerSelector`

**Fichier** : `components/PlayerSelector.tsx`

Composant de sélection de joueurs avec limite configurable. Inclut chips, recherche et création inline.

| Prop | Type | Description |
|------|------|-------------|
| `selectedPlayerIds` | `number[]` | *requis* — IDs des joueurs sélectionnés |
| `onSelectionChange` | `(ids: number[]) => void` | *requis* — callback de changement |
| `onStart` | `() => void` | *optionnel* — callback de démarrage (affiche le bouton « Démarrer la session » quand max atteint) |
| `isPending` | `boolean` | *optionnel* — désactive le bouton de démarrage pendant la mutation |
| `maxPlayers` | `number` | *optionnel* — limite de joueurs sélectionnables (défaut : 5). Passer `Infinity` pour pas de limite (utilisé par les groupes). |

**Fonctionnalités** :
- Chips en haut avec avatar + nom des joueurs sélectionnés (clic = déselection)
- Placeholders ronds pour les places restantes (masqués si `maxPlayers` est `Infinity`)
- Compteur « X/N joueurs sélectionnés » (masqué si `maxPlayers` est `Infinity`)
- `SearchInput` pour rechercher des joueurs — la liste n'apparaît que lorsqu'un terme de recherche est saisi
- Quand 5 joueurs sont sélectionnés et `onStart` est fourni : la barre de recherche est remplacée par un bouton « Démarrer la session »
- Filtre les joueurs inactifs de la liste de sélection (seuls les joueurs actifs sont sélectionnables)
- Les joueurs déjà sélectionnés restent affichés en chips même s'ils sont inactifs
- Liste des joueurs (visible uniquement pendant une recherche) : clic = toggle sélection, `ring-2 ring-accent-500` si sélectionné
- Joueurs non sélectionnés grisés et désactivés quand 5 sont déjà choisis
- Bouton « + Nouveau joueur » ouvrant un `Modal` de création
- Pré-remplissage du nom avec le texte de recherche à l'ouverture de la modale
- Auto-sélection du joueur créé si < 5
- **Navigation clavier** : ↑/↓ pour parcourir la liste, Entrée pour sélectionner, Échap pour fermer
- **Accessibilité ARIA** : pattern combobox (`role="combobox"` sur l'input, `role="listbox"`/`role="option"` sur la liste, `aria-activedescendant`, `aria-expanded`)

**Hooks utilisés** : `usePlayers`, `useCreatePlayer`

### `SessionList`

**Fichier** : `components/SessionList.tsx`

Liste des sessions récentes sous forme de cartes cliquables.

**Fonctionnalités** :
- Chaque carte : 5 avatars des joueurs (`PlayerAvatar`), date relative de la dernière donne (`formatRelativeDate`), badge « En cours » si `isActive`
- Dates relatives : « Aujourd'hui », « Hier », « Il y a X jours » (2-7), puis date absolue
- Limitation à 5 sessions affichées, bouton « Voir les N sessions » pour étendre
- État vide : message aléatoire engageant avec icône (messages exportés via `EMPTY_STATE_MESSAGES`)
- Lien vers `/sessions/:id`
- États : chargement, vide, liste

**Hooks utilisés** : `useSessions`

### `Scoreboard`

**Fichier** : `components/Scoreboard.tsx`

Bandeau horizontal scrollable affichant les 5 joueurs avec avatar, nom, score cumulé et étoiles. Un icône de cartes est affiché sur l'avatar du donneur actuel.

| Prop | Type | Description |
|------|------|-------------|
| `addStarPending` | `boolean?` | Désactiver les boutons étoile pendant la mutation |
| `cumulativeScores` | `CumulativeScore[]` | *requis* — scores cumulés par joueur |
| `currentDealerId` | `number \| null` | *optionnel* — ID du donneur actuel (icône de cartes) |
| `onAddStar` | `(playerId: number) => void` | *optionnel* — callback pour ajouter une étoile (affiche les boutons si fourni) |
| `onDealerChange` | `() => void` | *optionnel* — callback pour changer le donneur (rend le badge donneur cliquable si fourni) |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |
| `starEvents` | `StarEvent[]?` | Événements étoile pour calculer le compteur par joueur |

### `InProgressBanner`

**Fichier** : `components/InProgressBanner.tsx`

Bandeau pour une donne en cours, affichant le preneur, le contrat, un chronomètre en temps réel (temps écoulé depuis `createdAt`), un bouton « Compléter » et un bouton optionnel « Annuler ». Le chronomètre utilise le hook interne `useElapsedTime`.

| Prop | Type | Description |
|------|------|-------------|
| `game` | `Game` | *requis* — la donne en cours |
| `onCancel` | `() => void` | *optionnel* — action au clic sur « Annuler » (suppression). Le bouton n'apparaît que si fourni. |
| `onComplete` | `() => void` | *requis* — action au clic sur « Compléter » |

### `GameList`

**Fichier** : `components/GameList.tsx`

Liste des donnes terminées en ordre anti-chronologique (position décroissante).

| Prop | Type | Description |
|------|------|-------------|
| `games` | `Game[]` | *requis* — donnes terminées (triées par position DESC depuis l'API) |
| `hasNextPage` | `boolean` | *requis* — `true` s'il reste des pages à charger |
| `isFetchingNextPage` | `boolean` | *requis* — `true` pendant le chargement de la page suivante |
| `onDeleteLast` | `() => void` | *requis* — action pour supprimer la dernière donne |
| `onEditLast` | `() => void` | *requis* — action pour modifier la dernière donne |
| `onLoadMore` | `() => void` | *requis* — action pour charger la page suivante |

**Fonctionnalités** :
- Chaque carte : avatar preneur, nom, badge contrat, durée de la donne (si `completedAt` disponible), « avec [partenaire] » ou « Seul », donneur, score du preneur
- Boutons « Modifier » et « Supprimer » uniquement sur la dernière donne (position la plus élevée)
- Bouton « Voir plus » quand `hasNextPage` est vrai, affichant « Chargement… » pendant le fetch
- État vide : « Aucune donne jouée »

### `ChangeDealerModal`

**Fichier** : `components/ChangeDealerModal.tsx`

Modal de sélection manuelle du donneur parmi les joueurs de la session.

| Prop | Type | Description |
|------|------|-------------|
| `currentDealerId` | `number` | *requis* — ID du donneur actuel (pré-sélectionné) |
| `isPending` | `boolean?` | Désactiver le bouton Valider pendant la mutation |
| `onClose` | `() => void` | *requis* — fermeture |
| `onConfirm` | `(playerId: number) => void` | *requis* — callback avec l'ID du nouveau donneur |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |

**Fonctionnalités** :
- 5 avatars cliquables avec highlight `ring-2 ring-accent-500` sur la sélection
- Donneur actuel pré-sélectionné
- Bouton Valider désactivé si le même donneur est sélectionné ou si `isPending`
- Affichage du nom du joueur sélectionné

### `AddStarModal`

**Fichier** : `components/AddStarModal.tsx`

Modal de confirmation avant d'attribuer une étoile à un joueur. Composant présentationnel (pas de hook interne).

| Prop | Type | Description |
|------|------|-------------|
| `errorMessage` | `string?` | Message d'erreur à afficher |
| `isError` | `boolean` | *requis* — afficher l'erreur |
| `isPending` | `boolean` | *requis* — désactiver le bouton Confirmer pendant la mutation |
| `onClose` | `() => void` | *requis* — fermeture |
| `onConfirm` | `() => void` | *requis* — confirmation de l'attribution |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `playerName` | `string` | *requis* — nom du joueur concerné |

**Fonctionnalités** :
- Message de confirmation avec le nom du joueur
- Bouton « Annuler » (ferme la modal) et « Confirmer » (couleur accent, non destructif)
- Bouton « Confirmer » désactivé pendant la mutation
- Affichage d'erreur si la mutation échoue

### `ShareQrCodeModal`

**Fichier** : `components/ShareQrCodeModal.tsx`

Modal affichant un QR code encodant l'URL de la session pour partage facile.

| Prop | Type | Description |
|------|------|-------------|
| `onClose` | `() => void` | *requis* — fermeture |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `sessionId` | `number` | *requis* — ID de la session |

**Fonctionnalités** :
- QR code SVG généré via `qrcode.react` (taille 200px dans la modal)
- URL affichée en texte sous le QR code
- Bouton « Plein écran » pour afficher le QR code en overlay plein écran sur fond blanc
- Fermeture du plein écran via bouton ✕ en haut à droite
- Réinitialise l'état plein écran à la fermeture de la modal

**Dépendances** : `qrcode.react`

### `DeleteGameModal`

**Fichier** : `components/DeleteGameModal.tsx`

Modal de confirmation de suppression d'une donne. Appelle `useDeleteGame` en interne.

| Prop | Type | Description |
|------|------|-------------|
| `game` | `Game` | *requis* — donne à supprimer |
| `onClose` | `() => void` | *requis* — fermeture |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `sessionId` | `number` | *requis* — ID de la session |

**Fonctionnalités** :
- Message de confirmation
- Bouton « Annuler » (ferme la modal) et « Supprimer » (lance la suppression)
- Bouton « Supprimer » désactivé pendant la suppression
- Affichage d'erreur si la suppression échoue

### `SwapPlayersModal`

**Fichier** : `components/SwapPlayersModal.tsx`

Modal de changement de joueurs depuis une session en cours. Réutilise `PlayerSelector` et `useCreateSession`.

| Prop | Type | Description |
|------|------|-------------|
| `currentPlayerIds` | `number[]` | *requis* — IDs des 5 joueurs actuels (pré-sélection) |
| `onClose` | `() => void` | *requis* — fermeture |
| `onSwap` | `(session: Session) => void` | *requis* — callback avec la session créée/retrouvée |
| `open` | `boolean` | *requis* — afficher ou masquer |

**Fonctionnalités** :
- Pré-remplit le `PlayerSelector` avec les joueurs actuels
- Texte explicatif sur le comportement de reprise de session
- Bouton « Confirmer » désactivé si ≠ 5 joueurs ou mutation en cours
- Appelle `useCreateSession` (find-or-create) au clic sur Confirmer
- Reset automatique de la sélection et de l'état d'erreur à l'ouverture
- Affichage d'erreur si la mutation échoue

### `GroupFilter`

**Fichier** : `components/GroupFilter.tsx`

Sélecteur de groupe partagé pour filtrer les statistiques. Utilise le composant `Select` (variant `compact`). Retourne `null` si aucun groupe n'existe.

| Prop | Type | Description |
|------|------|-------------|
| `onChange` | `(groupId: number \| null) => void` | *requis* — callback de changement |
| `value` | `number \| null` | *requis* — ID du groupe sélectionné (`null` = tous) |

**Hooks utilisés** : `usePlayerGroups`

### `ChangeGroupModal`

**Fichier** : `components/ChangeGroupModal.tsx`

Modale de sélection du groupe pour une session. Affiche la liste des groupes existants et l'option « Aucun groupe ». Le groupe actuel est mis en surbrillance.

| Prop | Type | Description |
|------|------|-------------|
| `currentGroupId` | `number \| null` | *requis* — ID du groupe actuel |
| `groups` | `PlayerGroup[]` | *requis* — liste des groupes disponibles |
| `isPending` | `boolean` | *requis* — désactive les boutons pendant la mutation |
| `onClose` | `() => void` | *requis* — fermeture de la modale |
| `onConfirm` | `(groupId: number \| null) => void` | *requis* — appelé avec l'ID sélectionné |
| `open` | `boolean` | *requis* — visibilité |

### `NewGameModal`

**Fichier** : `components/NewGameModal.tsx`

Modal de création de donne (étape 1) : sélection du preneur et du contrat. Affiche le donneur actuel en haut de la modale.

| Prop | Type | Description |
|------|------|-------------|
| `createGame` | `ReturnType<typeof useCreateGame>` | *requis* — mutation hook |
| `currentDealerName` | `string \| null` | *requis* — nom du donneur actuel (affiché en info) |
| `lastGameConfig` | `{ contract: Contract; takerId: number }?` | *optionnel* — config de la dernière donne (preneur + contrat) pour le raccourci « Même config » |
| `onClose` | `() => void` | *requis* — fermeture |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |

**Fonctionnalités** :
- Affichage du donneur actuel en haut de la modale
- Bouton **« Même config »** (visible si `lastGameConfig` fourni) : pré-remplit le preneur et le contrat de la dernière donne
- Sélection du preneur via avatars avec highlight `ring-2`
- 4 boutons contrat colorés en grille 2×2
- Reset automatique à l'ouverture
- Bouton Valider désactivé tant que preneur et contrat ne sont pas sélectionnés

### `CompleteGameModal`

**Fichier** : `components/CompleteGameModal.tsx`

Modal de complétion (étape 2) ou modification d'une donne. Titre dynamique selon le statut.

| Prop | Type | Description |
|------|------|-------------|
| `game` | `Game` | *requis* — donne à compléter/modifier |
| `onBadgesUnlocked` | `(newBadges: Record<string, Badge[]>) => void` | *optionnel* — callback appelé quand des badges sont débloqués par la complétion |
| `onClose` | `() => void` | *requis* — fermeture |
| `onGameCompleted` | `(ctx: GameContext) => void` | *optionnel* — callback pour déclencher un mème après une complétion réussie (pas en édition) |
| `onGameSaved` | `(gameId: number) => void` | *optionnel* — callback appelé après la complétion réussie d'une nouvelle donne (pas en édition), avec l'ID de la donne sauvegardée. Utilisé par SessionPage pour afficher le bouton UndoFAB. |
| `open` | `boolean` | *requis* — afficher ou masquer |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |
| `sessionId` | `number` | *requis* — ID de la session |

**Fonctionnalités** :
- Bandeau info preneur + contrat (lecture seule)
- Sélection partenaire ou « Seul » (self-call)
- Stepper oudlers (0-3) avec indication points requis
- Saisie points avec inputMode numérique
- Section bonus repliable (poignée, petit au bout, chelem)
- Aperçu des scores en temps réel via `calculateScore`
- Pré-remplissage automatique en mode édition (donne complétée)
- Callback `onGameCompleted` appelé uniquement lors de la première complétion (pas en mode édition), avec le contexte complet (victoire ou défaite)

### `MemeOverlay`

**Fichier** : `components/MemeOverlay.tsx`

Overlay plein écran affichant un mème (victoire ou défaite) avec animation pop-in. Se ferme automatiquement après 3 secondes ou au clic.

| Prop | Type | Description |
|------|------|-------------|
| `ariaLabel` | `string` | *optionnel* — libellé accessible (défaut : `"Mème"`) |
| `meme` | `MemeConfig \| null` | *requis* — mème à afficher (`null` = rien) |
| `onDismiss` | `() => void` | *requis* — callback de fermeture |

**Détails** :
- Utilise `createPortal` vers `document.body` (au-dessus des modales, `z-60`)
- Animation CSS `meme-pop-in` (scale + opacity, cubic-bezier bounce)
- Image centrée + légende en bas
- Accessible : `role="dialog"`, `aria-label` dynamique

### `Leaderboard`

**Fichier** : `components/Leaderboard.tsx`

Liste classée des joueurs avec rang, avatar, nom, score total, nombre de donnes et taux de victoire.

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `LeaderboardEntry[]` | *requis* — classement trié par score décroissant |
| `onPlayerClick` | `(id: number) => void` | *requis* — callback au clic sur un joueur |

### `ContractDistributionChart`

**Fichier** : `components/ContractDistributionChart.tsx`

Graphique à barres horizontales (Recharts) affichant la répartition des contrats.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `ContractDistributionEntry[]` | *requis* — données de répartition |

### `ContractSuccessRateTable`

**Fichier** : `components/ContractSuccessRateTable.tsx`

Tableau croisé joueurs × contrats. Affiche le taux de réussite (%) et le nombre de donnes pour chaque joueur en tant que preneur, par type de contrat. Cellules colorées selon le taux (vert ≥ 70%, orange 30-49%, rouge < 30%).

| Prop | Type | Description |
|------|------|-------------|
| `data` | `ContractSuccessRatePlayer[]` | *requis* — données par joueur |

### `PersonalRecords`

**Fichier** : `components/PersonalRecords.tsx`

Affiche les records personnels d'un joueur sous forme de cartes (meilleur score, pire score, série de victoires, meilleure session, plus grand écart). Chaque record affiche l'icône, le libellé, la valeur formatée, la date, le contrat (badge) et un lien vers la session.

| Prop | Type | Description |
|------|------|-------------|
| `records` | `PersonalRecord[]` | *requis* — liste des records du joueur |

**Fonctionnalités** :
- Ordre d'affichage fixe : meilleur score → pire score → série de victoires → meilleure session → plus grand écart
- Formatage spécifique par type : signe moins typographique (U+2212) pour le pire score, « X donnes » pour la série, « X pts » pour l'écart
- Badge contrat (`ContractBadge`) si le record est lié à un contrat
- Lien « Voir » vers la session si `sessionId` est présent
- Retourne `null` si la liste est vide

### `ScoreTrendChart`

**Fichier** : `components/ScoreTrendChart.tsx`

Graphique linéaire (Recharts) affichant l'évolution des scores récents d'un joueur avec ligne de référence y=0.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `RecentScoreEntry[]` | *requis* — scores récents (ordre chronologique inversé depuis l'API, le composant les remet en ordre) |

### `EloRanking`

**Fichier** : `components/EloRanking.tsx`

Liste classée des joueurs par rating ELO, avec rang, avatar, nom et rating coloré (vert > 1500, rouge < 1500).

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `EloRankingEntry[]` | *requis* — classement trié par rating décroissant |
| `onPlayerClick` | `(id: number) => void` | *requis* — callback au clic sur un joueur |

### `EloEvolutionChart`

**Fichier** : `components/EloEvolutionChart.tsx`

Graphique linéaire (Recharts) affichant l'évolution du rating ELO d'un joueur avec ligne de référence y=1500 et tooltip montrant le delta.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `EloHistoryEntry[]` | *requis* — historique ELO (ordre chronologique depuis l'API) |

### `GlobalEloEvolutionChart`

**Fichier** : `components/GlobalEloEvolutionChart.tsx`

Graphique linéaire multi-joueurs (Recharts) affichant l'évolution du rating ELO de tous les joueurs avec ligne de référence y=1500, filtrage par joueur via un **menu déroulant** avec indicateurs de couleur et `connectNulls` pour les joueurs absents de certaines donnes.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `EloEvolutionPlayer[]` | *requis* — données d'évolution par joueur (depuis l'API globale) |

**Fonctionnalités** :
- Menu déroulant « Joueurs » avec indicateurs de couleur — clic pour masquer/afficher la ligne
- Couleur personnalisée du joueur (si définie), sinon fallback sur la palette avatar
- Tooltip montrant les ratings de tous les joueurs visibles
- Ligne de référence à y=1500

**Fonction utilitaire exportée** : `buildChartData(data)` — transforme les données par joueur en format plat pour Recharts (une entrée par donne, clé par nom de joueur, `null` pour les joueurs absents).

### `ScoreEvolutionChart`

**Fichier** : `components/ScoreEvolutionChart.tsx`

Graphique linéaire (Recharts) affichant l'évolution des scores cumulés de tous les joueurs au fil des donnes. Une ligne par joueur, colorée par couleur d'avatar personnalisée (ou couleur par défaut basée sur `playerId % 10`). Des **chips colorées** au-dessus du graphique permettent de masquer/afficher chaque joueur individuellement.

| Prop | Type | Description |
|------|------|-------------|
| `games` | `Game[]` | *requis* — donnes terminées chargées (le graphique s'enrichit au fur et à mesure des « Voir plus ») |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |

**Fonction utilitaire exportée** : `computeScoreEvolution(games, players)` — calcule les scores cumulés par position de donne.

---

## Services

### `formatDuration`

**Fichier** : `utils/formatDuration.ts`

Formate une durée en secondes en texte lisible français.

```ts
import { formatDuration } from "./utils/formatDuration";

formatDuration(0);     // "0s"
formatDuration(65);    // "1min 5s"
formatDuration(120);   // "2min"
formatDuration(3661);  // "1h 1min"
formatDuration(7200);  // "2h"
```

| Plage | Format |
|-------|--------|
| < 60s | `Xs` |
| ≥ 60s et < 1h | `Xmin` ou `Xmin Xs` |
| ≥ 1h | `Xh` ou `Xh Xmin` |

### `calculateScore`

**Fichier** : `services/scoreCalculator.ts`

Miroir frontend du `ScoreCalculator` backend. Calcule les scores d'une donne en temps réel pour l'aperçu.

```ts
import { calculateScore } from "./services/scoreCalculator";

const result = calculateScore({
  chelem: "none",
  contract: "garde",
  oudlers: 2,
  partnerId: 3,       // null pour self-call
  petitAuBout: "none",
  poignee: "none",
  points: 45,
});

result.attackWins;      // true
result.takerScore;      // 68
result.partnerScore;    // 34
result.defenderScore;   // -34
```

| Champ retour | Type | Description |
|-------------|------|-------------|
| `attackWins` | `boolean` | Le camp attaquant gagne-t-il ? |
| `baseScore` | `number` | Score de base (avant distribution) |
| `chelemBonus` | `number` | Bonus chelem |
| `defenderScore` | `number` | Score de chaque défenseur |
| `partnerScore` | `number` | Score du partenaire (0 si self-call) |
| `petitAuBoutBonus` | `number` | Bonus petit au bout |
| `poigneeBonus` | `number` | Bonus poignée |
| `takerScore` | `number` | Score du preneur |
| `totalPerPlayer` | `number` | Total avant distribution |

### `selectVictoryMeme`

**Fichier** : `services/memeSelector.ts`

Sélectionne un mème de victoire en fonction du contexte de la donne. Fonction pure, facilement testable.

```ts
import { selectDefeatMeme, selectVictoryMeme, type GameContext } from "./services/memeSelector";

const ctx: GameContext = {
  attackWins: true,
  chelem: "none",
  contract: "garde_contre",
  isSelfCall: false,
  oudlers: 2,
  petitAuBout: "none",
};

const meme = selectVictoryMeme(ctx) ?? selectDefeatMeme(ctx);

if (meme) {
  meme.id;      // "champions"
  meme.image;   // "/memes/champions.webp"
  meme.caption; // ""
}
```

**`GameContext`** :

| Champ | Type | Description |
|-------|------|-------------|
| `attackWins` | `boolean` | L'attaque a-t-elle gagné |
| `chelem` | `Chelem` | Type de chelem (pour détecter chelem raté) |
| `contract` | `Contract` | Contrat joué |
| `isSelfCall` | `boolean` | Victoire en solo (appel au roi seul) |
| `oudlers` | `number` | Nombre de bouts (0-3) |
| `petitAuBout` | `Side` | Petit au bout (attaque/défense/aucun) |

**Logique de sélection victoire** (ordre de priorité) :

1. `attackWins === false` → retourne `null`
2. `petitAuBout === "attack"` → toujours `success-kid` (événement rare, toujours célébré)
3. `isSelfCall === true` → toujours `obama-medal` (le preneur se décore lui-même)
4. `Math.random() >= 0.4` → retourne `null` (60 % de chance de ne rien afficher)
5. Aléatoire dans le pool par défaut :

| ID | Image |
|----|-------|
| `borat` | Borat "Great Success" |
| `champions` | Freddie Mercury |
| `dicaprio-toast` | DiCaprio toast |
| `over-9000` | Vegeta Over 9000 |
| `pacha` | Pacha (le point parfait) |

### `selectDefeatMeme`

**Fichier** : `services/memeSelector.ts`

Sélectionne un mème de défaite en fonction du contexte de la donne. Même probabilité de base (40 %) que pour la victoire, sauf pour les mèmes garantis.

**Logique de sélection défaite** (ordre de priorité) :

1. `attackWins === true` → retourne `null`
2. Défaite « improbable » → toujours un mème garanti (aléatoire entre `chosen-one`, `pikachu-surprised` et `picard-facepalm`) : 3 bouts + défaite, chelem raté (`announced_lost`), ou garde contre perdue
3. Garde sans perdue → toujours `crying-jordan`
4. `Math.random() >= 0.4` → retourne `null` (60 % de chance de ne rien afficher)
5. `Math.random() < 0.4` → `this-is-fine` (chien dans les flammes)
6. Sinon → aléatoire dans le pool de défaite :

| ID | Image |
|----|-------|
| `ah-shit` | CJ (GTA San Andreas) |
| `just-to-suffer` | Metal Gear Solid V |
| `sad-pablo` | Pablo Escobar seul |

> **Note** : les mèmes n'ont pas de légende textuelle — seule l'image s'affiche (sauf exceptions).

**Assets mèmes** : `frontend/public/memes/*.webp` (15 fichiers). Format `.webp`.

---

## Composants UI

Tous les composants sont exportés depuis `components/ui/index.ts` :

```tsx
import { ContractBadge, EmptyState, FAB, Modal, OverflowMenu, PlayerAvatar, ScoreDisplay, SearchInput, Select, Spinner, Stepper, Toast, ToastContainer, UndoFAB } from "./components/ui";
```

### `PlayerAvatar`

**Fichier** : `components/ui/PlayerAvatar.tsx`

Affiche un cercle coloré avec les initiales du joueur.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `name` | `string` | *requis* | Nom du joueur (initiales = 2 premières lettres) |
| `playerId` | `number?` | — | Prioritaire pour la couleur palette (`playerId % 10`) |
| `color` | `string \| null` | — | Couleur personnalisée (hex). Si fournie, remplace la couleur palette par un `backgroundColor` inline. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32px / 40px / 56px |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<PlayerAvatar name="Alice" playerId={3} size="lg" />
<PlayerAvatar name="Bob" playerId={2} color="#ef4444" />  {/* couleur personnalisée */}
```

### `ContractBadge`

**Fichier** : `components/ui/ContractBadge.tsx`

Badge coloré affichant le type de contrat en français.

| Prop | Type | Description |
|------|------|-------------|
| `contract` | `Contract` | Type de contrat (enum) |
| `className` | `string?` | Classes CSS supplémentaires |

```tsx
<ContractBadge contract={Contract.GardeSans} />
// Affiche : badge orange "Garde Sans"
```

### `ScoreDisplay`

**Fichier** : `components/ui/ScoreDisplay.tsx`

Affiche un score avec couleur (vert/rouge/gris) et animation optionnelle.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `value` | `number` | *requis* | Score à afficher |
| `animated` | `boolean` | `true` | Activer l'animation |
| `duration` | `number` | `500` | Durée d'animation (ms) |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<ScoreDisplay value={42} />    // "+42" en vert
<ScoreDisplay value={-15} />   // "-15" en rouge
<ScoreDisplay value={0} />     // "0" en gris
```

### `EmptyState`

**Fichier** : `components/ui/EmptyState.tsx`

Affiche un état vide avec icône, message et bouton d'action optionnel.

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `ReactNode` | *requis* — icône illustrant l'état vide (lucide-react, taille 40) |
| `message` | `string` | *requis* — texte descriptif |
| `action` | `{ label: string; onClick: () => void }` | *optionnel* — bouton CTA |

```tsx
<EmptyState
  action={{ label: "Créer un groupe", onClick: openModal }}
  icon={<Users size={40} />}
  message="Aucun groupe créé"
/>

{/* Sans action */}
<EmptyState icon={<UserX size={40} />} message="Aucun joueur trouvé" />
```

### `FAB`

**Fichier** : `components/ui/FAB.tsx`

Bouton d'action flottant (Floating Action Button), positionné en bas à droite au-dessus du BottomNav.

| Prop | Type | Description |
|------|------|-------------|
| `aria-label` | `string` | *requis* — label d'accessibilité |
| `icon` | `ReactNode` | *requis* — icône à afficher |
| `onClick` | `() => void` | *requis* — action au clic |
| `disabled` | `boolean?` | Désactiver le bouton |
| `className` | `string?` | Classes CSS supplémentaires |

```tsx
import { Plus } from "lucide-react";
<FAB aria-label="Nouvelle donne" icon={<Plus />} onClick={handleNewGame} />
```

### `UndoFAB`

**Fichier** : `components/ui/UndoFAB.tsx`

Bouton d'action flottant temporaire (bas gauche) avec décompte circulaire SVG de 5 secondes. Utilisé pour annuler la dernière donne saisie.

| Prop | Type | Description |
|------|------|-------------|
| `onDismiss` | `() => void` | *requis* — appelé quand le décompte expire (5s) |
| `onUndo` | `() => void` | *requis* — appelé au clic sur le bouton |

```tsx
<UndoFAB onDismiss={() => setUndoGameId(null)} onUndo={handleUndo} />
```

**Comportement** :
- Le bouton s'affiche avec un anneau SVG qui se vide progressivement pendant 5 secondes
- Au clic : `onUndo` est appelé, le timer est annulé (pas de `onDismiss`)
- À l'expiration : `onDismiss` est appelé automatiquement
- Animation CSS `animate-undo-countdown` définie dans `index.css`

### `OverflowMenu`

**Fichier** : `components/ui/OverflowMenu.tsx`

Menu déroulant déclenché par un bouton « … » (icône `EllipsisVertical`). Supporte les items bouton et les items lien (navigation interne).

| Prop | Type | Description |
|------|------|-------------|
| `items` | `OverflowMenuItem[]` | *requis* — liste des items du menu |
| `label` | `string` | *requis* — aria-label du bouton déclencheur |

**`OverflowMenuItem`** (union discriminée) :

Chaque item est soit un **bouton** (avec `onClick`), soit un **lien** (avec `href`) :

| Champ | Type | Variante | Description |
|-------|------|----------|-------------|
| `icon` | `ReactNode` | les deux | *requis* — icône affichée à gauche |
| `label` | `string` | les deux | *requis* — texte de l'item |
| `onClick` | `() => void` | bouton | *requis* — action au clic |
| `disabled` | `boolean` | bouton | Désactive l'item (opacity réduite, clic ignoré) |
| `href` | `string` | lien | *requis* — navigation interne (utilise `<Link>`) |

**Comportement** : le menu se ferme au clic en dehors, après sélection d'un item, ou à l'appui sur Échap.

```tsx
<OverflowMenu
  items={[
    { href: "/sessions/1/summary", icon: <BarChart3 size={18} />, label: "Récap" },
    { icon: <QrCode size={18} />, label: "Partager", onClick: () => setShareOpen(true) },
    { disabled: true, icon: <ArrowLeftRight size={18} />, label: "Modifier", onClick: () => {} },
  ]}
  label="Actions"
/>
```

### `Modal`

**Fichier** : `components/ui/Modal.tsx`

Dialogue modal en portail avec focus trap et fermeture Escape/backdrop. Plein écran sur mobile, centré sur desktop. Animation slide-up à l'ouverture et slide-down à la fermeture (200 ms ease-out), avec fondu du backdrop.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | *requis* — afficher ou masquer |
| `title` | `string` | *requis* — titre du dialogue |
| `onClose` | `() => void` | *requis* — fermeture (Escape, backdrop, bouton ✕) |
| `children` | `ReactNode` | Contenu du dialogue |

```tsx
<Modal open={isOpen} title="Confirmer" onClose={() => setIsOpen(false)}>
  <p>Voulez-vous vraiment supprimer ?</p>
</Modal>
```

### `Toast` / `ToastContainer`

**Fichiers** : `components/ui/Toast.tsx`, `components/ui/ToastContainer.tsx`

Toast de confirmation discret (haut de l'écran, auto-dismiss). Utilise le contexte `useToast`.

`ToastContainer` est déjà rendu dans `App.tsx` — pas besoin de l'ajouter manuellement.

```tsx
import { useToast } from "../hooks/useToast";

const { toast, toastError } = useToast();

// Toast de succès (auto-dismiss 2 s)
toast("Joueur créé");

// Toast d'erreur (auto-dismiss 3 s)
toastError("Erreur de connexion");
```

Comportement : max 3 toasts empilés, animation slide-down, clic pour fermer, icône CheckCircle (succès) ou XCircle (erreur).

---

### `Spinner`

**Fichier** : `components/ui/Spinner.tsx`

Indicateur de chargement animé (cercle tournant accent-500). Accessible avec `role="status"` et texte masqué pour lecteurs d'écran.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `size` | `"xs" \| "sm" \| "md"` | `"md"` | `md` = 32px, padding `py-8`. `sm` = 20px, padding `py-4`. `xs` = 16px (bouton inline). |
| `inline` | `boolean` | `false` | Si `true`, rend uniquement le SVG sans wrapper ni `role="status"`. |
| `className` | `string` | `"text-accent-500"` | Classe CSS pour la couleur du SVG. |

```tsx
{/* Chargement pleine page */}
<Spinner />

{/* Chargement inline (liste, sélecteur) */}
<Spinner size="sm" />

{/* Dans un bouton (SVG seul, couleur héritée) */}
<Spinner className="text-text-secondary" inline size="xs" />
```

### `Stepper`

**Fichier** : `components/ui/Stepper.tsx`

Contrôle incrémental avec boutons −/+, bornes min/max.

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | *requis* — valeur courante |
| `min` | `number` | *requis* — borne minimum |
| `max` | `number` | *requis* — borne maximum |
| `label` | `string` | *requis* — libellé affiché |
| `onChange` | `(value: number) => void` | *requis* — callback |
| `className` | `string?` | Classes CSS supplémentaires |

```tsx
<Stepper label="Points" min={0} max={91} value={points} onChange={setPoints} />
```

### `SearchInput`

**Fichier** : `components/ui/SearchInput.tsx`

Champ de recherche avec debounce intégré et bouton d'effacement. Supporte la navigation clavier via les props `onKeyDown`, `clearKey` et `inputProps`.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `onSearch` | `(value: string) => void` | *requis* | Callback après debounce |
| `debounceMs` | `number` | `300` | Délai de debounce (ms) |
| `placeholder` | `string?` | — | Placeholder du champ |
| `className` | `string?` | — | Classes CSS supplémentaires |
| `onKeyDown` | `(e: KeyboardEvent) => void` | — | Handler clavier forwardé à l'`<input>` |
| `clearKey` | `number?` | — | Quand cette valeur change, le champ se vide (utile pour un reset externe, ex. Escape) |
| `inputProps` | `InputHTMLAttributes?` | — | Attributs HTML supplémentaires spreadés sur l'`<input>` (ex. ARIA) |

```tsx
<SearchInput placeholder="Rechercher un joueur..." onSearch={setFilter} />

{/* Avec navigation clavier (pattern combobox ARIA) */}
<SearchInput
  clearKey={clearKey}
  inputProps={{
    "aria-activedescendant": highlightedId ? `option-${highlightedId}` : undefined,
    "aria-controls": "my-listbox",
    "aria-expanded": isOpen,
    role: "combobox",
  }}
  onKeyDown={handleKeyDown}
  onSearch={handleSearch}
  placeholder="Rechercher…"
/>
```

### `Select`

**Fichier** : `components/ui/Select.tsx`

Menu déroulant personnalisé remplaçant le `<select>` natif. Affiche un bouton déclencheur avec chevron rotatif, et un panneau déroulant stylisé avec coche sur l'option sélectionnée. Supporte la navigation clavier (flèches, Entrée, Échap) et la fermeture au clic extérieur.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `options` | `SelectOption<T>[]` | *requis* | Options disponibles (`{ label, value }`) |
| `value` | `T` | *requis* | Valeur sélectionnée |
| `onChange` | `(value: T) => void` | *requis* | Callback de changement |
| `variant` | `"default" \| "compact"` | `"default"` | `default` = pleine largeur (sélecteur de section), `compact` = inline (filtre dans un header) |
| `id` | `string?` | — | ID HTML du bouton |

```tsx
{/* Sélecteur de section (pleine largeur) */}
<Select
  options={[
    { label: "Classement ELO", value: "elo-ranking" },
    { label: "Répartition des contrats", value: "contracts" },
  ]}
  value={selectedSection}
  onChange={setSelectedSection}
/>

{/* Filtre compact (inline) */}
<Select
  options={groupOptions}
  value={selectedGroup}
  onChange={setSelectedGroup}
  variant="compact"
/>
```

---

## Utilitaire de test

**Fichier** : `__tests__/test-utils.tsx`

```tsx
import { renderWithProviders } from "../__tests__/test-utils";

// Remplace render() avec ThemeProvider + QueryClientProvider + MemoryRouter
renderWithProviders(<MonComposant />);
```

Le `QueryClientProvider` inclus utilise un `QueryClient` de test (retry désactivé, gcTime infini).

`createTestQueryClient()` est aussi exporté pour les tests de hooks isolés.

---

## Compatibilité TV

L'application est compatible avec les Smart TV Samsung (Tizen 5.0+, Chromium 69) et LG (webOS 5.0+, Chromium 68).

### Cible de build

Le build Vite cible `chrome64` (`vite.config.ts → build.target`) pour transpiler les syntaxes ES2020+ (optional chaining `?.`, nullish coalescing `??`) incompatibles avec les navigateurs embarqués des TV.

Le champ `browserslist` dans `package.json` documente les navigateurs supportés : `chrome >= 64, last 2 versions, not dead`.

### Breakpoint TV

Le breakpoint `lg:` (1024px) sert de seuil pour les styles TV. L'application n'ayant pas d'utilisateurs desktop, `lg:` = TV en pratique.

### Scaling par `font-size`

À partir de `lg:`, la `font-size` racine passe à **20px** (au lieu de 16px par défaut). Comme toutes les classes Tailwind utilisent `rem`, cela scale proportionnellement l'ensemble de l'UI. Les valeurs en pixels (hauteurs de graphiques Recharts, props `size` de lucide-react) doivent être ajustées explicitement avec des classes `lg:`.

```css
/* frontend/src/index.css */
@media (min-width: 1024px) {
  html { font-size: 20px; }
}
```

### Focus visible (D-pad)

Une règle `:focus-visible` globale dans `index.css` affiche un anneau accent sur tous les éléments interactifs lors de la navigation clavier/D-pad. Un override en dark mode utilise `accent-300`.

Les boutons critiques ont des cibles minimales de 40px (`min-h-10 min-w-10`) pour être facilement accessibles au D-pad.

### Layout TV

- **Contenu centré** : `lg:mx-auto lg:max-w-4xl` sur le `<main>` (Layout.tsx)
- **Barre de navigation** : centrée et arrondie (`lg:max-w-4xl lg:rounded-t-xl`)
- **Graphiques** : wrappers avec hauteur responsive (`h-64 lg:h-96`, etc.)
- **Scoreboard** : centré sans scroll horizontal (`lg:justify-center lg:overflow-visible`)
- **Pages** : padding augmenté (`lg:p-8`)

---

## Convention

- **Imports** : utiliser le barrel export `components/ui` pour les composants UI
- **Icônes** : utiliser `lucide-react` (import nommé par icône)
- **Couleurs** : toujours utiliser les tokens de thème, jamais de couleurs hardcodées
- **Tests** : chaque composant/hook a un fichier test dans `__tests__/`
