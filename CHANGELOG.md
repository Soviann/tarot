# Journal des modifications

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- **Mème Spiderman pointing** : affiche le mème "Spiderman pointing" lors d'une victoire en solo (appel à soi-même), poids 40
- **Mème Jordan Peele** : affiche le mème "Sweating Jordan Peele" lors d'une victoire serrée (marge ≤ 5 points), poids 20
- **Mème Chris Pratt "Wow"** : affiche le mème GIF Chris Pratt lors d'une victoire en garde-contre, poids 20
- **Mème "This is fine" boost** : le mème "This is fine" voit son poids fortement augmenté (20) lors d'une série de 3+ défaites consécutives du preneur
- **Mème "I'll be back"** : affiche le mème Terminator GIF lors d'une grosse défaite (score ≤ -50) suivant une grosse victoire (score ≥ 50) du preneur, poids 20
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
