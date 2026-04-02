# Journal des modifications

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- **Mèmes DOOM** : trois mèmes thématiques DOOM (Doomguy ensanglanté, Rip and Tear, Cacodemon) apparaissent uniquement durant la semaine du 10 décembre.
- **Semaine DOOM** : la probabilité d'apparition des indices du thème doom passe de 2 % à 10 % durant la semaine du 10 décembre (anniversaire de la sortie de DOOM).
- **Points attaque / défense** : choix du côté (attaque ou défense) lors de la saisie des points, avec conversion automatique. Compatible avec la saisie vocale.
- **Rafraîchissement automatique** : la page session se met à jour automatiquement toutes les 5 secondes lorsqu'un autre joueur saisit une donne, sans rechargement manuel.
- **Nouvelle donne** : possibilité de compléter une donne directement depuis la modal de création via un accordéon « Résultat (optionnel) », évitant le passage par deux modales séparées.

### Fixed

- **Complétion de donne** : corrige le bandeau de donne en cours et l'historique des donnes qui n'étaient pas mis à jour après une saisie complète depuis la modal de création.
- **Easter egg shake** : réduit la sensibilité du shake en exigeant plusieurs secousses consécutives au lieu d'un seul pic d'accélération.
- **Navbar** : corrige le décalage de la barre de navigation au scroll vers le haut sur mobile (`min-h-dvh` remplace `min-h-screen`).
- **Badges** : les badges ne se déclenchent plus rétroactivement sur des donnes antérieures à leur date d'introduction (`availableSince`).
- **Sécurité** : corrige la vulnérabilité RCE serialize-javascript via override npm (GHSA-5c6j-r48x-rmvq).

## [1.8.0] - 2026-03-21

### Added

- **Badge « Main du destin »** : nouveau badge performance décerné lorsqu'un joueur remporte une donne avec exactement 0 points de marge.
- **Badge « Appel à un ami »** : nouveau badge social décerné lorsqu'un joueur appelle le même partenaire 5 fois consécutivement.
- **Indices easter eggs** : indices subtils et éphémères suggérant la présence d'easter eggs cachés — logo Konami au clic sur un avatar (5%, 2s), icône Doom traversant l'écran au clic (2%, 32px). Cooldown partagé de 10 minutes.
- **Tests edge cases PATCH /games** : 11 tests API + 1 test unitaire couvrant les validateurs, transitions de statut, champs partiels, immutabilité et cascade.
- **Tests frontend validation & scoreCalculator** : 36 tests couvrant les bornes de points (0, 91), combinaisons de bonus extrêmes, score max/min théorique, validation des saisies (non numérique, décimale, négative, >91, espaces), interactions bonus (poignée owner, pré-remplissage édition) et flux partenaire (self-call toggle, opacité).
- **Tests cycle de vie modales** : 15 tests couvrant le reset des formulaires à la réouverture (NewGameModal, CompleteGameModal), la commutation joueur/contrat, l'état isPending, l'aperçu des scores dynamique (oudlers, bonus, effacement), la fermeture uniquement sur succès, l'orchestration sans interférence d'état entre modales, et l'affichage correct des objets game.

### Changed

- **Comparaison face à face** : restructure la page en 3 sections distinctes — stats globales (toutes les parties de chaque joueur), stats en commun (parties jouées ensemble), et face à face (confrontations preneur vs défenseur + partenariats).

### Fixed

- **Dropdown joueurs page VS** : corrige l'impossibilité de scroller dans les dropdowns de sélection de joueurs quand la liste est longue.
- **Validation complétion** : retourne 422 au lieu de 500 quand on tente de compléter une donne sans oudlers ou sans points.
- **Partner = preneur** : rejette le PATCH quand le partenaire est le preneur lui-même (auto-appel doit utiliser `partner: null`).

## [1.7.1] - 2026-03-19

### Fixed

- **Demi-points** : applique la règle FFT — le ½ point va au camp gagnant (au lieu de `Math.trunc`/`(int)` qui arrondissait toujours vers zéro). Accepte la virgule comme séparateur décimal dans le champ de saisie des points.

## [1.7.0] - 2026-03-05

### Added

- **Comparaison head-to-head** : nouvelle page VS (`/stats/h2h`) pour comparer deux joueurs face à face — sessions communes, victoires en tant que preneur, confrontations directes (preneur vs défenseur), partenariats, scores totaux/moyens. Accessible via le bouton « Comparer » sur la page Statistiques.
- **Zoom graphe Elo** : zoom et scroll horizontal sur le graphe d'évolution Elo global (molette, pinch-to-zoom, drag/swipe pour naviguer), double-clic/tap pour réinitialiser

### Changed

- **Easter egg shake** : secouer le téléphone inverse les scores (×-1) pendant 12 secondes avant d'afficher la modale « Eh non, bien essayé 😏 » (remplace l'ancienne rotation 180°)

