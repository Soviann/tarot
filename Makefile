# ──────────────────────────────────────────────────
# Tarot — Makefile
# ──────────────────────────────────────────────────
# Raccourcis pour les commandes courantes.
# Usage : make <cible>   (ex. make test, make lint)
# ──────────────────────────────────────────────────

include backend/.env

# Si ENV est défini, inclure le fichier d'environnement correspondant
ifdef ENV
ifneq ("$(wildcard backend/.env.$(ENV))","")
	include backend/.env.$(ENV)
endif
endif

# .env.local prévaut toujours (chargé en dernier)
ifneq ("$(wildcard backend/.env.local)","")
	include backend/.env.local
endif

.DEFAULT_GOAL := help

# ── Couleurs ──────────────────────────────────────
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

# ── Chemins ─────────────────────────────────────
BACK  := backend
FRONT := frontend

# ── Workflows ─────────────────────────────────────

.PHONY: dev prod ci

dev: install db-migrate ## Premier lancement dev (dépendances + migrations)

prod: install-back install-front build db-migrate cc ## Déploiement prod (dépendances + build + migrations + cache)

ci: lint test ## Intégration continue (lint + tests)

# ── Installation ──────────────────────────────────

.PHONY: install install-back install-front

install: install-back install-front ## Installer toutes les dépendances (backend + frontend)

install-back: ## Installer les dépendances Composer
	cd $(BACK) && composer install

install-front: ## Installer les dépendances npm
	cd $(FRONT) && npm install

# ── Base de données ───────────────────────────────

.PHONY: db-diff db-migrate db-reset

db-diff: ## Générer une migration Doctrine
	cd $(BACK) && php bin/console doctrine:migrations:diff -n

db-migrate: ## Exécuter les migrations
	cd $(BACK) && php bin/console doctrine:migrations:migrate -n

db-reset: ## Recréer la base de données et jouer les migrations
	cd $(BACK) && php bin/console doctrine:database:drop --force --if-exists
	cd $(BACK) && php bin/console doctrine:database:create
	cd $(BACK) && php bin/console doctrine:migrations:migrate -n

# ── Tests ─────────────────────────────────────────

.PHONY: test test-back test-front

test: test-back test-front ## Lancer tous les tests (backend + frontend)

test-back: ## Lancer les tests PHPUnit
	cd $(BACK) && vendor/bin/phpunit

test-front: ## Lancer les tests Vitest
	cd $(FRONT) && npx vitest run

# ── Qualité de code ───────────────────────────────

.PHONY: lint lint-back lint-front fix phpstan cs

lint: lint-back lint-front ## Vérifier la qualité (PHPStan + CS Fixer dry-run + TypeScript)

lint-back: phpstan cs-dry ## Vérifier le backend (PHPStan + CS Fixer dry-run)

lint-front: ## Vérifier le frontend (TypeScript)
	cd $(FRONT) && npx tsc --noEmit

phpstan: ## Lancer PHPStan (analyse statique PHP)
	cd $(BACK) && vendor/bin/phpstan analyse

cs-dry: ## Vérifier le style PHP (dry-run, sans modifier)
	cd $(BACK) && vendor/bin/php-cs-fixer fix --dry-run --diff

cs: ## Corriger le style PHP (modifie les fichiers)
	cd $(BACK) && vendor/bin/php-cs-fixer fix

# ── Build ─────────────────────────────────────────

.PHONY: build serve-prod verify-build

build: ## Compiler le frontend pour la production
	cd $(FRONT) && npm run build

serve-prod: build ## Compiler et servir le build prod (port 4173)
	cd $(FRONT) && npx vite preview --host 0.0.0.0 --port 4173

verify-build: build ## Vérifier que le build prod ne contient pas de code de debug
	@cd $(FRONT) && ! grep -q "ReactQueryDevtools" dist/assets/*.js \
		&& printf "  $(GREEN)✓$(RESET) Pas de ReactQueryDevtools dans le bundle\n" \
		|| (printf "  $(CYAN)✗$(RESET) ReactQueryDevtools trouvé dans le bundle !\n" && exit 1)

# ── Symfony ───────────────────────────────────────

.PHONY: cc sf

cc: ## Vider le cache Symfony
	cd $(BACK) && php bin/console cache:clear

sf: ## Lancer une commande Symfony (usage : make sf CMD="debug:router")
	cd $(BACK) && php bin/console $(CMD)

# ── Aide ──────────────────────────────────────────

.PHONY: help

help: ## Afficher cette aide
	@printf "\n$(CYAN)Tarot$(RESET) — Commandes disponibles :\n\n"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@printf "\n"
