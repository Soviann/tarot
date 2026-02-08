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

```tsx
import { useTheme } from "./hooks/useTheme";

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return <button onClick={toggle}>{isDark ? "☀️" : "🌙"}</button>;
}
```

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
| `Game` | `id`, `chelem`, `contract`, `createdAt`, `dealer`, `oudlers`, `partner`, `petitAuBout`, `poignee`, `poigneeOwner`, `points`, `position`, `scoreEntries`, `status`, `taker` |
| `GamePlayer` | `id: number`, `name: string` |
| `HydraCollection<T>` | `member: T[]`, `totalItems: number` |
| `Player` | `active: boolean`, `id: number`, `name: string`, `createdAt: string` |
| `ScoreEntry` | `id: number`, `player: GamePlayer`, `score: number` |
| `Session` | `id: number`, `createdAt: string`, `isActive: boolean`, `players: SessionPlayer[]` |
| `SessionDetail` | `id`, `createdAt`, `currentDealer`, `isActive`, `players: GamePlayer[]`, `games: Game[]`, `cumulativeScores: CumulativeScore[]`, `starEvents: StarEvent[]` |
| `StarEvent` | `id: number`, `createdAt: string`, `player: GamePlayer` |
| `SessionPlayer` | `name: string` |
| `ContractDistributionEntry` | `contract: Contract`, `count: number`, `percentage: number` |
| `EloHistoryEntry` | `date: string`, `gameId: number`, `ratingAfter: number`, `ratingChange: number` |
| `EloRankingEntry` | `eloRating: number`, `gamesPlayed: number`, `playerId: number`, `playerName: string` |
| `GlobalStatistics` | `contractDistribution: ContractDistributionEntry[]`, `eloRanking: EloRankingEntry[]`, `leaderboard: LeaderboardEntry[]`, `totalGames`, `totalSessions`, `totalStars` |
| `LeaderboardEntry` | `gamesAsTaker`, `gamesPlayed`, `playerId`, `playerName`, `totalScore`, `winRate`, `wins` |
| `PlayerContractEntry` | `contract: Contract`, `count`, `winRate`, `wins` |
| `PlayerStatistics` | `averageScore`, `bestGameScore`, `contractDistribution`, `eloHistory: EloHistoryEntry[]`, `eloRating: number`, `gamesAsDefender`, `gamesAsPartner`, `gamesAsTaker`, `gamesPlayed`, `player`, `recentScores`, `sessionsPlayed`, `starPenalties`, `totalStars`, `winRateAsTaker`, `worstGameScore` |
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

Mutation pour modifier un joueur (nom et/ou statut actif). Envoie un PATCH avec `application/merge-patch+json`.
Invalide le cache `["players"]` en cas de succès.

```ts
const updatePlayer = useUpdatePlayer();

updatePlayer.mutate({ id: 1, name: "Alicia", active: false }, {
  onSuccess: () => closeModal(),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(input: { id: number, name?: string, active?: boolean }) => void` | Lance la modification |
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

Récupère les statistiques globales (classement, répartition des contrats, totaux) via l'API.

```ts
const { isPending, stats } = useGlobalStats();
```

