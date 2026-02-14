# Tarot Score Tracker — Guide utilisateur

Application mobile (PWA) de suivi des scores pour le Tarot à 5 joueurs, conforme aux règles officielles de la FFT.

> **Astuce** : ce guide est aussi accessible directement dans l'application via l'icône **?** en haut à droite de chaque écran (page `/aide`).

## Table des matières

- [Installation](#installation)
- [Concepts clés](#concepts-clés)
- [Gestion des joueurs](#gestion-des-joueurs)
- [Démarrer une session](#démarrer-une-session)
- [Écran de session](#écran-de-session)
- [Saisir une donne](#saisir-une-donne)
- [Groupes de joueurs](#groupes-de-joueurs)
- [Consulter les statistiques](#consulter-les-statistiques)
- [Système d'étoiles](#système-détoiles)
- [Classement ELO](#classement-elo)
- [Utilisation sur Smart TV](#utilisation-sur-smart-tv)
- [Mèmes de victoire](#mèmes-de-victoire)
- [Mèmes de défaite](#mèmes-de-défaite)
- [Thème sombre](#thème-sombre)
- [Règles de calcul des scores](#règles-de-calcul-des-scores)

---

## Installation

L'application est une **Progressive Web App** (PWA). Elle s'utilise dans un navigateur mobile et peut être ajoutée à l'écran d'accueil :

1. Ouvrir l'application dans **Chrome** (Android) ou **Safari** (iOS)
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

1. **Rechercher** un joueur dans la barre de recherche — la liste des résultats apparaît en tapant un nom
2. Sélectionner **5 joueurs** parmi les résultats
   - Utiliser les flèches **↑/↓** pour parcourir la liste, **Entrée** pour sélectionner, **Échap** pour fermer la liste
   - Possibilité d'ajouter un nouveau joueur à la volée avec **« + Ajouter »**
3. Une fois les 5 joueurs sélectionnés, la barre de recherche se transforme en bouton **« Démarrer la session »** — appuyer dessus pour lancer la partie

> **Session intelligente** : si une session active existe déjà avec les mêmes 5 joueurs, l'application la reprend automatiquement au lieu d'en créer une nouvelle.

### Donneur

À la création d'une session, le **premier joueur** (ordre alphabétique) est désigné comme donneur. Après chaque donne terminée, le donneur **tourne automatiquement** au joueur suivant dans l'ordre alphabétique. Après le dernier joueur, la rotation reprend au premier (cycle).

Le donneur actuel est identifiable par un **icône de cartes** bleu sur son avatar dans le tableau des scores.

#### Forcer le donneur

Si le donneur automatique ne correspond pas (reprise de partie, erreur de rotation, convention de table différente), il est possible de le **changer manuellement** :

1. Appuyer sur l'**icône de cartes** (badge bleu) du donneur actuel dans le tableau des scores
2. Une modale « Choisir le donneur » s'affiche avec les 5 avatars
3. Sélectionner le nouveau donneur
4. Appuyer sur **Valider**

> Le donneur sélectionné doit être un joueur de la session. La rotation automatique reprend normalement à partir du nouveau donneur.

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

- Le preneur et son partenaire
- Le donneur de la donne
- Le contrat (badge coloré) et la **durée de la donne** (si disponible)
- Le résultat (gain/perte du preneur)

### Modifier les joueurs

Depuis l'écran de session, il est possible de **changer un ou plusieurs joueurs** sans repasser par l'accueil :

1. Appuyer sur le bouton **⇄** (flèches) à droite du titre « Session #X »
2. La modale de sélection s'ouvre avec les **5 joueurs actuels** pré-sélectionnés
3. Désélectionner le(s) joueur(s) à remplacer et sélectionner le(s) nouveau(x)
4. Appuyer sur **Confirmer**

> **Session intelligente** : si une session active existe déjà avec les 5 joueurs choisis, l'application y navigue directement. Sinon, une nouvelle session est créée.

> **Note** : le bouton est **désactivé** tant qu'une donne est en cours. Terminez ou supprimez la donne avant de modifier les joueurs.

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

Le **sélecteur de groupe** en haut de l'écran de session permet de changer manuellement le groupe associé. Si des joueurs de la session ne sont pas encore membres du groupe sélectionné, ils sont **automatiquement ajoutés** au groupe.

### Statistiques par groupe

Sur les pages **Statistiques** et **Statistiques par joueur**, un filtre permet de voir les classements et scores uniquement pour les sessions d'un groupe donné. Le filtre n'apparaît que si au moins un groupe existe.

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

1. **Sélectionner le partenaire** : appuyer sur l'avatar du joueur appelé, ou **« Seul »** si le preneur appelle son propre roi
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

Seule la **dernière donne** de la session est modifiable. Pour la modifier :

1. Appuyer sur le bouton **« Modifier »** affiché à côté de la dernière donne dans l'historique
2. Modifier les paramètres souhaités (partenaire, oudlers, points, bonus)
3. Appuyer sur **Valider** → les scores sont recalculés

### Supprimer la dernière donne

Seule la **dernière donne** peut être supprimée (erreur de saisie, donne annulée). Deux cas :

- **Donne terminée** : appuyer sur le bouton **« Supprimer »** (en rouge) à côté de la dernière donne dans l'historique
- **Donne en cours** : appuyer sur le bouton **« Annuler »** dans le bandeau de donne en cours

Dans les deux cas, une **confirmation** est demandée. Après suppression, les scores cumulés de la session sont automatiquement recalculés.

---

## Consulter les statistiques

Accessible via l'onglet **Stats** dans la barre de navigation.

### Classement global

L'écran principal des statistiques affiche :

- **Métriques** : nombre total de donnes, de sessions jouées, **durée moyenne par donne** et **temps de jeu total** (si des donnes avec suivi de durée existent)
- **Classement** : tous les joueurs triés par score total décroissant, avec nombre de donnes jouées et taux de victoire en tant que preneur
- **Répartition des contrats** : graphique à barres horizontales montrant combien de donnes ont été jouées par type de contrat (Petite, Garde, etc.)

Appuyer sur un joueur dans le classement pour voir ses statistiques détaillées.

### Statistiques par joueur

L'écran de détail d'un joueur affiche :

- **Métriques clés** : donnes jouées, taux de victoire (en tant que preneur), score moyen, sessions jouées, **durée moyenne par donne** et **temps de jeu total** (si disponible)
- **Meilleur et pire score** : les scores extrêmes du joueur
- **Répartition des rôles** : barre visuelle montrant combien de fois le joueur a été preneur, partenaire ou défenseur
- **Contrats pris** : graphique à barres des contrats joués en tant que preneur
- **Évolution des scores** : graphique linéaire des 50 derniers scores

### Évolution des scores en session

Depuis l'**écran de session**, un graphique d'évolution apparaît automatiquement dès qu'au moins **2 donnes sont terminées**. Il montre les scores cumulés de chaque joueur au fil des donnes, avec une ligne de couleur par joueur.

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
- Les statistiques d'un joueur affichent le **nombre total d'étoiles** reçues et le **nombre de pénalités** subies

> **Note** : la somme des scores de pénalité est toujours nulle (−100 + 4 × 25 = 0).

---

## Classement ELO

Le système ELO fournit un **classement dynamique** qui tient compte du niveau des adversaires, contrairement au score total.

### Fonctionnement

- Chaque joueur démarre à **1500 ELO**
- Après chaque donne, l'ELO de chaque joueur évolue selon le résultat et le niveau des adversaires
- Battre des joueurs mieux classés rapporte **plus de points** ; battre des joueurs moins bien classés en rapporte **moins**
- Le preneur voit son ELO évoluer **plus fortement** que le partenaire, qui évolue lui-même plus que les défenseurs

### Où le trouver

- **Page Statistiques** : une section **« Classement ELO »** affiche tous les joueurs triés par rating décroissant, avec un code couleur (vert > 1500, rouge < 1500)
- **Statistiques d'un joueur** : la carte « ELO » affiche le rating actuel, et un graphique **« Évolution ELO »** montre la courbe au fil des donnes

### Recalcul et suppression

- La **modification** d'une donne recalcule automatiquement les ELO
- La **suppression** d'une donne annule ses effets sur les ELO (retour à l'état précédent)

---

## Utilisation sur Smart TV

L'application est compatible avec les **Smart TV** Samsung (Tizen 5.0+) et LG (webOS 5.0+).

### Ouvrir l'application

1. Ouvrir le **navigateur intégré** de la TV (Samsung Internet ou LG Web Browser)
2. Saisir l'URL de l'application
3. L'interface s'adapte automatiquement à l'écran large : texte agrandi, contenu centré

### Navigation au D-pad (télécommande)

La navigation se fait entièrement avec les **flèches directionnelles** et le bouton **Enter/OK** de la télécommande :

- **Flèches haut/bas/gauche/droite** : déplacer le focus entre les éléments interactifs (boutons, liens, champs)
- **Enter/OK** : activer l'élément sélectionné (clic)
- **Retour** : revenir en arrière (selon le navigateur TV)

Un **anneau bleu** entoure l'élément actuellement focalisé pour indiquer la position du curseur.

> **Astuce** : dans les modales, le focus est piégé à l'intérieur — les flèches ne sortent pas de la modale tant qu'elle est ouverte. Utiliser le bouton de fermeture (✕) ou Échap pour la fermer.

---

## Mèmes de victoire

Quand une donne est gagnée par l'attaque, un **mème aléatoire** peut apparaître en plein écran pendant 3 secondes pour célébrer la victoire.

### Fonctionnement

- Le mème s'affiche environ **40 % du temps** lors d'une victoire de l'attaque
- **Exception** : un petit au bout réussi par l'attaque déclenche **systématiquement** un mème spécial
- Cliquer ou toucher l'écran permet de **fermer le mème** immédiatement

> **Note** : les mèmes n'apparaissent que lors de la **première saisie** d'une donne, pas lors de la modification.

### Quel mème s'affiche ?

| Condition | Image | Légende |
|-----------|-------|---------|
| Petit au bout attaque (**toujours**) | Success Kid | — |
| Victoire en solo / appel au roi seul (**toujours**) | Obama se décore | — |
| Victoire (pool aléatoire) | Borat "Great Success" | — |
| Victoire (pool aléatoire) | Freddie Mercury Champions | — |
| Victoire (pool aléatoire) | DiCaprio Toast | — |
| Victoire (pool aléatoire) | It's Over 9000 | — |
| Victoire (pool aléatoire) | Pacha (Le point parfait) | — |

**Ordre de priorité** : petit au bout attaque → victoire en solo → tirage 40 % (sinon rien) → pool aléatoire.

---

## Mèmes de défaite

Quand une donne est perdue par l'attaque, un **mème de défaite** peut apparaître en plein écran pendant 3 secondes.

### Fonctionnement

- Le mème s'affiche environ **40 % du temps** lors d'une défaite de l'attaque
- **Exception** : certaines défaites déclenchent **systématiquement** un mème spécial (voir tableau ci-dessous)
- Cliquer ou toucher l'écran permet de **fermer le mème** immédiatement

> **Note** : les mèmes n'apparaissent que lors de la **première saisie** d'une donne, pas lors de la modification.

### Quel mème s'affiche ?

| Condition | Image | Légende |
|-----------|-------|---------|
| Défaite improbable (**toujours**) : 3 bouts, chelem raté ou garde contre perdue | You Were the Chosen One, Pikachu surpris ou Picard Facepalm (aléatoire) | — |
| Garde sans perdue (**toujours**) | Crying Michael Jordan | — |
| Défaite (40 % This is Fine) | This is Fine (chien dans les flammes) | — |
| Défaite (60 % pool par défaut) | Sad Pablo Escobar | — |
| Défaite (60 % pool par défaut) | Ah Shit, Here We Go Again (CJ) | — |
| Défaite (60 % pool par défaut) | Why Are We Still Here? | — |

**Ordre de priorité** : défaite improbable (pikachu/picard) → garde sans (crying jordan) → tirage 40 % (sinon rien) → 40 % This is Fine / 60 % pool aléatoire.

---

## Thème sombre

L'application supporte un **mode sombre**. Pour basculer entre les thèmes clair et sombre, utiliser le bouton de bascule dans l'interface.

Le choix est **mémorisé** automatiquement et persiste entre les visites.

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
