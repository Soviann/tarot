# Journal des modifications

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- **Undo rapide** : bouton flottant « Annuler » avec décompte circulaire de 5 secondes après chaque saisie de donne, permettant de supprimer instantanément la dernière donne sans passer par la modale de suppression

- **Tri et limite des sessions récentes** : l'API retourne les 5 sessions les plus récemment jouées (triées par date de dernière donne), au lieu de toutes les sessions sans tri

- **Pagination de l'historique des donnes** : les donnes sont désormais chargées par pages de 10 depuis l'API (`/sessions/{id}/games`), avec un bouton « Voir plus » pour charger la suite. Nouveau hook `useSessionGames` avec `useInfiniteQuery`. La donne en cours est désormais une propriété dédiée `inProgressGame` sur le détail de session, alimentée par le provider côté serveur. Extension Doctrine `CompletedGamesExtension` pour filtrer les donnes en cours du endpoint paginé.

- **Groupes de joueurs** : création de cercles de jeu avec statistiques et classements filtrés par groupe (#91)
- **Association automatique** : les sessions sont automatiquement associées au groupe quand tous les joueurs sont membres
- **Association manuelle** : sélecteur de groupe sur l'écran de session avec propagation des joueurs
- **Filtre par groupe** : toutes les statistiques et classements filtrables par groupe
- **Attribution de groupes depuis la modification d'un joueur** : chips de sélection de groupes dans la modale d'édition
- **Page Groupes** : nouvel onglet dans la navigation pour gérer les groupes
- **Aide in-app** : section dédiée aux groupes dans la page d'aide

- **Mèmes de victoire et défaite** : système de mèmes plein écran à la complétion d'une donne (~40 % de chance, 3 secondes). Composant `MemeOverlay`, services `selectVictoryMeme` / `selectDefeatMeme`, 16 images dans `public/memes/`.
  - **Victoire** — déclencheurs garantis : Success Kid (petit au bout attaque), Obama se décore (victoire en solo). Pool aléatoire : Borat, Champions, DiCaprio Toast, Over 9000, Pacha.
  - **Défaite** — déclencheurs garantis : You Were the Chosen One / Pikachu surpris / Picard Facepalm (défaite improbable : 3 bouts, chelem raté, garde contre), Crying Jordan (garde sans perdue). 40 % This is Fine, sinon pool : Ah Shit, Just to Suffer, Sad Pablo.

- **Suivi de la durée des donnes** : nouveau champ `completedAt` sur les donnes, renseigné automatiquement à la complétion. Chronomètre en temps réel sur le bandeau de donne en cours. Durée affichée dans l'historique des donnes. Nouvelles statistiques globales (durée moyenne par donne, temps de jeu total) et par joueur. Utilitaire `formatDuration` et hook `useElapsedTime`.

### Fixed

- **Page blanche au clic sur un groupe** : les joueurs étaient rendus comme des IRIs au lieu d'objets (groupe de sérialisation `player-group:detail` manquant sur `Player`)
- **Création joueur depuis le formulaire de groupe** : le submit remontait dans l'arbre React via le portal et déclenchait la création du groupe prématurément
- **Classement vide dans les stats d'un groupe** : les INNER JOINs mutuellement exclusifs (game vs star entries) éliminaient toutes les lignes de la requête leaderboard
- **Groupes non pré-sélectionnés dans la modale d'édition joueur** : groupe de sérialisation `player:read` manquant sur `PlayerGroup.id` et `PlayerGroup.name`

### Removed

- **Mème « First Time? »** : suppression du mème garanti à la première défaite du preneur dans la session (incompatible avec la pagination côté serveur — seules les donnes chargées étaient vérifiées)

### Changed

- **CLAUDE.md** : commandes simplifiées avec cibles Makefile au lieu des commandes `ddev exec` verbeuses
- **Historique des donnes** : boutons Modifier et Supprimer déplacés sur une ligne séparée en dessous des informations de la donne, avec une taille augmentée pour une meilleure accessibilité mobile

### Added

- **Hookify rules** : 4 règles de garde automatiques — `require-ddev-exec` (commandes via DDEV), `no-schema-update` (migrations obligatoires), `no-dump-functions` (pas de dd/dump/var_dump), `no-console-log` (pas de console.log)

- **Navigation clavier dans la recherche de joueurs** : flèches ↑/↓ pour parcourir les résultats, Entrée pour sélectionner, Échap pour fermer la liste. Pattern combobox ARIA complet (`role="combobox"`, `role="listbox"`/`role="option"`, `aria-activedescendant`, `aria-expanded`). Nouvelles props SearchInput : `onKeyDown`, `clearKey`, `inputProps`.

- **Modification et désactivation des joueurs** : bouton crayon sur chaque joueur de la liste, modale de modification avec champ nom et toggle actif/inactif. Les joueurs inactifs sont affichés avec nom barré, badge « Inactif » et avatar grisé. Ils n'apparaissent plus dans la sélection lors de la création de session, mais leurs données historiques (scores, statistiques, ELO) sont conservées. Hook `useUpdatePlayer`, champ `active` sur l'entité `Player`.

- **Pré-remplissage nom joueur** : le champ nom de la modale « Nouveau joueur » est pré-rempli avec le texte de recherche en cours

- **Confirmation étoile** : modale de confirmation avant attribution d'une étoile à un joueur, évitant les appuis accidentels. Composant `AddStarModal` avec boutons Annuler/Confirmer.

- **Forcer le donneur** : possibilité de changer manuellement le donneur d'une session en appuyant sur l'icône de cartes du donneur actuel dans le tableau des scores. Modale de sélection parmi les 5 joueurs, opération PATCH `/sessions/{id}` avec validation (le donneur doit appartenir à la session). Hook `useUpdateDealer`, composant `ChangeDealerModal`.

- **Page d'aide in-app** : page `/aide` accessible via l'icône ? en haut à droite de chaque écran, reprenant le contenu du guide utilisateur en accordéons dépliables (installation, concepts clés, gestion des joueurs, sessions, saisie, statistiques, étoiles, ELO, Smart TV, thème sombre, règles de calcul), avec lien vers le dépôt GitHub
- **Guide de contribution** : fichier `CONTRIBUTING.md` à la racine du projet avec prérequis, conventions de code, workflow Git, soumission d'issues et de PRs

### Changed

- **Accueil — refonte mobile** : les sessions récentes sont affichées en haut de l'écran pour un accès rapide, la sélection des joueurs est en bas (zone du pouce). Le bouton « Démarrer » est remplacé par un bouton intégré qui apparaît avec animation à la place de la barre de recherche une fois les 5 joueurs sélectionnés. Chaque session affiche les avatars des joueurs et la date relative de la dernière donne (« Aujourd'hui », « Hier », « Il y a X jours »). La liste est limitée à 5 sessions avec un bouton « Voir tout ». L'état vide affiche un message aléatoire engageant. Un message motivant aléatoire est affiché en sous-titre de la section « Nouvelle session ».

