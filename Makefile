# ──────────────────────────────────────────────────
# Tarot — Makefile
# ──────────────────────────────────────────────────
# Raccourcis pour les commandes DDEV les plus courantes.
# Usage : make <cible>   (ex. make test, make lint)
# ──────────────────────────────────────────────────

.DEFAULT_GOAL := help

# ── Couleurs ──────────────────────────────────────
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

# ── Chemins container ─────────────────────────────
BACK  := /var/www/html/backend
FRONT := /var/www/html/frontend

# ── Workflows ─────────────────────────────────────

.PHONY: dev prod ci

dev: start install db-migrate ## Premier lancement dev (DDEV + dépendances + migrations)

prod: install-back install-front build db-migrate cc ## Déploiement prod (dépendances + build + migrations + cache)

ci: lint test ## Intégration continue (lint + tests)

# ── Environnement ─────────────────────────────────

.PHONY: start stop restart status logs

start: ## Démarrer DDEV (containers + Vite daemon)
	ddev start

stop: ## Arrêter DDEV (ce projet uniquement)
	ddev stop

restart: ## Redémarrer DDEV
	ddev restart

status: ## Afficher le statut DDEV
	ddev status

logs: ## Afficher les logs du container web
	ddev logs -f

# ── Installation ──────────────────────────────────

.PHONY: install install-back install-front

install: install-back install-front ## Installer toutes les dépendances (backend + frontend)

install-back: ## Installer les dépendances Composer
	ddev composer install

install-front: ## Installer les dépendances npm
	ddev exec bash -c 'cd $(FRONT) && npm install'

# ── Base de données ───────────────────────────────

.PHONY: db-diff db-migrate db-reset

db-diff: ## Générer une migration Doctrine
	ddev exec bash -c 'cd $(BACK) && php bin/console doctrine:migrations:diff -n'

db-migrate: ## Exécuter les migrations
	ddev exec bash -c 'cd $(BACK) && php bin/console doctrine:migrations:migrate -n'

db-reset: ## Recréer la base de données et jouer les migrations
	ddev exec bash -c 'cd $(BACK) && php bin/console doctrine:database:drop --force --if-exists'
	ddev exec bash -c 'cd $(BACK) && php bin/console doctrine:database:create'
	ddev exec bash -c 'cd $(BACK) && php bin/console doctrine:migrations:migrate -n'

# ── Tests ─────────────────────────────────────────

.PHONY: test test-back test-front

test: test-back test-front ## Lancer tous les tests (backend + frontend)

test-back: ## Lancer les tests PHPUnit
	ddev exec bash -c 'cd $(BACK) && vendor/bin/phpunit'

test-front: ## Lancer les tests Vitest
	ddev exec bash -c 'cd $(FRONT) && npx vitest run'

# ── Qualité de code ───────────────────────────────

.PHONY: lint lint-back lint-front fix phpstan cs

lint: lint-back lint-front ## Vérifier la qualité (PHPStan + CS Fixer dry-run + TypeScript)

lint-back: phpstan cs-dry ## Vérifier le backend (PHPStan + CS Fixer dry-run)

lint-front: ## Vérifier le frontend (TypeScript)
	ddev exec bash -c 'cd $(FRONT) && npx tsc --noEmit'

phpstan: ## Lancer PHPStan (analyse statique PHP)
	ddev exec bash -c 'cd $(BACK) && vendor/bin/phpstan analyse'

cs-dry: ## Vérifier le style PHP (dry-run, sans modifier)
	ddev exec bash -c 'cd $(BACK) && vendor/bin/php-cs-fixer fix --dry-run --diff'

cs: ## Corriger le style PHP (modifie les fichiers)
	ddev exec bash -c 'cd $(BACK) && vendor/bin/php-cs-fixer fix'

# ── Build ─────────────────────────────────────────

.PHONY: build

build: ## Compiler le frontend pour la production
	ddev exec bash -c 'cd $(FRONT) && npm run build'

# ── Symfony ───────────────────────────────────────

.PHONY: cc sf

cc: ## Vider le cache Symfony
	ddev exec bash -c 'cd $(BACK) && php bin/console cache:clear'

sf: ## Lancer une commande Symfony (usage : make sf CMD="debug:router")
	ddev exec bash -c 'cd $(BACK) && php bin/console $(CMD)'

# ── Aide ──────────────────────────────────────────

.PHONY: help

help: ## Afficher cette aide
	@printf "\n$(CYAN)Tarot$(RESET) — Commandes disponibles :\n\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@printf "\n"
