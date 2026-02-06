# Tarot Score Tracker — Guide utilisateur

Application mobile (PWA) de suivi des scores pour le Tarot à 5 joueurs, conforme aux règles officielles de la FFT.

## Table des matières

- [Installation](#installation)
- [Concepts clés](#concepts-clés)
- [Gestion des joueurs](#gestion-des-joueurs)
- [Démarrer une session](#démarrer-une-session)
- [Écran de session](#écran-de-session)
- [Saisir une donne](#saisir-une-donne)
- [Consulter les statistiques](#consulter-les-statistiques)
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

---

## Gestion des joueurs

Accessible via l'onglet **Joueurs** dans la barre de navigation basse.

### Ajouter un joueur

1. Appuyer sur le bouton **+** (en bas à droite)
2. Saisir le nom du joueur
3. Valider

> Chaque joueur possède un **avatar coloré** généré automatiquement à partir de ses initiales. La couleur est cohérente : un même joueur aura toujours la même couleur.

### Rechercher un joueur

Utiliser la barre de recherche en haut de la liste pour filtrer par nom.

---

## Démarrer une session

Depuis l'écran **Accueil** :

1. Sélectionner **5 joueurs** parmi la liste existante
   - Possibilité d'ajouter un nouveau joueur à la volée avec **« + Ajouter »**
2. Appuyer sur **« Démarrer »**

> **Session intelligente** : si une session active existe déjà avec les mêmes 5 joueurs, l'application la reprend automatiquement au lieu d'en créer une nouvelle.

### Sessions récentes

Les sessions récentes sont affichées sous le formulaire de sélection pour un accès rapide.

---

## Écran de session

L'écran de session affiche :

### Tableau des scores

En haut de l'écran, un bandeau horizontal scrollable montre les **5 joueurs** avec leur **score cumulé** :

- Score **positif** → affiché en **vert**
- Score **négatif** → affiché en **rouge**
- Score **nul** → affiché en gris

### Donne en cours

Si une donne est en cours (étape 1 validée, étape 2 en attente), un bandeau bien visible indique le preneur et le contrat avec un bouton **« Compléter »**.

### Historique des donnes

Liste des donnes jouées (la plus récente en premier), montrant pour chaque donne :

- Le preneur et son partenaire
- Le contrat (badge coloré)
- Le résultat (gain/perte du preneur)

### Actions

- **Bouton + (FAB)** : démarrer une nouvelle donne (désactivé si une donne est en cours)
- **Glisser à gauche** sur la dernière donne : modifier ses paramètres

---

## Saisir une donne

La saisie se fait en **2 étapes** :

### Étape 1 — Début de la donne

1. **Sélectionner le preneur** : appuyer sur l'avatar d'un des 5 joueurs
2. **Choisir le contrat** :
   - 🟢 **Petite** (×1)
   - 🔵 **Garde** (×2)
   - 🟠 **Garde Sans** (×4)
   - 🔴 **Garde Contre** (×6)
3. Appuyer sur **Valider**

> La donne est créée avec le statut « en cours ». On peut continuer à jouer et compléter plus tard.

### Étape 2 — Fin de la donne

1. **Sélectionner le partenaire** : appuyer sur l'avatar du joueur appelé, ou **« Soi-même »** si le preneur appelle son propre roi
2. **Nombre d'oudlers** : utiliser le stepper (0 à 3)
3. **Points réalisés** : saisir le total de points du camp attaquant (0 à 91)
4. **Bonus** (section dépliable, optionnel) :
   - **Poignée** : Simple / Double / Triple + qui la montre (Attaque / Défense)
   - **Petit au bout** : Attaque / Défense
   - **Chelem** : Annoncé gagné / Annoncé perdu / Non annoncé gagné
5. **Aperçu** : le détail du calcul des scores s'affiche avant validation
6. Appuyer sur **Valider**

> Les scores sont calculés automatiquement selon les règles FFT et répartis entre les joueurs.

### Modifier la dernière donne

Seule la **dernière donne** de la session est modifiable. Pour la modifier :

1. Glisser la carte de la dernière donne vers la gauche
2. Modifier les paramètres souhaités
3. Revalider → les scores sont recalculés

---

## Consulter les statistiques

Accessible via l'onglet **Stats** dans la barre de navigation.

### Classement global

- Classement de tous les joueurs par score total
- Nombre de parties jouées
- Taux de victoire

### Statistiques par joueur

- Nombre de parties jouées
- Score moyen
- Répartition des contrats pris
- Meilleure et pire donne

### Statistiques par session

- Évolution des scores au fil des donnes
- Détail donne par donne

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