| Retour | Type | Description |
|--------|------|-------------|
| `stats` | `GlobalStatistics \| null` | Statistiques globales (`null` pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| …autres | — | Tous les champs de `UseQueryResult` |

### `usePlayerStats`

**Fichier** : `hooks/usePlayerStats.ts`

Récupère les statistiques détaillées d'un joueur via l'API.

```ts
const { isPending, stats } = usePlayerStats(playerId);
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

### `useSession`

**Fichier** : `hooks/useSession.ts`

Récupère le détail d'une session (joueurs, donnes, scores cumulés) via l'API.

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

---

## Pages

### Accueil (`Home`)

**Fichier** : `pages/Home.tsx`

Écran principal : sélection de joueurs, création de session, sessions récentes.

**Fonctionnalités** :
- Sélection de 5 joueurs via `PlayerSelector` (composant contrôlé)
- Bouton « Démarrer » (disabled si < 5 joueurs ou mutation en cours)
- Redirection vers `/sessions/:id` après création
- Message d'erreur si la création échoue
- Liste des sessions récentes via `SessionList`

**Hooks utilisés** : `useCreateSession`, `useNavigate`

### Aide (`Help`)

**Fichier** : `pages/Help.tsx`

Page d'aide in-app reprenant le contenu du guide utilisateur (`docs/user-guide.md`).

**Route** : `/aide`

**Fonctionnalités** :
- Section « Installation » toujours visible
- 11 sections en accordéon dépliable (`AccordionSection`, composant local)
- Lien vers le dépôt GitHub en bas de page
- Bouton retour vers l'accueil
- Accessible via l'icône `CircleHelp` dans le header du `Layout`

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
- Modale de modification : champ nom pré-rempli + toggle actif/inactif + bouton « Enregistrer »
- Joueurs inactifs : nom barré (`line-through`), badge « Inactif », avatar grisé (`opacity-50`)
- États : chargement, liste vide, résultats

**Hooks utilisés** : `usePlayers`, `useCreatePlayer`, `useUpdatePlayer`

### Statistiques globales (`Stats`)

**Fichier** : `pages/Stats.tsx`

Écran de statistiques globales avec classement, métriques et répartition des contrats.

**Route** : `/stats`

**Fonctionnalités** :
- Métriques clés : total de donnes et de sessions
- Classement (`Leaderboard`) trié par score total décroissant
- Classement ELO (`EloRanking`) trié par rating décroissant (masqué si aucune donnée)
- Répartition des contrats (`ContractDistributionChart`) en barres horizontales
- Navigation vers le détail d'un joueur au clic
- États : chargement, erreur

**Hooks utilisés** : `useGlobalStats`, `useNavigate`

### Statistiques joueur (`PlayerStats`)

**Fichier** : `pages/PlayerStats.tsx`

Écran de statistiques détaillées d'un joueur.

**Route** : `/stats/player/:id`

**Fonctionnalités** :
- Avatar, nom du joueur
- Métriques clés : donnes jouées, taux de victoire, score moyen, ELO, sessions
- Meilleur et pire score
- Répartition des rôles (preneur / partenaire / défenseur) en barre visuelle
- Répartition des contrats pris (`ContractDistributionChart`)
- Évolution des scores récents (`ScoreTrendChart`)
- Évolution ELO (`EloEvolutionChart`) — graphique linéaire avec ligne de référence y=1500
- Bouton retour vers `/stats`
- États : chargement, joueur introuvable

**Hooks utilisés** : `usePlayerStats`, `useNavigate`

### Session (`SessionPage`)

**Fichier** : `pages/SessionPage.tsx`

Écran principal de suivi d'une session de Tarot : tableau des scores, donne en cours, historique.

**Route** : `/sessions/:id`

**Fonctionnalités** :
- Tableau des scores cumulés (composant `Scoreboard`) avec avatars et scores colorés
- Graphique d'évolution des scores (`ScoreEvolutionChart`) visible quand ≥ 2 donnes terminées
- Bandeau « donne en cours » (`InProgressBanner`) si une donne est au statut `in_progress`
- Historique des donnes terminées (`GameList`) en ordre anti-chronologique
- Bouton FAB (+) pour démarrer une nouvelle donne (désactivé si donne en cours)
- Bouton de changement de joueurs (icône ⇄) dans le header (désactivé si donne en cours)
- Bouton retour vers l'accueil
- États : chargement, session introuvable

**Hooks utilisés** : `useSession`, `useAddStar`, `useCreateGame`, `useCreateSession` (via SwapPlayersModal), `useCompleteGame`, `useDeleteGame`, `useUpdateDealer`, `useNavigate`

**Modales** :
- `ChangeDealerModal` : sélection manuelle du donneur parmi les 5 joueurs
- `SwapPlayersModal` : changement de joueurs avec navigation vers la session résultante
- `NewGameModal` : sélection preneur + contrat (étape 1)
- `CompleteGameModal` : complétion ou modification d'une donne (étape 2)
- `AddStarModal` : confirmation avant attribution d'étoile à un joueur
- `DeleteGameModal` : confirmation de suppression de la dernière donne

---

## Composants métier

### `PlayerSelector`

**Fichier** : `components/PlayerSelector.tsx`

Composant de sélection de joueurs avec limite à 5. Inclut chips, recherche et création inline.

| Prop | Type | Description |
|------|------|-------------|
| `selectedPlayerIds` | `number[]` | *requis* — IDs des joueurs sélectionnés |
| `onSelectionChange` | `(ids: number[]) => void` | *requis* — callback de changement |

**Fonctionnalités** :
- Chips en haut avec avatar + nom des joueurs sélectionnés (clic = déselection)
- Placeholders ronds pour les places restantes
- Compteur « X/5 joueurs sélectionnés »
- `SearchInput` pour filtrer la liste
- Filtre les joueurs inactifs de la liste de sélection (seuls les joueurs actifs sont sélectionnables)
- Les joueurs déjà sélectionnés restent affichés en chips même s'ils sont inactifs
- Liste des joueurs : clic = toggle sélection, `ring-2 ring-accent-500` si sélectionné
- Joueurs non sélectionnés grisés et désactivés quand 5 sont déjà choisis
- Bouton « + Nouveau joueur » ouvrant un `Modal` de création
- Pré-remplissage du nom avec le texte de recherche à l'ouverture de la modale
- Auto-sélection du joueur créé si < 5

**Hooks utilisés** : `usePlayers`, `useCreatePlayer`

### `SessionList`

**Fichier** : `components/SessionList.tsx`

Liste des sessions récentes sous forme de cartes cliquables.

**Fonctionnalités** :
- Chaque carte : noms des joueurs (jointure « , »), date fr-FR, badge « En cours » si `isActive`
- Lien vers `/sessions/:id`
- États : chargement, vide (« Aucune session »), liste

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

Bandeau pour une donne en cours, affichant le preneur, le contrat, un bouton « Compléter » et un bouton optionnel « Annuler ».

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
| `games` | `Game[]` | *requis* — donnes terminées |
| `onDeleteLast` | `() => void` | *requis* — action pour supprimer la dernière donne |
| `onEditLast` | `() => void` | *requis* — action pour modifier la dernière donne |

**Fonctionnalités** :
- Chaque carte : avatar preneur, nom, badge contrat, « avec [partenaire] » ou « Seul », donneur, score du preneur
- Boutons « Modifier » et « Supprimer » uniquement sur la dernière donne (position la plus élevée)
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
| `open` | `boolean` | *requis* — afficher ou masquer |
| `onClose` | `() => void` | *requis* — fermeture |
| `game` | `Game` | *requis* — donne à compléter/modifier |
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

### `ScoreEvolutionChart`

**Fichier** : `components/ScoreEvolutionChart.tsx`

Graphique linéaire (Recharts) affichant l'évolution des scores cumulés de tous les joueurs au fil des donnes. Une ligne par joueur, colorée par couleur d'avatar.

| Prop | Type | Description |
|------|------|-------------|
| `games` | `Game[]` | *requis* — toutes les donnes de la session |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |

**Fonction utilitaire exportée** : `computeScoreEvolution(games, players)` — calcule les scores cumulés par position de donne.

---

## Services

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

---

## Composants UI

Tous les composants sont exportés depuis `components/ui/index.ts` :

```tsx
import { ContractBadge, FAB, Modal, PlayerAvatar, ScoreDisplay, SearchInput, Stepper } from "./components/ui";
```

### `PlayerAvatar`

**Fichier** : `components/ui/PlayerAvatar.tsx`

Affiche un cercle coloré avec les initiales du joueur.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `name` | `string` | *requis* | Nom du joueur (initiales = 2 premières lettres) |
| `playerId` | `number?` | — | Prioritaire pour la couleur (`playerId % 10`) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32px / 40px / 56px |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<PlayerAvatar name="Alice" playerId={3} size="lg" />
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

### `Modal`

**Fichier** : `components/ui/Modal.tsx`

Dialogue modal en portail avec focus trap et fermeture Escape/backdrop. Plein écran sur mobile, centré sur desktop.

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

Champ de recherche avec debounce intégré et bouton d'effacement.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `onSearch` | `(value: string) => void` | *requis* | Callback après debounce |
| `debounceMs` | `number` | `300` | Délai de debounce (ms) |
| `placeholder` | `string?` | — | Placeholder du champ |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<SearchInput placeholder="Rechercher un joueur..." onSearch={setFilter} />
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
