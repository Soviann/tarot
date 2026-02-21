# Tarot Score Tracker — Guide utilisateur

Application mobile (PWA) de suivi des scores pour le Tarot à 5 joueurs, conforme aux règles officielles de la FFT.

> **Astuce** : ce guide est aussi accessible directement dans l'application via l'icône **?** sur la page d'accueil, à droite du titre « Sessions récentes » (page `/aide`).

## Table des matières

- [Installation](#installation)
- [Concepts clés](#concepts-clés)
- [Gestion des joueurs](#gestion-des-joueurs)
- [Démarrer une session](#démarrer-une-session)
- [Écran de session](#écran-de-session)
- [Terminer une session et récapitulatif](#terminer-une-session-et-récapitulatif)
- [Saisir une donne](#saisir-une-donne)
- [Groupes de joueurs](#groupes-de-joueurs)
- [Consulter les statistiques](#consulter-les-statistiques)
- [Système d'étoiles](#système-détoiles)
- [Classement ELO](#classement-elo)
- [Utilisation sur Smart TV](#utilisation-sur-smart-tv)
- [Mèmes](#mèmes)
- [Badges et succès](#badges-et-succès)
- [Thème sombre](#thème-sombre)
- [Chargement et états vides](#chargement-et-états-vides)
- [Règles de calcul des scores](#règles-de-calcul-des-scores)

---

## Installation

L'application est une **Progressive Web App** (PWA). Elle s'utilise dans un navigateur mobile et peut être ajoutée à l'écran d'accueil :

1. Ouvrir **https://web-tarot.cafe76.fr** dans **Chrome** (Android) ou **Safari** (iOS)
2. Appuyer sur le menu du navigateur (⋮ ou ⬆️ Partager)
3. Sélectionner **« Ajouter à l'écran d'accueil »**
4. L'icône apparaît comme une application native

> **Note** : les fonctionnalités hors-ligne sont prévues dans une version future.

---

## Concepts clés

| Terme | Signification |
|-------|---------------|
| **Joueur** | Personne inscrite dans l'application (nom unique) |
| **Session** | Partie regroupant exactement 5 joueurs. Peut contenir plusieurs donnes. |
| **Donne** | Un tour de jeu (une « main »). Chaque donne a un preneur, un contrat, et produit des scores. |
| **Preneur** | Le joueur qui a pris (annoncé un contrat) |
| **Partenaire** | Le joueur dont le roi a été appelé par le preneur (peut être le preneur lui-même s'il appelle son propre roi) |
| **Contrat** | Engagement du preneur : Petite, Garde, Garde Sans, Garde Contre |
| **Groupe** | Cercle de jeu regroupant des joueurs (ex : « soirées du mardi »). Permet de filtrer les statistiques. |
| **Donneur** | Le joueur qui distribue les cartes. Tourne automatiquement après chaque donne. |

---

## Gestion des joueurs

Accessible via l'onglet **Joueurs** dans la barre de navigation basse.

Chaque joueur affiche sous son nom sa **dernière activité** en format relatif (« Aujourd'hui », « Hier », « Il y a 3 jours »…). Si le joueur n'a encore participé à aucune donne, la date de création est affichée à la place.

**Appuyer sur la ligne d'un joueur** (avatar, nom ou date) pour accéder directement à sa page de statistiques détaillées.

### Ajouter un joueur

1. Appuyer sur le bouton **+** (en bas à droite)
2. Saisir le nom du joueur
3. Valider

> Chaque joueur possède un **avatar coloré** généré automatiquement à partir de ses initiales. Par défaut, la couleur est déterministe (basée sur l'ID du joueur). Il est possible de **personnaliser cette couleur** depuis la modale de modification (voir ci-dessous).

### Modifier un joueur

1. Sur l'écran **Joueurs**, repérer le joueur dans la liste
2. Appuyer sur le bouton **crayon** (✏️) à droite du joueur
3. La modale « Modifier le joueur » s'ouvre avec le nom pré-rempli
4. Modifier le **nom** si souhaité
5. Choisir une **couleur d'avatar** :
   - **Auto** : couleur déterministe par défaut (basée sur l'ID)
   - **Palette** : 10 couleurs prédéfinies (rouge, orange, jaune, vert, turquoise, bleu, indigo, violet, rose, gris)
   - **Personnalisée** : sélecteur de couleur libre (cercle coloré à droite de la palette)
6. Utiliser l'**interrupteur « Joueur actif »** pour activer ou désactiver le joueur
7. Appuyer sur **Enregistrer**

> **Désactivation** : un joueur désactivé reste visible dans la liste (nom barré + badge « Inactif » + avatar grisé), mais **n'apparaît plus** dans la sélection de joueurs lors de la création d'une session. Ses données historiques (scores, statistiques, classement ELO) sont conservées.

> **Réactivation** : pour réactiver un joueur, ouvrir la modale de modification et remettre l'interrupteur sur « actif ».

### Rechercher un joueur

Utiliser la barre de recherche en haut de la liste pour filtrer par nom.

---

## Démarrer une session

L'écran **Accueil** est organisé pour un usage mobile à une main :

### Sessions récentes

En haut de l'écran, les **sessions récentes** permettent de reprendre rapidement une partie existante. Chaque session affiche les noms des joueurs, la **date de la dernière donne** jouée et un badge « En cours » le cas échéant.

### Nouvelle session

En bas de l'écran, la zone de sélection des joueurs est accessible au pouce :

1. **Rechercher** un joueur dans la barre de recherche — les résultats s'affichent dans un menu déroulant **au-dessus** du champ (optimisé pour mobile : visible même avec le clavier ouvert)
2. Sélectionner **5 joueurs** parmi les résultats — le focus reste sur le champ de recherche après chaque sélection pour enchaîner rapidement
   - Utiliser les flèches **↑/↓** pour parcourir la liste, **Entrée** pour sélectionner, **Échap** pour fermer la liste
   - Possibilité d'ajouter un nouveau joueur à la volée avec **« + Nouveau joueur »** (dans le menu déroulant)
3. Une fois les 5 joueurs sélectionnés, la barre de recherche se transforme en bouton **« Démarrer la session »** — appuyer dessus pour lancer la partie

> **Session intelligente** : si une session active existe déjà avec les mêmes 5 joueurs, l'application la reprend automatiquement au lieu d'en créer une nouvelle.

### Donneur

À la création d'une session, le **premier joueur** (ordre alphabétique) est désigné comme donneur. Après chaque donne terminée, le donneur **tourne automatiquement** au joueur suivant. Après le dernier joueur, la rotation reprend au premier (cycle). L'ordre de rotation suit l'**ordre personnalisé** des joueurs s'il a été défini (voir ci-dessous), sinon l'ordre alphabétique par défaut.

Le donneur actuel est identifiable par un **icône de cartes** bleu sur son avatar dans le tableau des scores.

#### Forcer le donneur

Si le donneur automatique ne correspond pas (reprise de partie, erreur de rotation, convention de table différente), il est possible de le **changer manuellement** :

1. Appuyer sur l'**icône de cartes** (badge bleu) du donneur actuel dans le tableau des scores
2. Une modale « Choisir le donneur » s'affiche avec les 5 avatars
3. Sélectionner le nouveau donneur
4. Appuyer sur **Valider**

> Le donneur sélectionné doit être un joueur de la session. La rotation automatique reprend normalement à partir du nouveau donneur.

#### Changer l'ordre des joueurs

Par défaut, les joueurs sont affichés et la rotation du donneur suit l'**ordre alphabétique**. Pour adapter l'ordre à la disposition physique autour de la table :

1. Ouvrir le **menu ⋮** en haut à droite
2. Appuyer sur **« Changer l'ordre »** (disponible uniquement quand la session est active et aucune donne n'est en cours)
3. Utiliser les **flèches haut/bas** pour déplacer chaque joueur
4. Appuyer sur **Valider**

L'ordre personnalisé s'applique au **tableau des scores**, au **graphe d'évolution**, à la **sélection du preneur/appelé** et à la **rotation du donneur**.

> Pour réinitialiser l'ordre alphabétique, il suffit de ré-ordonner manuellement les joueurs dans l'ordre alphabétique.

---

## Écran de session

L'écran de session affiche :

### Tableau des scores

En haut de l'écran, un bandeau horizontal scrollable montre les **5 joueurs** avec leur **score cumulé** :

- Score **positif** → affiché en **vert**
- Score **négatif** → affiché en **rouge**
- Score **nul** → affiché en gris
- Un **icône de cartes** (accent bleu) apparaît sur l'avatar du **donneur actuel**

### Donne en cours

Si une donne est en cours (étape 1 validée, étape 2 en attente), un bandeau bien visible indique le preneur, le contrat et un **chronomètre** affichant le temps écoulé depuis le début de la donne, avec un bouton **« Compléter »**.

### Historique des donnes

Liste paginée des donnes jouées (les 10 plus récentes en premier, avec un bouton « Voir plus » pour charger la suite), montrant pour chaque donne :

- Le **numéro de la donne** (#1, #2, #3…)
- Le preneur et son partenaire
- Le donneur de la donne
- Le contrat (badge coloré) et la **durée de la donne** (si disponible)
- Le résultat (gain/perte du preneur)

Au **clic sur une donne**, un panneau dépliable affiche le détail :

- **Nombre de bouts** et **écart par rapport au contrat** (ex. « 2 bouts · +15 »)
- Score de chaque joueur dans l'ordre : **preneur** → **appelé** → **défense**, avec indicateur +/−

### Menu d'actions (⋮)

La ligne du header de session affiche un bouton **⋮** (trois points verticaux) qui regroupe les actions secondaires :

- **Récap de session** : ouvre le récapitulatif de la session
- **Partager (QR)** : affiche un QR code pour partager l'URL de la session
- **Modifier les joueurs** : change un ou plusieurs joueurs de la session
- **Changer le groupe** : associe la session à un groupe de joueurs (visible uniquement si des groupes existent)
- **Terminer la session** : clôture définitive de la session (visible uniquement si la session est active)

### Modifier les joueurs

Depuis le menu **⋮**, appuyer sur **Modifier les joueurs** :

1. La modale de sélection s'ouvre avec les **5 joueurs actuels** pré-sélectionnés
2. Désélectionner le(s) joueur(s) à remplacer et sélectionner le(s) nouveau(x)
3. Appuyer sur **Confirmer**

> **Session intelligente** : si une session active existe déjà avec les 5 joueurs choisis, l'application y navigue directement. Sinon, une nouvelle session est créée.

> **Note** : l'option est **désactivée** tant qu'une donne est en cours. Terminez ou supprimez la donne avant de modifier les joueurs.

### Partager une session (QR code)

Pour permettre aux autres joueurs de suivre les scores sur leur propre téléphone :

1. Appuyer sur le menu **⋮** puis **Partager (QR)**
2. Une modale affiche un **QR code** encodant l'URL de la session
3. Les autres joueurs scannent le QR code avec leur appareil photo pour ouvrir la session en **mode consultation**
4. Appuyer sur **« Plein écran »** pour agrandir le QR code (facilite le scan à distance ou depuis une TV)

> **Note** : toute personne ayant l'URL peut interagir avec la session. En pratique, seul l'organisateur saisit les donnes.

### Actions

- **Bouton + (FAB)** : démarrer une nouvelle donne (désactivé si une donne est en cours)
- **Modifier** : bouton affiché sur la dernière donne pour modifier ses paramètres

---

## Groupes de joueurs

Les groupes permettent de créer des **cercles de jeu** (ex : « soirées du mardi », « famille ») et d'afficher des statistiques propres à chaque groupe.

### Créer un groupe

1. Aller dans l'onglet **Groupes** dans la barre de navigation basse
2. Appuyer sur le bouton **+** (en bas à droite)
3. Saisir un nom et sélectionner les joueurs membres
4. Valider

### Gérer un groupe

Appuyer sur un groupe pour accéder à sa fiche détaillée :

- **Modifier le nom** : appuyer sur le bouton crayon à côté du nom
- **Ajouter des membres** : bouton « + Ajouter des joueurs » en bas de la liste
- **Retirer un membre** : bouton ✕ à côté du joueur
- **Supprimer le groupe** : bouton rouge en bas de la page (avec confirmation)

### Association automatique

Quand tous les joueurs d'une session appartiennent à un **seul et même groupe**, la session est automatiquement associée à ce groupe lors de sa création.

### Association manuelle

Depuis le menu **⋮** de l'écran de session, l'option **Changer le groupe** ouvre une modale permettant de changer le groupe associé. Si des joueurs de la session ne sont pas encore membres du groupe sélectionné, ils sont **automatiquement ajoutés** au groupe.

### Statistiques par groupe

Sur les pages **Statistiques** et **Statistiques par joueur**, un filtre permet de voir les classements et scores uniquement pour les sessions d'un groupe donné. Le filtre n'apparaît que si au moins un groupe existe.

---

## Terminer une session et récapitulatif

### Clôturer une session

Pour marquer une session comme terminée (plus de nouvelles donnes possibles) :

1. Depuis le menu **⋮**, appuyer sur **Terminer la session**
2. Confirmer dans la modale de confirmation
3. La session passe en mode « terminée » et le **récapitulatif** s'affiche automatiquement
4. Un bandeau ambre « Session terminée » apparaît sur l'écran de session

> **Note** : la clôture d'une session est définitive. Une fois terminée, la session ne peut plus être réouverte.

### Récapitulatif de session

Le récapitulatif est accessible **à tout moment** via le menu **⋮** → **Récap de session** dans la barre du titre de l'écran de session, que la session soit ouverte ou clôturée.

Il affiche :

- **Podium** : les 3 premiers joueurs avec médailles (🥇🥈🥉) et scores
- **Classement complet** : les 5 joueurs triés par score décroissant
- **Faits marquants** :
  - 🏆 MVP (meilleur score)
  - 😢 Lanterne rouge (pire score)
  - 🎯 Meilleure donne (plus gros gain du preneur)
  - 💀 Pire donne (plus grosse perte du preneur)
  - 📊 Contrat le plus joué
  - ⏱️ Durée totale
  - 🃏 Nombre de donnes
  - ⭐ Étoiles distribuées
- **Titres humoristiques** (à partir de 3 donnes) :
  - « Le Boucher » : a infligé le plus de points aux défenseurs
  - « L'Éternel Défenseur » : a le moins pris
  - « Le Flambeur » : a tenté le plus de Garde Sans/Contre

### Partager le récapitulatif

Sur l'écran récapitulatif, le bouton **« Partager »** génère une image du récap :

- Sur mobile : ouvre le menu de partage natif (WhatsApp, iMessage, etc.)
- Sur les autres appareils : télécharge directement l'image PNG

### Clôturer toutes les sessions d'un groupe

Depuis la page d'un **groupe de joueurs** (menu Groupes → sélectionner un groupe), le bouton **« Clôturer les sessions »** ouvre une modale de confirmation. Après validation, toutes les sessions ouvertes du groupe sont clôturées.

---

## Saisir une donne

La saisie se fait en **2 étapes** :

### Étape 1 — Début de la donne

> Le nom du **donneur actuel** est affiché en haut de la modale pour rappel.

1. **Sélectionner le preneur** : appuyer sur l'avatar d'un des 5 joueurs
2. **Choisir le contrat** :
   - 🟢 **Petite** (×1)
   - 🔵 **Garde** (×2)
   - 🟠 **Garde Sans** (×4)
   - 🔴 **Garde Contre** (×6)
3. Appuyer sur **Valider**

> **Raccourci « Même config »** : si au moins une donne a déjà été jouée, un bouton **« Même config »** apparaît en haut de la modale. Il pré-remplit automatiquement le preneur et le contrat de la dernière donne, ce qui est pratique quand un joueur prend plusieurs fois de suite. Les valeurs pré-remplies restent modifiables.

> La donne est créée avec le statut « en cours ». On peut continuer à jouer et compléter plus tard.

### Étape 2 — Fin de la donne

1. **Sélectionner le partenaire** : appuyer sur l'avatar du joueur appelé, ou **« Seul »** si le preneur appelle son propre roi. Le bandeau en haut de la modale affiche l'appelé à côté du preneur pour vérification rapide.
2. **Nombre d'oudlers** : utiliser le stepper (0 à 3)
3. **Points réalisés** : saisir le total de points du camp attaquant (0 à 91)
4. **Bonus** (section dépliable, optionnel) :
   - **Poignée** : Simple / Double / Triple + qui la montre (Attaque / Défense)
   - **Petit au bout** : Attaque / Défense
   - **Chelem** : Annoncé gagné / Annoncé perdu / Non annoncé gagné
5. **Aperçu** : le détail du calcul des scores s'affiche avant validation
6. Appuyer sur **Valider**

> Les scores sont calculés automatiquement selon les règles FFT et répartis entre les joueurs.

### Annuler rapidement la dernière donne

Après la validation d'une donne, un **bouton flottant « Annuler »** (en bas à gauche) apparaît pendant **5 secondes** avec un décompte circulaire visuel. Appuyer dessus **supprime immédiatement** la donne qui vient d'être saisie. Si le décompte arrive à zéro sans appui, le bouton disparaît automatiquement.

> **Astuce** : pratique en cas d'erreur de saisie détectée juste après validation, sans passer par la modale de suppression.

### Modifier la dernière donne

Seule la **dernière donne** de la session est modifiable (uniquement si la session est encore **en cours** — les boutons sont masqués sur une session terminée). Pour la modifier :

1. Appuyer sur le bouton **« Modifier »** affiché à côté de la dernière donne dans l'historique
2. Modifier les paramètres souhaités (partenaire, oudlers, points, bonus)
3. Appuyer sur **Valider** → les scores sont recalculés

### Supprimer la dernière donne

Seule la **dernière donne** peut être supprimée (erreur de saisie, donne annulée), uniquement si la session est **en cours**. Deux cas :

- **Donne terminée** : appuyer sur le bouton **« Supprimer »** (en rouge) à côté de la dernière donne dans l'historique
- **Donne en cours** : appuyer sur le bouton **« Annuler »** dans le bandeau de donne en cours

Dans les deux cas, une **confirmation** est demandée. Après suppression, les scores cumulés de la session sont automatiquement recalculés.

---

## Consulter les statistiques

Accessible via l'onglet **Stats** dans la barre de navigation.

### Classement global

L'écran principal des statistiques affiche :

- **Métriques** (toujours visibles) : nombre total de donnes, de sessions jouées, **durée moyenne par donne** et **temps de jeu total** (si des donnes avec suivi de durée existent)
- **Classement** (toujours visible) : tous les joueurs triés par score total décroissant, avec nombre de donnes jouées et taux de victoire en tant que preneur. Limité à 10 joueurs par défaut, avec un bouton « Voir plus » pour afficher les suivants
- **Menu déroulant de section** : un sélecteur permet de choisir la section affichée parmi :
  - **Classement ELO** (par défaut) : joueurs triés par rating décroissant, limité à 10 avec « Voir plus »
  - **Évolution ELO** : graphique multi-lignes avec filtrage par joueur
  - **Répartition des contrats** : graphique à barres horizontales par type de contrat
  - **Taux de réussite par contrat** : tableau croisé joueurs × contrats avec code couleur

Appuyer sur un joueur dans le classement pour voir ses statistiques détaillées.

### Statistiques par joueur

L'écran de détail d'un joueur affiche :

- **Métriques clés** (toujours visibles) : donnes jouées, taux de victoire (en tant que preneur), score moyen, sessions jouées, **durée moyenne par donne** et **temps de jeu total** (si disponible)
- **Groupes** (toujours visibles) : badges cliquables vers la page du groupe
- **Menu déroulant de section** : un sélecteur permet de choisir la section affichée parmi :
  - **Records personnels** (par défaut) : meilleur score, pire score, série de victoires consécutives (en tant que preneur), meilleure session (total de points dans une session) et plus grand écart (différence entre points réalisés et points requis). Chaque record indique la date, le contrat (si applicable) et un bouton « Voir ». Pour les records liés à une donne (meilleur score, pire score, plus grand écart), le bouton ouvre une modale affichant le détail de la donne (preneur, appelé, scores de chaque joueur). Pour la meilleure session, le bouton redirige vers la page de la session.
  - **Badges** : grille des badges débloqués (verrouillés masqués par défaut, révélables via un bouton)
  - **Étoiles** (masquée si aucune étoile) : nombre total d'étoiles, pénalités, ratio par donne et par session, record en une session et nombre de sessions avec étoiles
  - **Répartition des rôles** : diagramme camembert montrant combien de fois le joueur a été preneur, partenaire ou défenseur, avec légende et valeurs numériques
  - **Contrats** : diagramme camembert des contrats joués en tant que preneur, avec légende et valeurs numériques
  - **Évolution des scores** : graphique linéaire des 50 derniers scores
  - **Évolution ELO** : courbe ELO au fil des donnes

### Évolution des scores en session

Depuis l'**écran de session**, un graphique d'évolution apparaît automatiquement dès qu'au moins **2 donnes sont terminées**. Il montre les scores cumulés de chaque joueur au fil des donnes, avec une ligne de couleur par joueur. Des **chips colorées** au-dessus du graphique permettent d'identifier chaque joueur et de masquer/afficher ses scores en cliquant dessus. Les couleurs correspondent aux couleurs d'avatar des joueurs.

---

## Système d'étoiles

Le système d'étoiles permet de **pénaliser** un joueur en dehors du jeu de cartes (retard, mauvaise conduite, etc.).

### Fonctionnement

- Chaque joueur peut recevoir des étoiles pendant une session
- Les étoiles sont visibles sous le score de chaque joueur dans le **tableau des scores** (0 à 2 étoiles jaunes)
- Lorsqu'un joueur atteint **3 étoiles**, une **pénalité automatique** se déclenche :
  - Le joueur pénalisé perd **100 points**
  - Les 4 autres joueurs gagnent chacun **25 points**
  - Le compteur d'étoiles redevient à 0 (cycle : 3 → 0, 6 → 0, etc.)

### Ajouter une étoile

1. Sur l'**écran de session**, repérer le joueur dans le tableau des scores
2. Appuyer sur la zone d'étoiles (☆☆☆) sous le score du joueur
3. Une modale de **confirmation** s'affiche : « Attribuer une étoile à [nom] ? »
4. Appuyer sur **Confirmer** pour valider, ou **Annuler** pour revenir sans rien faire

### Impact sur les scores

- Les pénalités d'étoiles sont **incluses dans les scores cumulés** de la session
- Les pénalités apparaissent dans le **classement global** des statistiques
- Les statistiques d'un joueur affichent une section **« Étoiles »** dédiée avec le nombre total, les pénalités, le ratio par donne/session, le record en une session et le nombre de sessions avec étoiles

> **Note** : la somme des scores de pénalité est toujours nulle (−100 + 4 × 25 = 0).

---

## Classement ELO

Le système ELO fournit un **classement dynamique** qui tient compte du niveau des adversaires, contrairement au score total.

### Qu’est-ce que l’ELO ?

L’**ELO** est un système de **rating** (note) qui vise à estimer le **niveau relatif** d’un joueur à partir de ses résultats.

- Chaque joueur a une valeur numérique (ex : **1500** au départ).
- Après une partie, la note **monte** si le résultat est meilleur que prévu, et **baisse** si le résultat est moins bon que prévu.
- Le “prévu” dépend de l’écart de niveau :  
  battre plus fort que soi fait gagner **plus**, perdre contre plus faible fait perdre **plus**.

Dans un système ELO classique, on calcule d’abord un **score attendu** (une probabilité de gagner) selon l’écart de rating, puis on applique une correction :
`nouveauElo = ancienElo + K × (résultatRéel − résultatAttendu)`  
où **K** règle la vitesse à laquelle le rating évolue (plus K est grand, plus ça bouge).

> Dans cette application, l’ELO est adapté au Tarot à 5 : on compare chaque joueur à la **moyenne ELO du camp adverse**, et le preneur a un impact plus fort que le partenaire, lui-même plus que les défenseurs.

### Fonctionnement

- Chaque joueur démarre à **1500 ELO**
- Après chaque donne, l'ELO de chaque joueur évolue selon le résultat et le niveau des adversaires
- Battre des joueurs mieux classés rapporte **plus de points** ; battre des joueurs moins bien classés en rapporte **moins**
- Le preneur voit son ELO évoluer **plus fortement** que le partenaire, qui évolue lui-même plus que les défenseurs

### Où le trouver

- **Page Statistiques** : une section **« Classement ELO »** affiche tous les joueurs triés par rating décroissant, avec un code couleur (vert > 1500, rouge < 1500). En dessous, un graphique **« Évolution ELO »** montre les courbes de tous les joueurs sur un même graphique, avec un menu déroulant « Joueurs » pour masquer/afficher chaque joueur. La ligne de référence à 1500 sert de repère.
- **Statistiques d'un joueur** : la carte « ELO » affiche le rating actuel, et un graphique **« Évolution ELO »** montre la courbe au fil des donnes

### Recalcul et suppression

- La **modification** d'une donne recalcule automatiquement les ELO
- La **suppression** d'une donne annule ses effets sur les ELO (retour à l'état précédent)

---

## Utilisation sur Smart TV

L'application est compatible avec les **Smart TV** Samsung (Tizen 5.0+) et LG (webOS 5.0+).

### Ouvrir l'application

1. Ouvrir le **navigateur intégré** de la TV (Samsung Internet ou LG Web Browser)
2. Saisir l'adresse **https://web-tarot.cafe76.fr**
3. L'interface s'adapte automatiquement à l'écran large : texte agrandi, contenu centré

### Navigation au D-pad (télécommande)

La navigation se fait entièrement avec les **flèches directionnelles** et le bouton **Enter/OK** de la télécommande :

- **Flèches haut/bas/gauche/droite** : déplacer le focus entre les éléments interactifs (boutons, liens, champs)
- **Enter/OK** : activer l'élément sélectionné (clic)
- **Retour** : revenir en arrière (selon le navigateur TV)

Un **anneau bleu** entoure l'élément actuellement focalisé pour indiquer la position du curseur.

> **Astuce** : dans les modales, le focus est piégé à l'intérieur — les flèches ne sortent pas de la modale tant qu'elle est ouverte. Utiliser le bouton de fermeture (✕) ou Échap pour la fermer.

---

## Mèmes

Après la saisie d'une donne, un **mème aléatoire** peut apparaître en plein écran pendant 3 secondes. Le système fonctionne en deux étapes :

1. **40 % de chance** qu'un mème s'affiche (un seul tirage)
2. Si le tirage passe, un mème est choisi au hasard parmi ceux éligibles, avec un **poids** (les mèmes à poids élevé sont plus probables)

- Cliquer ou toucher l'écran permet de **fermer le mème** immédiatement
- Les mèmes n'apparaissent que lors de la **première saisie** d'une donne, pas lors de la modification

### Easter egg — Score 42

| Condition | Image | Légende | Poids |
|-----------|-------|---------|-------|
| Score saisi = **42** points | Mind Blown | *42 — La réponse à la grande question* | Très élevé |

> Référence au *Guide du voyageur galactique* de Douglas Adams — 42 étant la réponse à la grande question sur la vie, l'univers et le reste. Se combine avec les mèmes de victoire ou de défaite dans le pool.

### Mèmes de victoire

| Condition | Image | Poids |
|-----------|-------|-------|
| Petit au bout attaque | Success Kid | Élevé |
| Victoire en solo | Obama se décore | Très élevé |
| Victoire (pool de base) | Borat "Great Success" | Normal |
| Victoire (pool de base) | Freddie Mercury Champions | Normal |
| Victoire (pool de base) | DiCaprio Toast | Normal |
| Victoire (pool de base) | It's Over 9000 | Normal |
| Victoire (pool de base) | Pacha (Le point parfait) | Normal |

### Mèmes de défaite

| Condition | Image | Poids |
|-----------|-------|-------|
| 3 bouts, chelem raté ou garde contre perdue | You Were the Chosen One | Très élevé |
| idem | Picard Facepalm | Élevé |
| idem | Pikachu surpris | Élevé |
| Garde sans perdue | Crying Michael Jordan | Élevé |
| Défaite (pool de base) | This is Fine | Normal |
| Défaite (pool de base) | Sad Pablo Escobar | Normal |
| Défaite (pool de base) | Ah Shit, Here We Go Again (CJ) | Normal |
| Défaite (pool de base) | Why Are We Still Here? | Normal |

---

## Badges et succès

L'application propose un système de **33 badges** (succès) que les joueurs débloquent automatiquement au fil de leurs parties.

### Catégories

| Catégorie | Badges |
|-----------|--------|
| **Progression** | 🎮 Première donne, 🔟 Habitué (10 sessions), 💯 Centurion (100 donnes), ⚾ Attrapez-les tous (obtenir tous les badges) |
| **Performance** | 🔥 Inarrêtable (5 victoires d'affilée), 👑 Premier Chelem, ⚔️ Kamikaze (Garde Contre), 🎯 Sans filet (Garde Sans réussie), 🃏 Petit malin (5 Petits au bout), 🛡️ Muraille (10 victoires défense d'affilée), 🎲 Audacieux (chelem annoncé), 🏆 Garde contre réussie, 🎩 Chelem surprise (chelem non annoncé), 🤲 Poignée triple, 🎯 Zéro bout (gagner avec 0 bout), 🤙 Auto-appel (gagner en s'appelant soi-même), 💪🦾🔥🌋☀️ Confortable +10/+20/+30/+40/+50 (gagner avec une marge croissante) |
| **Fun** | 📈 Comeback (dernier → premier), 💀 Lanterne rouge (5× dernier), ⭐ Collectionneur d'étoiles (10 étoiles), 😓 Si près du but (perdre à < 2 pts), 🤦 3 bouts pour rien (perdre avec 3 bouts), 📉 Série noire (5 défaites d'affilée), 🌟 Étoile montante (20 étoiles), ☄️ Pluie d'étoiles (3 étoiles en < 2h) |
| **Social** | 🌙 Noctambule (donne après minuit), ⏰ Marathon (session > 3h), 👥 Sociable (10 joueurs différents) |

> Un badge secret supplémentaire est caché dans l'application — à vous de le découvrir !

### Quand sont-ils débloqués ?

Les badges sont vérifiés automatiquement :
- À chaque **donne complétée** (pour tous les joueurs de la session)
- À chaque **étoile ajoutée** (pour tous les joueurs de la session)

### Notification

Quand un ou plusieurs badges sont débloqués, une **modale** s'affiche automatiquement sur l'écran de session, listant pour chaque joueur concerné les badges nouvellement obtenus (emoji + nom + description).

### Consulter ses badges

Sur la page **Statistiques d'un joueur** (accessible via Stats → clic sur un joueur), une section **Badges (X/33)** affiche :
- Les badges **débloqués** en premier, avec leur date d'obtention
- Un bouton **« Voir les X restants »** pour révéler les badges verrouillés (grisés, avec leur condition de déblocage)
- Un clic sur **« Masquer les badges verrouillés »** les cache à nouveau

### Liste complète dans l'aide

La page **Aide** (`/aide`) contient une section **Badges** listant l'ensemble des 32 badges visibles, regroupés par catégorie (Progression, Performance, Fun, Social), avec pour chacun l'icône, le nom et la condition d'obtention. Le badge secret n'y figure pas. Cette section est accessible sans nécessiter de données joueur.

---

## Thème sombre

L'application supporte un **mode sombre**. Pour basculer entre les thèmes clair et sombre, appuyer sur l'icône **lune** (☽) en haut à droite de l'écran. En mode sombre, l'icône devient un **soleil** (☀).

### Détection automatique

Au premier lancement, l'application suit la **préférence système** du navigateur (`prefers-color-scheme`). Si le système est en mode sombre, l'application l'adopte automatiquement.

### Persistance

Le choix est **mémorisé** automatiquement dans le navigateur (`localStorage`) et persiste entre les visites.

---

## Toasts de confirmation

Chaque action réussie déclenche un **toast de confirmation** — un petit bandeau discret qui apparaît en haut de l'écran et disparaît automatiquement après 2 secondes (3 secondes pour les erreurs).

Exemples : « Joueur créé », « Donne enregistrée », « Session terminée », « Étoile ajoutée », « Groupe supprimé », etc.

Les toasts s'empilent verticalement (3 maximum) et peuvent être fermés en les touchant ou avec les touches Entrée/Échap au clavier.

---

## Chargement et états vides

Pendant le chargement des données, un **spinner animé** (cercle tournant) s'affiche à la place du contenu. Cet indicateur est accessible aux lecteurs d'écran.

Quand une page est vide (aucun groupe, aucun joueur trouvé, aucun membre dans un groupe…), une **illustration avec un message explicatif** apparaît. Un bouton d'action est proposé lorsque c'est pertinent (ex : « Créer un groupe » sur la page des groupes vide).

---

## Règles de calcul des scores

L'application applique les **règles officielles FFT** pour le Tarot à 5 joueurs.

### Points nécessaires pour gagner

| Oudlers possédés | Points requis |
|------------------|---------------|
| 0 | 56 |
| 1 | 51 |
| 2 | 41 |
| 3 | 36 |

### Score de base

```
Score de base = (|points réalisés − points requis| + 25) × multiplicateur du contrat
```

| Contrat | Multiplicateur |
|---------|----------------|
| Petite | ×1 |
| Garde | ×2 |
| Garde Sans | ×4 |
| Garde Contre | ×6 |

Le score de base est **positif** si le preneur atteint les points requis, **négatif** sinon.

### Bonus

Les bonus sont ajoutés/soustraits **indépendamment** du multiplicateur de contrat (sauf le petit au bout) :

| Bonus | Valeur |
|-------|--------|
| Poignée simple (8 atouts) | +20 |
| Poignée double (10 atouts) | +30 |
| Poignée triple (13 atouts) | +40 |
| Petit au bout | 10 × multiplicateur |
| Chelem annoncé et gagné | +400 |
| Chelem annoncé et perdu | −200 |
| Chelem non annoncé et gagné | +200 |

> **Poignée** : toujours positive, attribuée au camp vainqueur.
> **Petit au bout** : positif si gagné par le camp qui l'a joué, négatif sinon.

### Répartition des scores (5 joueurs)

| Rôle | Score |
|------|-------|
| Preneur | base × 2 |
| Partenaire (appelé) | base × 1 |
| Chaque défenseur (×3) | base × −1 |

**Si le preneur appelle son propre roi** (pas de partenaire) :

| Rôle | Score |
|------|-------|
| Preneur | base × 4 |
| Chaque défenseur (×4) | base × −1 |

> La somme des scores de tous les joueurs est toujours égale à **0**.