- **Accueil — sélection des joueurs** : la liste complète des joueurs n'est plus affichée par défaut. Les joueurs apparaissent uniquement lors d'une recherche via la barre de recherche, simplifiant l'interface.

### Fixed

- **Accueil — centrage et débordement** : le titre, les avatars sélectionnés et le compteur de joueurs sont maintenant centrés horizontalement ; les chips passent à la ligne (`flex-wrap`) au lieu de déborder de l'écran
- **DevTools en production** : les React Query DevTools ne sont plus chargées ni affichées en production (lazy import conditionnel sur `import.meta.env.DEV`)

### Added

- **Compatibilité Smart TV** : support des Smart TV Samsung (Tizen 5.0+) et LG (webOS 5.0+). Build ciblant `chrome64` pour transpiler les syntaxes ES2020+. Mise en page responsive grand écran (`font-size` 20px, contenu centré `max-w-4xl`, graphiques agrandis). Navigation D-pad via `:focus-visible` global avec anneau accent. Cibles tactiles minimales 40px sur les boutons critiques.

- **Classement ELO** : système de rating ELO dynamique entre joueurs, calculé après chaque donne en tenant compte du niveau des adversaires (K-factors différenciés : preneur 40, partenaire 25, défenseur 15). Entité `EloHistory`, service `EloCalculator`, intégration dans les processeurs de complétion et suppression de donne (avec revert automatique). Section « Classement ELO » dans les statistiques globales, carte ELO et graphique d'évolution dans les statistiques par joueur. Composants `EloRanking` et `EloEvolutionChart`.

- **Raccourci « Même config »** : bouton dans la modale de nouvelle donne pour pré-remplir le preneur et le contrat de la dernière donne jouée, réduisant la saisie quand un joueur prend plusieurs fois de suite

- **Changement de joueurs** : depuis l'écran de session, bouton ⇄ pour modifier les joueurs sans repasser par l'accueil. Ouvre une modale `SwapPlayersModal` avec pré-sélection des joueurs actuels, réutilisant le `PlayerSelector` existant. Si les 5 joueurs choisis correspondent à une session active, navigation automatique vers celle-ci ; sinon, création d'une nouvelle session. Bouton désactivé pendant une donne en cours.