### Fixed

- **Sélection du contrat** : le contrat sélectionné dans la modale de création de donne est désormais clairement distingué (anneau plus épais, léger zoom, ombre portée, contrats non sélectionnés plus atténués)
- **Modale complétion** : le bouton « Valider » est désormais toujours visible sans scroll sur les petits écrans (fixé en bas de la modale, seul le contenu défile)
- **Dictée vocale** : le bouton « Dicter le résultat » ne réagissait pas au clic sur mobile (Android & iPhone) — la promesse de `startListening` n'était pas attendue et les erreurs étaient silencieusement ignorées. Un message d'erreur s'affiche désormais sous le bouton en cas d'échec.
- **Easter egg shake** : ajout d'un cooldown de 30 secondes persistant entre les déclenchements et réinitialisation de la baseline d'accélération à la réactivation du listener pour empêcher les faux positifs

### Removed

- **Easter egg gyroscope inversé** : retourner le téléphone ne déclenche plus rien (le comportement d'inversion des scores est désormais sur le shake)

## [1.6.1] - 2026-02-24

### Added

- **Tests phase 3** : ~43 tests — 16 tests DTO mapping/sérialisation (coercion string→int, BackedEnum→value, DateTimeImmutable), 10 tests edge cases ScoreCalculator (points exacts par oudler, scores extrêmes, exceptions null), 5 tests CompletedGamesExtension (filtre automatique parties en cours), 5 tests branches PlayerStats (métriques conditionnelles, sections filtrées), 5 tests branches SessionSummary (podium 1-2 joueurs, highlights optionnels, awards vides), 3 tests PlayerAvatar rendu thématique (Doom icons, initialsPosition)
- **Tests phase 2** : ~92 tests backend — unit tests processeurs (EloRevertHelper, GameCreate/Complete/Delete, SessionCreate/Patch, StarEventCreate, providers), unit tests GlobalStatisticsService, tests intégration repositories (GameRepository, ScoreEntryRepository, SessionRepository). Extraction `completeGame()` dans `ApiTestCase`.
- **Tests phase 1** : 8 tests `api.ts` (fetch mock, ApiError, headers, 204, erreurs), 11 tests validators backend (PlayersBelongToSession, DealerBelongsToSession, OnlyLastGameEditable), 13 tests formatters charts (Tooltip/Legend), 15 tests `GroupDetail` (CRUD, modales, édition nom), 12 tests `SessionPage` (memes, graphe, overflow, pagination, close session)

### Fixed

- **Thème Doom mobile** : le cheat code IDDQD (keydown) ne fonctionnait pas sur smartphone ; remplacé par la détection du nom « Doomguy » ou « Doom Guy » dans les champs joueur (recherche/création)
- **Graphe évolution des scores** : les courbes étaient invisibles en thème par défaut/dark (variables CSS `--color-avatar-N` définies uniquement en Doom) ; remplacé par une palette hardcodée partagée

## [1.6.0] - 2026-02-22

### Added

- **Thème Doom** : thème caché activé par le cheat code IDDQD — palette rouge/noir, police AmazDooMLeft sur les titres, sons Doom contextuels à chaque donne (pistolet, fusil, tronçonneuse, klaxon ±1000), splash logo + toast "GOD MODE ACTIVATED"
- **Event bus frontend** : bus d'événements `gameEvents` (basé sur `mitt`) avec événement `game:completed` découplant SessionPage des effets (mèmes, sons)

### Fixed

- **ScoreEvolutionChart** : ajout de `minWidth={0}` sur tous les `ResponsiveContainer` Recharts pour supprimer le warning de dimensions négatives au premier rendu

### Changed

- **Registre de thèmes** : extraction de toute la config du thème Doom dans un registre centralisé `themeRegistry.ts` — les composants utilisent `getThemeConfig()` au lieu de hardcoder `=== "doom"`, facilitant l'ajout de futurs thèmes custom
- **ThemeProvider** : remplacement du hook custom `useTheme` par `next-themes` (gestion FOUC, localStorage, system preference, support multi-thèmes futur)
- **BadgeChecker** : refactorisation de `checkWall()` pour réutiliser `maxStreak()` au lieu d'un calcul inline dupliqué ; généralisation de `maxStreak()` avec template PHPDoc
- **Repositories** : standardisation du mapping DTO sur `SELECT NEW` en DQL pour 4 méthodes (suppression du mapping manuel scalaire + `foreach`)
- **PlayerAvatar** : nouvelle palette de 10 couleurs plus distinctives, couleurs désormais en inline style (suppression des tokens CSS `avatar-0` à `avatar-9`)
- **ErrorBoundary** : remplacement du composant custom par `react-error-boundary` avec bouton « Réessayer » (reset sans rechargement de page)
- **ScoreDisplay** : remplacement du hook custom `useAnimatedCounter` par `react-countup` pour l'animation des scores
- **Toast** : remplacement du système custom (`useToast`, `Toast.tsx`, `ToastContainer.tsx`) par `sonner` — meilleure accessibilité (`aria-live`), animations de sortie, API standard
- **Modal & Select** : remplacement des composants custom (`Modal.tsx`, `Select.tsx`) par `@headlessui/react` (`Dialog`, `Listbox`) — focus trap, keyboard navigation et ARIA gérés par la bibliothèque

## [1.5.0] - 2026-02-21

### Added

- **Saisie vocale** : bouton micro dans la modale de complétion de donne permettant de dicter le résultat en français (contrat, points, appelé, bonuses) via la Web Speech API. Parser local regex, dégradation gracieuse si l'API n'est pas supportée. Utilise la bibliothèque `react-speech-recognition`

### Changed

- **Dépendances npm** : mise à jour de toutes les dépendances (Tailwind CSS 4.2, TanStack Query 5.90, Vite 7.3, jsdom 28.1, lucide-react 0.575, etc.) et ajout d'un override pour `sourcemap-codec` afin d'éliminer le warning de dépréciation
- **Dépendances Composer** : mise à jour de toutes les dépendances (API Platform 4.2.17, PHPUnit 12.5.14, PHPStan 2.1.39, PHP CS Fixer 3.94, Doctrine Migrations 3.9.6, etc.)
- **Rector** : ajout de Rector comme outil de refactoring automatique et application des règles PHP 8.3, Symfony 7.4, dead code, et type declarations sur l'ensemble du backend (23 fichiers améliorés : return types sur closures, `#[Override]`, `::class` au lieu de FQCN strings, constantes HTTP Symfony, suppression de variables inutilisées)

## [1.4.0] - 2026-02-21

### Added

- **Mème Spiderman pointing** : affiche le mème "Spiderman pointing" lors d'une victoire en solo (appel à soi-même), poids 40
- **Mème Jordan Peele** : affiche le mème "Sweating Jordan Peele" lors d'une victoire serrée (marge ≤ 5 points), poids 20
- **Mème Chris Pratt "Wow"** : affiche le mème GIF Chris Pratt lors d'une victoire en garde-contre, poids 20
- **Mème "This is fine" boost** : le mème "This is fine" voit son poids fortement augmenté (20) lors d'une série de 3+ donnes consécutives avec score négatif pour le joueur
- **Mème "I'll be back"** : affiche le mème Terminator GIF lors d'une grosse défaite (score ≤ -50) suivant un bon score (≥ 50) sur la donne précédente, poids 20
- **Filtre par tranche de dates** : les pages de statistiques globales et par joueur permettent de filtrer les résultats par période (date de début / fin), avec des préréglages rapides (30 jours, 3 mois, 6 mois, 1 an, Tout)
- **Easter egg gyroscope inversé** : retourner le téléphone à l'envers (détection via l'API DeviceOrientation) inverse les scores affichés (positifs ↔ négatifs) dans le tableau des scores, avec une icône de feedback visuel
- **Easter egg "To infinity and beyond!"** : affiche le mème Buzz l'Éclair (Toy Story) lorsqu'un score individuel sur une donne dépasse ±200 points
- **Distinctions récap session** : 5 nouvelles distinctions humoristiques sur la page récapitulatif de session — Le Kamikaze (pire winrate preneur), Le Solitaire (moins appelé comme partenaire), Le Paratonnerre (plus d'étoiles reçues), Le Yo-Yo (scores les plus imprévisibles), Le Régulier (scores les plus constants)

## [1.3.0] - 2026-02-21

### Added

- **Easter egg "Mind Blown"** : affiche le mème "Mind Blown" (référence au *Guide du voyageur galactique*) lorsque le score saisi vaut exactement 42 points
- **Modale donne depuis records personnels** : sur la page stats joueur, les records personnels liés à une donne (meilleur score, pire score, plus grand écart) ouvrent une modale affichant le détail de la donne au lieu de rediriger vers la session

### Changed

- **Diagrammes camembert rôles/contrats** : sur la page stats joueur, les répartitions rôles et contrats sont désormais affichées en diagrammes camembert (pie chart) avec légende et valeurs numériques
- **Clôture de session irréversible** : une session terminée ne peut plus être réouverte via l'API ni depuis l'interface (le bouton « Réouvrir » a été supprimé)
- **Erreurs API plus explicites** : les messages d'erreur de `apiFetch` incluent désormais le détail retourné par l'API (`hydra:description`) au lieu d'un simple « API error: 4xx »
- **MetricCard partagé** : le composant `MetricCard` a été extrait dans `components/ui/` pour réutilisation
- **Icônes lucide** : remplacement des SVG manuels (flèche retour, bouton +) par des icônes `lucide-react` (`ArrowLeft`, `Plus`)

### Fixed

- **CORS production** : restriction à HTTPS uniquement (suppression du fallback HTTP)
- **Qualité backend** : suppression de 13 méthodes de repository inutilisées, déduplication des requêtes best/worst, consolidation du `GroupFilterTrait`, extraction d'une méthode `awardBadgesForPlayer` dans `BadgeChecker`, correction du N+1 dans `BadgeChecker` via requêtes batch
- **Enums enrichis** : ajout de `Contract::multiplier()` et `Poignee::bonus()`, simplification de `ScoreCalculator`
- **Unicode** : remplacement des séquences d'échappement Unicode par des caractères UTF-8 directs dans `SessionSummaryService`

## [1.2.1] - 2026-02-21

### Fixed

- **Sécurité npm** : correction de 8 vulnérabilités (ajv ReDoS modéré, minimatch ReDoS élevé) via mise à jour des dépendances et override npm

## [1.2.0] - 2026-02-21

### Added

- **Error Boundary global** : ajout d'un Error Boundary React englobant toute l'application. En cas d'erreur de rendu, un écran de repli affiche un message et un bouton « Recharger la page » au lieu d'un écran blanc.
- **18 nouveaux badges** : Garde contre réussie, 3 bouts pour rien, Si près du but, Confortable +10/+20/+30/+40/+50, Étoile montante, Pluie d'étoiles, Chelem surprise, Poignée triple, Zéro bout, Auto-appel, Série noire, Audacieux, Attrapez-les tous, et un badge secret Konami (easter egg sur la page stats joueur).
- **Numéro de donne** : chaque donne dans l'historique affiche désormais son numéro séquentiel (#1, #2, #3…) pour une identification rapide.
- **Logs Symfony (Monolog)** : ajout de `symfony/monolog-bundle` avec fichiers rotatifs en production (14 jours de rétention dans `var/log/`), pour diagnostiquer les erreurs 500.
- **Statistiques d'étoiles** : nouvelle section « Étoiles » sur la page de statistiques joueur, avec nombre total, pénalités, ratio par donne et par session, record en une session et nombre de sessions avec étoiles.
- **Ordre personnalisé des joueurs** : possibilité de réorganiser l'ordre des joueurs dans une session via le menu ⋮ > « Changer l'ordre ». L'ordre personnalisé s'applique au tableau des scores, au graphe d'évolution, à la sélection preneur/appelé et à la rotation automatique du donneur.
- **Détail des scores par donne** : au clic sur une donne dans l'historique, un panneau dépliable affiche les scores individuels de chaque joueur (preneur → appelé → défense) avec le nombre de bouts et l'écart par rapport au contrat.
- **Stats session glissantes** : le graphe d'évolution des scores n'affiche plus que les 10 dernières donnes (fenêtre glissante) pour une meilleure lisibilité sur les longues sessions.
- **Pagination des classements** : les classements par score et ELO affichent désormais 10 joueurs par défaut avec un bouton « Voir plus » pour charger les suivants.
- **Easter egg shake** : secouer le téléphone sur une page de session retourne les scores à l'envers pendant 2 secondes, puis affiche une modale « Eh non, bien essayé 😏 » avec un GIF.

### Changed

- **Menu actif** : l'onglet actif dans la barre de navigation basse est désormais souligné par un trait coloré en haut, en plus du texte en gras, pour un repérage visuel immédiat de la page courante.
- **Nettoyage frontend** : mémoïsation du calcul `computeScoreEvolution`, extraction d'un hook `useResetOnOpen` pour supprimer les `eslint-disable react-hooks/exhaustive-deps` dans 4 modales, et remplacement du `console.error` par un toast d'erreur dans le partage du récap de session.
- **Accessibilité OverflowMenu** : ajout de `role="menu"` / `role="menuitem"`, `aria-expanded` sur le bouton déclencheur, et navigation clavier fléchée (ArrowUp/ArrowDown) avec saut des items désactivés.
- **Accessibilité couleurs joueur** : les boutons radio de couleur dans la modale d'édition affichent désormais des noms français (« Rouge », « Bleu », etc.) au lieu de codes hexadécimaux pour les lecteurs d'écran.
- **Accessibilité Toast** : les toasts sont maintenant focusables au clavier (`tabIndex`) et peuvent être fermés avec Entrée ou Échap.
- **Recherche de joueurs (mobile)** : les résultats de recherche s'affichent désormais dans un dropdown au-dessus du champ de recherche (visibles même avec le clavier ouvert). Le focus reste sur le champ après chaque sélection. Le bouton « Nouveau joueur » est intégré au dropdown.
- **Cache requêtes (staleTime)** : configuration d'un `staleTime` de 30 secondes sur le `QueryClient` pour éviter les refetch systématiques à chaque navigation.

### Fixed

- **Favicon** : remplacement du favicon manquant (`vite.svg`) par l'image de la carte d'excuse au format PNG 32×32.
- **Annulation de donne (undo)** : l'annulation d'une donne via le bouton undo n'avait aucune gestion d'erreur. En cas d'échec de l'appel API, un rejet de promesse non capturé était produit silencieusement. Un try/catch avec toast d'erreur a été ajouté.
- **Boutons de modification de la dernière donne** : les boutons « Modifier » et « Supprimer » restaient visibles et actifs sur une session clôturée. Ils sont désormais masqués lorsque la session est terminée.
- **Graphe d'évolution des scores** : les scores cumulés étaient calculés uniquement à partir des donnes chargées (10 par page), faussant le graphe pour les sessions de plus de 10 donnes. Le graphe utilise désormais toutes les donnes de la session.
- **Calculateur de score (frontend)** : les demi-points (ex. 53.5) n'étaient pas tronqués à l'entier avant le calcul, contrairement au backend, provoquant des écarts dans la prévisualisation.

## [1.1.0] - 2026-02-18

### Added

- **Page 404** : une page d'erreur avec l'illustration de « L'Excuse » s'affiche pour les URLs inconnues et les ressources introuvables (session, joueur, groupe inexistants).

### Changed

- **Modale de complétion** : le bandeau d'information affiche désormais l'appelé à côté du preneur, permettant de vérifier rapidement la configuration avant validation.

## [1.0.0] - 2026-02-16

### Added

- **Badges dans l'aide** : la page d'aide (`/aide`) affiche désormais la liste complète des 15 badges disponibles, regroupés par catégorie (Progression, Performance, Fun, Social), avec leur icône, nom et condition d'obtention.
- **Rate limiting API** : les endpoints sous `/api/` sont désormais limités à 60 requêtes par minute par IP (sliding window). En cas de dépassement, l'API retourne une réponse 429 avec un corps JSON conforme RFC 7807. Les en-têtes `X-RateLimit-Limit`, `X-RateLimit-Remaining` et `Retry-After` sont inclus dans les réponses.
- **Liste des joueurs cliquable** : toute la ligne d'un joueur est désormais cliquable pour accéder directement à sa page de statistiques.
- **Animation des modales** : les modales s'ouvrent avec un slide-up depuis le bas (200 ms ease-out) et se ferment avec un slide-down. Le backdrop apparaît et disparaît en fondu (200 ms). Améliore la fluidité de l'interface.
- **Spinner de chargement animé** : indicateur de chargement animé (cercle tournant accent) remplaçant le texte brut « Chargement… » sur toutes les pages. Accessible (`role="status"`, texte masqué pour lecteurs d'écran). Deux tailles : `md` (pleine page) et `sm` (inline).
- **États vides illustrés** : icônes et messages explicites sur les pages sans contenu (groupes, joueurs, détail groupe, sessions). Bouton d'action contextuel quand applicable (ex : « Créer un groupe » sur la page groupes vide).
- **Toasts de confirmation** : un toast discret (haut de l'écran, auto-dismiss 2 s) confirme désormais chaque action utilisateur réussie — création de joueur/session/donne, ajout d'étoile, modification du donneur, gestion des groupes, clôture de session, etc. Icône et couleur distinctes pour succès (vert) et erreur (rouge). Maximum 3 toasts empilés, animation d'apparition fluide, compatible dark mode.
- **Légende du graphique d'évolution des scores** : le graphique de la page session affiche désormais des chips filtrables permettant d'identifier et de masquer/afficher chaque joueur. Les couleurs des courbes correspondent aux couleurs d'avatar personnalisées des joueurs (ou à la couleur par défaut).
- **Badges et succès** : système de gamification avec 15 badges débloqués automatiquement selon l'activité des joueurs (Première donne, Centurion, Kamikaze, Sans filet, Noctambule, etc.). Les badges se débloquent à la complétion d'une donne, à l'ajout d'une étoile, ou de manière rétroactive lors de la consultation des statistiques. Une modale dédiée s'affiche pour annoncer les nouveaux badges débloqués. Section grille dans les statistiques par joueur avec compteur (X/15), badges débloqués en premier avec date, badges verrouillés grisés.
- **Résumé de session** : écran récapitulatif visuel avec classement (podium + tableau), faits marquants (MVP, lanterne rouge, meilleure/pire donne, contrat favori, durée, nombre de donnes, étoiles) et titres humoristiques (Le Boucher, L'Éternel Défenseur, Le Flambeur). Accessible via le bouton graphique sur l'écran de session. Design optimisé pour le screenshot avec partage en image (Web Share API ou téléchargement).
- **Clôture de session** : bouton « Terminer la session » (icône cadenas) verrouillant la session pour empêcher la création de nouvelles donnes. La session peut être réouverte à tout moment. Le récap s'affiche automatiquement à la clôture.
- **Clôture en masse** : depuis la page d'un groupe de joueurs, bouton « Clôturer les sessions » pour terminer toutes les sessions ouvertes du groupe en un clic.
- **QR code de partage** : bouton « Partager » (icône QR code) sur l'écran de session, affichant un QR code encodant l'URL directe de la session. Mode plein écran disponible pour faciliter le scan par les autres joueurs. Nouvelle dépendance `qrcode.react`.
- **Records personnels** : meilleur/pire score, série de victoires consécutives, meilleure session, plus grand écart de points. Chaque record indique la valeur, la date, le contrat et un lien vers la session. Affiché sur la page de statistiques par joueur en remplacement des simples meilleur/pire scores.
- **Taux de réussite par contrat et par joueur** : tableau croisé joueurs × contrats sur la page Statistiques, montrant le pourcentage de victoire et le nombre de donnes pour chaque joueur en tant que preneur. Cellules colorées pour une lecture rapide. Nouveau endpoint `contractSuccessRateByPlayer` dans l'API statistiques globales, composant `ContractSuccessRateTable`.
- **Graphique d'évolution ELO globale** : sur la page Statistiques, un graphique multi-lignes montre l'évolution du rating ELO de tous les joueurs au fil des donnes. Chips cliquables pour filtrer par joueur, couleur personnalisée, ligne de référence à 1500. Nouveau endpoint `eloEvolution` dans l'API statistiques globales, composant `GlobalEloEvolutionChart`.
- **Toggle thème sombre** : bouton lune/soleil dans le header (à gauche de l'aide) pour basculer entre les modes clair et sombre. Détection automatique de la préférence système au premier lancement, persistance du choix en localStorage.
- **Couleur d'avatar personnalisée** : choix d'une couleur pour l'avatar d'un joueur (palette de 10 couleurs prédéfinies + sélecteur libre), avec option « Auto » pour revenir à la couleur déterministe par défaut. La couleur choisie est utilisée partout où l'avatar apparaît (sessions, classements, statistiques, historique des donnes). Champ `color` ajouté à l'entité `Player` et propagé dans les endpoints statistiques (`playerColor`).
- **Undo rapide** : bouton flottant « Annuler » avec décompte circulaire de 5 secondes après chaque saisie de donne, permettant de supprimer instantanément la dernière donne sans passer par la modale de suppression.
- **Tri et limite des sessions récentes** : l'API retourne les 5 sessions les plus récemment jouées (triées par date de dernière donne), au lieu de toutes les sessions sans tri.
- **Pagination de l'historique des donnes** : les donnes sont désormais chargées par pages de 10 depuis l'API (`/sessions/{id}/games`), avec un bouton « Voir plus » pour charger la suite. Nouveau hook `useSessionGames` avec `useInfiniteQuery`. La donne en cours est désormais une propriété dédiée `inProgressGame` sur le détail de session, alimentée par le provider côté serveur. Extension Doctrine `CompletedGamesExtension` pour filtrer les donnes en cours du endpoint paginé.
- **Groupes de joueurs** : création de cercles de jeu avec statistiques et classements filtrés par groupe. Association automatique des sessions quand tous les joueurs sont membres. Association manuelle via sélecteur de groupe sur l'écran de session. Filtre par groupe sur toutes les statistiques et classements. Attribution de groupes depuis la modale d'édition joueur. Page Groupes dédiée dans la navigation. Section aide in-app.
- **Mèmes de victoire et défaite** : système de mèmes plein écran à la complétion d'une donne (~40 % de chance, 3 secondes). Composant `MemeOverlay`, services `selectVictoryMeme` / `selectDefeatMeme`, 16 images dans `public/memes/`.
- **Suivi de la durée des donnes** : nouveau champ `completedAt` sur les donnes, renseigné automatiquement à la complétion. Chronomètre en temps réel sur le bandeau de donne en cours. Durée affichée dans l'historique des donnes. Nouvelles statistiques globales (durée moyenne par donne, temps de jeu total) et par joueur. Utilitaire `formatDuration` et hook `useElapsedTime`.
- **Compatibilité Smart TV** : support des Smart TV Samsung (Tizen 5.0+) et LG (webOS 5.0+). Build ciblant `chrome64` pour transpiler les syntaxes ES2020+. Mise en page responsive grand écran (`font-size` 20px, contenu centré `max-w-4xl`, graphiques agrandis). Navigation D-pad via `:focus-visible` global avec anneau accent. Cibles tactiles minimales 40px sur les boutons critiques.
- **Classement ELO** : système de rating ELO dynamique entre joueurs, calculé après chaque donne en tenant compte du niveau des adversaires (K-factors différenciés : preneur 40, partenaire 25, défenseur 15). Entité `EloHistory`, service `EloCalculator`, intégration dans les processeurs de complétion et suppression de donne (avec revert automatique). Section « Classement ELO » dans les statistiques globales, carte ELO et graphique d'évolution dans les statistiques par joueur.
- **Raccourci « Même config »** : bouton dans la modale de nouvelle donne pour pré-remplir le preneur et le contrat de la dernière donne jouée.
- **Changement de joueurs** : depuis l'écran de session, bouton ⇄ pour modifier les joueurs sans repasser par l'accueil. Si les 5 joueurs choisis correspondent à une session active, navigation automatique vers celle-ci ; sinon, création d'une nouvelle session.
- **Système d'étoiles** : attribution d'étoiles aux joueurs pendant une session avec pénalité automatique tous les 3 étoiles (−100 pts pour le joueur pénalisé, +25 pts pour les 4 autres). Entité `StarEvent`, endpoint API, intégration dans les scores cumulés, classement et statistiques. Interface étoiles cliquables sur le tableau des scores.
- **Rotation du donneur** : attribution automatique du premier donneur à la création de session, rotation au joueur suivant après complétion d'une donne, icône de cartes sur le scoreboard et affichage dans la modale de saisie et l'historique.
- **Suppression d'une donne** : suppression de la dernière donne (en cours ou complétée) avec modale de confirmation, recalcul automatique des scores.
- **Statistiques globales** : écran `/stats` avec classement des joueurs (score total, taux de victoire), métriques clés (total donnes/sessions) et répartition des contrats en barres horizontales.
- **Statistiques par joueur** : écran `/stats/player/:id` avec métriques (donnes jouées, score moyen, meilleur/pire), répartition des rôles, contrats pris et graphique d'évolution des scores récents.
- **Évolution des scores en session** : graphique linéaire montrant les scores cumulés de chaque joueur au fil des donnes.
- **API statistiques backend** : `GET /api/statistics` et `GET /api/statistics/players/{id}`.
- **Formulaire de saisie des donnes** : wizard en 2 étapes — NewGameModal (preneur + contrat) et CompleteGameModal (partenaire, oudlers, points, bonus, aperçu scores).
- **Écran de session** : tableau des scores cumulés (Scoreboard), bandeau donne en cours (InProgressBanner), historique des donnes (GameList), bouton FAB nouvelle donne.
- **Écran d'accueil** : sélection de 5 joueurs (avec chips, recherche, création inline), démarrage/reprise de session, liste des sessions récentes.
- **Gestion des joueurs** : écran complet avec liste, recherche par nom, ajout via formulaire modal, gestion des doublons (erreur 422).
- **Modification et désactivation des joueurs** : modale de modification avec champ nom et toggle actif/inactif. Les joueurs inactifs sont affichés avec nom barré et badge « Inactif ».
- **Navigation clavier dans la recherche de joueurs** : flèches ↑/↓ pour parcourir les résultats, Entrée pour sélectionner, Échap pour fermer. Pattern combobox ARIA complet.
- **Design system** : thème Tailwind CSS 4 complet avec tokens de couleur (accent, surface, texte, score, contrat, avatar) et support du mode sombre via `@custom-variant dark`.
- **Composants UI** : PlayerAvatar, ContractBadge, ScoreDisplay, FAB, Modal, Stepper, SearchInput, Select, OverflowMenu.
- **Hooks utilitaires** : `useAnimatedCounter`, `useDebounce`, `useElapsedTime`, `useSession`, `useSessionGames`, `useSessions`, `useCreateSession`, `useCreateGame`, `useCompleteGame`, `usePlayers`, `useCreatePlayer`, `useUpdatePlayer`, `useGlobalStats`, `usePlayerStats`.
- **Service `calculateScore`** : miroir frontend du ScoreCalculator backend pour aperçu des scores en temps réel.
- **Confirmation étoile** : modale de confirmation avant attribution d'une étoile.
- **Forcer le donneur** : possibilité de changer manuellement le donneur d'une session.
- **Pré-remplissage nom joueur** : le champ nom de la modale « Nouveau joueur » est pré-rempli avec le texte de recherche.
- **Page d'aide in-app** : page `/aide` avec guide utilisateur en accordéons dépliables.
- **Guide de contribution** : fichier `CONTRIBUTING.md` à la racine du projet.
- **Hookify rules** : 4 règles de garde automatiques — `require-ddev-exec`, `no-schema-update`, `no-dump-functions`, `no-console-log`.
- **Documentation** : guide utilisateur (`docs/user-guide.md`) et référence développeur (`docs/frontend-usage.md`).
- **Tests** : 207 tests frontend (30 fichiers) + 22 tests API fonctionnels + 35 tests unitaires ScoreCalculator.
- **Infrastructure** : DDEV (PHP 8.3, MariaDB 10.11), Symfony 7.4, API Platform 4, React 19, Vite, TanStack Query, PWA.

### Changed

- **Lazy-load et code-splitting** : toutes les pages (sauf Home) sont chargées en lazy-loading via `React.lazy()`, et `recharts` est isolé dans un chunk dédié via `manualChunks`.
- **Clôture de sessions (groupe)** : le bouton « Clôturer les sessions » ouvre désormais une modale de confirmation au lieu d'un `window.confirm()`.
- **Nettoyage backend** : suppression des annotations `@throws` trompeuses, extraction du `GroupFilterTrait`, correction du risque N+1 sur `Session::getLastPlayedAt()`.
- **Index composites** : ajout d'index composites sur `game(session_id, status)`, `score_entry(game_id, player_id)` et `star_event(session_id, player_id)`.
- **BadgeChecker : requêtes en batch** : pré-charge toutes les statistiques en batch (~12 requêtes) au lieu de requêtes individuelles (~75+). Introduit `BadgeCheckContext`.
- **EloCalculator : identification par ID** : utilise les IDs des joueurs comme clés du tableau `$ratings` au lieu des noms.
- **Services `final readonly`** : `ScoreCalculator`, `EloCalculator`, `GlobalStatisticsService`, `PlayerStatisticsService` et `SessionSummaryService`.
- **Badges : suppression du side-effect sur GET statistiques** : le check de badges est retiré de `GET /api/statistics/players/{id}`. Les badges sont vérifiés uniquement à la complétion d'une donne et à l'ajout d'étoiles.
- **Requêtes BDD centralisées dans les repositories** : toutes les requêtes Doctrine (~73) migrées vers des repositories dédiés. Utilisation exclusive du QueryBuilder.
- **DTOs typés pour les retours de repositories** : 22 DTOs dans `src/Dto/` avec l'opérateur `NEW` de Doctrine.
- **Joueurs — dernière activité** : la page Joueurs affiche la date de dernière activité en format relatif.
- **Statistiques — sections en menu déroulant** : métriques clés et classement en haut, puis menu déroulant pour la section détaillée.
- **Badges — masquer les verrouillés par défaut** : seuls les badges débloqués sont affichés. Un bouton « Voir les X restants » permet de révéler les badges verrouillés.
- **Graphique ELO global** : les chips de filtrage sont remplacées par un menu déroulant « Joueurs » avec indicateurs de couleur.
- **Session — menu overflow** : toutes les actions du header regroupées dans un menu « ⋮ ». Le header passe à une seule ligne.
- **Toggle thème sombre** : déplacé du header global vers la page d'accueil.
- **Bouton d'aide** : visible uniquement sur la page d'accueil.
- **Accueil — refonte mobile** : sessions récentes en haut, sélection des joueurs en bas (zone du pouce). Le bouton « Démarrer » apparaît à la place de la barre de recherche une fois les 5 joueurs sélectionnés.
- **Accueil — sélection des joueurs** : les joueurs apparaissent uniquement lors d'une recherche.
- **Historique des donnes** : boutons Modifier et Supprimer déplacés sur une ligne séparée avec taille augmentée.
- **Commandes simplifiées** : cibles Makefile au lieu des commandes `ddev exec` verbeuses.

### Fixed

- **Classement par groupe** : la requête joignait la session via `ScoreEntry.session` (toujours `null`). La jointure passe désormais par `Game.session`.
- **Documentation API désactivée en production** : la doc Swagger/OpenAPI et l'entrypoint API Platform sont désactivés en production.
- **Pagination max par page** : plafond de 50 éléments par page avec contrôle client `?itemsPerPage=N`.
- **Session PHP désactivée en production** : la session PHP (`PHPSESSID`) est désactivée en production (API stateless).
- **Validation de longueur des noms** : contraintes `Assert\Length` sur `Player::$name` (max 50) et `PlayerGroup::$name` (max 100).
- **Validation des oudlers et points** : les champs `oudlers` (0–3) et `points` (0–91) sont validés par des contraintes `Range`.
- **Validation du preneur à la création de donne** : le preneur est vérifié comme appartenant à la session dans le processeur et le validateur.
- **APP_SECRET retiré du contrôle de version** : le secret n'est plus stocké en dur dans `.env.dev`.
- **Dark mode — contraste** : textes secondaires plus lisibles en mode sombre (conformité WCAG AA 4.5:1).
- **Page blanche au clic sur un groupe** : groupe de sérialisation manquant sur `Player`.
- **Création joueur depuis le formulaire de groupe** : le submit remontait via le portal React.
- **Classement vide dans les stats d'un groupe** : INNER JOINs mutuellement exclusifs corrigés.
- **Groupes non pré-sélectionnés dans la modale d'édition joueur** : groupes de sérialisation manquants.
- **Accueil — centrage et débordement** : titre, avatars et compteur centrés ; chips en `flex-wrap`.
- **DevTools en production** : React Query DevTools ne sont plus chargées en production.

### Removed

- **Mème « First Time? »** : supprimé (incompatible avec la pagination côté serveur).
