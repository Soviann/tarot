<?php

declare(strict_types=1);

namespace App\Enum;

enum BadgeType: string
{
    case Centurion = 'centurion';
    case ChampionStreak = 'champion_streak';
    case Comeback = 'comeback';
    case FirstChelem = 'first_chelem';
    case FirstGame = 'first_game';
    case Kamikaze = 'kamikaze';
    case LastPlace = 'last_place';
    case Marathon = 'marathon';
    case NightOwl = 'night_owl';
    case NoNet = 'no_net';
    case PetitMalin = 'petit_malin';
    case Regular = 'regular';
    case Social = 'social';
    case StarCollector = 'star_collector';
    case Wall = 'wall';

    public function category(): string
    {
        return match ($this) {
            self::Centurion, self::FirstGame, self::Regular => 'progression',
            self::ChampionStreak, self::FirstChelem, self::Kamikaze, self::NoNet, self::PetitMalin, self::Wall => 'performance',
            self::Comeback, self::LastPlace, self::StarCollector => 'fun',
            self::Marathon, self::NightOwl, self::Social => 'social',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Centurion => 'Jouer 100 donnes',
            self::ChampionStreak => '5 victoires consécutives comme preneur',
            self::Comeback => 'Remonter de dernier à premier en une session',
            self::FirstChelem => 'Réussir un Chelem annoncé',
            self::FirstGame => 'Jouer sa première donne',
            self::Kamikaze => 'Tenter une Garde Contre',
            self::LastPlace => 'Finir dernier 5 fois',
            self::Marathon => 'Jouer une session de plus de 3 heures',
            self::NightOwl => 'Jouer une donne après minuit',
            self::NoNet => 'Réussir une Garde Sans',
            self::PetitMalin => 'Réussir 5 Petits au bout',
            self::Regular => 'Jouer 10 sessions',
            self::Social => 'Jouer avec 10 joueurs différents',
            self::StarCollector => 'Recevoir 10 étoiles',
            self::Wall => '10 victoires en défense d\'affilée',
        };
    }

    public function emoji(): string
    {
        return match ($this) {
            self::Centurion => '💯',
            self::ChampionStreak => '🔥',
            self::Comeback => '📈',
            self::FirstChelem => '👑',
            self::FirstGame => '🎮',
            self::Kamikaze => '⚔️',
            self::LastPlace => '💀',
            self::Marathon => '⏰',
            self::NightOwl => '🌙',
            self::NoNet => '🎯',
            self::PetitMalin => '🃏',
            self::Regular => '🔟',
            self::Social => '👥',
            self::StarCollector => '⭐',
            self::Wall => '🛡️',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Centurion => 'Centurion',
            self::ChampionStreak => 'Inarrêtable',
            self::Comeback => 'Comeback',
            self::FirstChelem => 'Premier Chelem',
            self::FirstGame => 'Première donne',
            self::Kamikaze => 'Kamikaze',
            self::LastPlace => 'Lanterne rouge',
            self::Marathon => 'Marathon',
            self::NightOwl => 'Noctambule',
            self::NoNet => 'Sans filet',
            self::PetitMalin => 'Petit malin',
            self::Regular => 'Habitué',
            self::Social => 'Sociable',
            self::StarCollector => 'Collectionneur d\'étoiles',
            self::Wall => 'Muraille',
        };
    }

    /**
     * @return array{description: string, emoji: string, label: string, type: string}
     */
    public function toArray(): array
    {
        return [
            'description' => $this->description(),
            'emoji' => $this->emoji(),
            'label' => $this->label(),
            'type' => $this->value,
        ];
    }
}