- **Système d'étoiles** : attribution d'étoiles aux joueurs pendant une session avec pénalité automatique tous les 3 étoiles (−100 pts pour le joueur pénalisé, +25 pts pour les 4 autres). Entité `StarEvent`, endpoint API `POST/GET /sessions/{id}/star-events`, intégration dans les scores cumulés, classement et statistiques. Interface étoiles cliquables sur le tableau des scores, compteur par joueur, affichage dans les stats globales et par joueur.

- **Rotation du donneur** : attribution automatique du premier donneur à la création de session (premier joueur alphabétique), copie sur chaque donne, rotation au joueur suivant après complétion d'une donne, icône de cartes sur le scoreboard et affichage dans la modale de saisie et l'historique des donnes
- **Suppression d'une donne** : suppression de la dernière donne (en cours ou complétée) avec modal de confirmation, recalcul automatique des scores, bouton « Supprimer » dans l'historique et « Annuler » sur le bandeau donne en cours
- **Statistiques globales** : écran `/stats` avec classement des joueurs (score total, taux de victoire), métriques clés (total donnes/sessions) et répartition des contrats en barres horizontales
- **Statistiques par joueur** : écran `/stats/player/:id` avec métriques (donnes jouées, score moyen, meilleur/pire), répartition des rôles, contrats pris et graphique d'évolution des scores récents
- **Évolution des scores en session** : graphique linéaire dans `SessionPage` montrant les scores cumulés de chaque joueur au fil des donnes (visible à partir de 2 donnes terminées)
- **API statistiques backend** : `GET /api/statistics` (classement, répartition contrats, totaux) et `GET /api/statistics/players/{id}` (statistiques détaillées par joueur)
- **Composants graphiques** : `Leaderboard`, `ContractDistributionChart`, `ScoreTrendChart`, `ScoreEvolutionChart` (Recharts)
- **Hooks** : `useGlobalStats`, `usePlayerStats` pour la récupération des données statistiques via TanStack Query
- **Types API** : `GlobalStatistics`, `LeaderboardEntry`, `ContractDistributionEntry`, `PlayerStatistics`, `PlayerContractEntry`, `RecentScoreEntry`
- **Formulaire de saisie des donnes** : wizard en 2 étapes — NewGameModal (preneur + contrat) et CompleteGameModal (partenaire, oudlers, points, bonus, aperçu scores)
- **Hook `useCompleteGame`** : mutation PATCH avec `application/merge-patch+json` pour compléter ou modifier une donne, avec invalidation du cache session
- **Service `calculateScore`** : miroir frontend du ScoreCalculator backend pour aperçu des scores en temps réel (base, poignée, petit au bout, chelem, distribution preneur/partenaire/défenseurs)
- **Composant `NewGameModal`** : sélection du preneur (avatars) et du contrat (grille colorée 2×2)
- **Composant `CompleteGameModal`** : formulaire complet avec section bonus repliable, aperçu des scores, mode édition avec pré-remplissage
- **Écran de session** : tableau des scores cumulés (Scoreboard), bandeau donne en cours (InProgressBanner), historique des donnes (GameList), bouton FAB nouvelle donne, navigation retour
- **Hook `useSession`** : récupération du détail d'une session (joueurs, donnes, scores cumulés) via TanStack Query
- **Hook `useCreateGame`** : mutation POST pour créer une nouvelle donne avec invalidation du cache session
- **Composant `Scoreboard`** : bandeau horizontal scrollable avec avatars et scores cumulés colorés
- **Composant `InProgressBanner`** : carte pour donne en cours avec preneur, contrat et bouton Compléter
- **Composant `GameList`** : liste des donnes terminées avec preneur, partenaire, contrat, score et bouton modifier
- **Types `Game`, `GamePlayer`, `ScoreEntry`, `SessionDetail`, `CumulativeScore`** : interfaces TypeScript pour le détail de session
- **Sérialisation backend** : ajout du groupe `session:detail` sur Player.id/name, Game et ScoreEntry pour que `GET /api/sessions/{id}` retourne les objets imbriqués
- **Écran d'accueil** : sélection de 5 joueurs (avec chips, recherche, création inline), démarrage/reprise de session, liste des sessions récentes
- **Hook `useSessions`** : récupération des sessions via TanStack Query
- **Hook `useCreateSession`** : mutation POST avec conversion des IDs en IRIs et invalidation du cache
- **Composant `PlayerSelector`** : sélection contrôlée de joueurs avec chips, limite à 5, création inline via modal
- **Composant `SessionList`** : liste cliquable des sessions récentes avec noms des joueurs, date et badge "En cours"
- **Page `SessionPage`** : écran complet de session avec scoreboard, donne en cours, historique et FAB
- **Route `/sessions/:id`** : navigation vers une session spécifique
- **Types `Session` et `SessionPlayer`** : interfaces TypeScript pour les réponses API
- **Gestion des joueurs** : écran complet avec liste, recherche par nom, ajout via formulaire modal, gestion des doublons (erreur 422)
- **Hook `usePlayers`** : récupération des joueurs via TanStack Query avec filtrage côté client
- **Hook `useCreatePlayer`** : mutation POST avec invalidation du cache et propagation des erreurs API
- **Types API** : interfaces `Player`, `HydraCollection<T>` et classe `ApiError` pour les erreurs HTTP enrichies
- **Design system** : thème Tailwind CSS 4 complet avec tokens de couleur (accent, surface, texte, score, contrat, avatar) et support du mode sombre via `@custom-variant dark`
- **ThemeProvider** : contexte React + hook `useTheme` pour basculer light/dark avec persistance localStorage et respect de `prefers-color-scheme`
- **Types frontend** : miroir TypeScript des enums backend (Contract, Chelem, GameStatus, Poignee, Side) en `as const`
- **PlayerAvatar** : composant avatar avec initiales (support noms composés), couleur déterministe (10 couleurs) et 3 tailles (sm/md/lg)
- **ContractBadge** : badge coloré par type de contrat (Petite/Garde/Garde Sans/Garde Contre)
- **ScoreDisplay** : affichage de score avec couleur positive/négative/neutre, animation rAF et tabular-nums
- **FAB** : bouton d'action flottant fixe, 56px, couleur accent, support disabled
- **Modal** : dialogue en portail avec focus trap, fermeture Escape/backdrop, `aria-labelledby`, plein écran mobile
- **Stepper** : contrôle incrémental −/+ avec bornes min/max, ARIA `role=group` et tap targets 44px
- **SearchInput** : champ de recherche avec debounce configurable et bouton clear
- **Hooks utilitaires** : `useAnimatedCounter` (animation rAF), `useDebounce` (délai configurable)
- **Documentation** : guide utilisateur (`docs/user-guide.md`) et référence développeur (`docs/frontend-usage.md`)
- **Tests frontend** : 207 tests (30 fichiers) couvrant tous les composants, hooks, services et pages
- **Initialisation du projet** : CLAUDE.md, README.md, CHANGELOG.md, document de conception
- **Document de conception** : architecture complète et design UI de l'application de scores au Tarot
- **Projet GitHub** : 12 issues créées et organisées sur le tableau Tarot - Roadmap
- **Configuration DDEV** : PHP 8.3, MariaDB 10.11, exposition du port Vite pour le serveur de dev frontend
- **Backend Symfony 7.4** : squelette Symfony avec API Platform 4, Doctrine ORM, NelmioCorsBundle
- **Frontend React 19** : application TypeScript avec Vite, Tailwind CSS 4, TanStack Query, React Router, PWA
- **Structure frontend** : routing avec 3 pages (Accueil, Stats, Joueurs), layout avec navigation basse, client API
- **Environnement de test** : base de données db_test configurée, PHPUnit opérationnel
- **Qualité backend** : PHP CS Fixer (@Symfony + risky) et PHPStan (niveau max) avec hook PostToolUse automatique
- **Service ScoreCalculator** : calcul des scores FFT pour le jeu à 5 joueurs avec bonus (poignée, petit au bout, chelem) et distribution preneur/partenaire/défenseurs
- **Tests ScoreCalculator** : 35 tests unitaires couvrant tous les contrats, bonus, distribution avec/sans partenaire et invariant somme=0
- **API Player** : CRUD complet (GET, POST, PATCH) avec validation unicité du nom et groupes de sérialisation
- **API Session** : smart-create (retrouve session active existante avec les mêmes joueurs), détail avec scores cumulés via DQL, filtrage par joueurs
- **API Game** : sous-ressource `/sessions/{id}/games`, création en 2 étapes (preneur+contrat → complétion), calcul automatique des scores via ScoreCalculator, édition de la dernière donne avec recalcul
- **Validation métier** : `OnlyLastGameEditable` (seule la dernière donne modifiable), `PlayersBelongToSession` (preneur/partenaire de la session)
- **Tests API fonctionnels** : 22 tests (Player, Session, Game, FullFlow E2E) avec `dama/doctrine-test-bundle` pour l'isolation par transaction
