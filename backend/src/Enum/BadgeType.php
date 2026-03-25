<?php

declare(strict_types=1);

namespace App\Enum;

enum BadgeType: string
{
    case Audacious = 'audacious';
    case CatchThemAll = 'catch_them_all';
    case Centurion = 'centurion';
    case ChampionStreak = 'champion_streak';
    case CloseCall = 'close_call';
    case Comfortable10 = 'comfortable_10';
    case Comfortable20 = 'comfortable_20';
    case Comfortable30 = 'comfortable_30';
    case Comfortable40 = 'comfortable_40';
    case Comfortable50 = 'comfortable_50';
    case Comeback = 'comeback';
    case DestinyHand = 'destiny_hand';
    case FirstChelem = 'first_chelem';
    case FirstGame = 'first_game';
    case FriendCaller = 'friend_caller';
    case GardeContreWon = 'garde_contre_won';
    case Kamikaze = 'kamikaze';
    case Konami = 'konami';
    case LastPlace = 'last_place';
    case LosingStreak = 'losing_streak';
    case Marathon = 'marathon';
    case NightOwl = 'night_owl';
    case NoNet = 'no_net';
    case PetitMalin = 'petit_malin';
    case Regular = 'regular';
    case RisingStar = 'rising_star';
    case SelfCaller = 'self_caller';
    case Social = 'social';
    case StarCollector = 'star_collector';
    case StarShower = 'star_shower';
    case SurpriseChelem = 'surprise_chelem';
    case ThreeOutlersLoss = 'three_outliers_loss';
    case TriplePoignee = 'triple_poignee';
    case Wall = 'wall';
    case ZeroBout = 'zero_bout';

    public function category(): string
    {
        return match ($this) {
            self::CatchThemAll, self::Centurion, self::FirstGame, self::Regular => 'progression',
            self::Audacious, self::ChampionStreak, self::Comfortable10, self::Comfortable20, self::Comfortable30, self::Comfortable40, self::Comfortable50, self::DestinyHand, self::FirstChelem, self::GardeContreWon, self::Kamikaze, self::NoNet, self::PetitMalin, self::SelfCaller, self::SurpriseChelem, self::TriplePoignee, self::Wall, self::ZeroBout => 'performance',
            self::CloseCall, self::Comeback, self::Konami, self::LastPlace, self::LosingStreak, self::RisingStar, self::StarCollector, self::StarShower, self::ThreeOutlersLoss => 'fun',
            self::FriendCaller, self::Marathon, self::NightOwl, self::Social => 'social',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Audacious => 'Tenter un chelem annoncé',
            self::CatchThemAll => 'Obtenir tous les autres badges',
            self::Centurion => 'Jouer 100 donnes',
            self::ChampionStreak => '5 victoires consécutives comme preneur',
            self::CloseCall => 'Perdre à moins de 2 points du contrat',
            self::Comfortable10 => 'Gagner à +10 points du contrat',
            self::Comfortable20 => 'Gagner à +20 points du contrat',
            self::Comfortable30 => 'Gagner à +30 points du contrat',
            self::Comfortable40 => 'Gagner à +40 points du contrat',
            self::Comfortable50 => 'Gagner à +50 points du contrat',
            self::Comeback => 'Remonter de dernier à premier en une session',
            self::DestinyHand => 'Remporter une donne avec exactement 0 points de marge',
            self::FirstChelem => 'Réussir un Chelem annoncé',
            self::FirstGame => 'Jouer sa première donne',
            self::FriendCaller => 'Appeler le même partenaire 5 fois de suite',
            self::GardeContreWon => 'Réussir une garde contre',
            self::Kamikaze => 'Tenter une Garde Contre',
            self::Konami => '',
            self::LastPlace => 'Finir dernier 5 fois',
            self::LosingStreak => '5 défaites consécutives comme preneur',
            self::Marathon => 'Jouer une session de plus de 3 heures',
            self::NightOwl => 'Jouer une donne après minuit',
            self::NoNet => 'Réussir une Garde Sans',
            self::PetitMalin => 'Réussir 5 Petits au bout',
            self::Regular => 'Jouer 10 sessions',
            self::RisingStar => 'Recevoir 20 étoiles',
            self::SelfCaller => 'Gagner en s\'appelant soi-même',
            self::Social => 'Jouer avec 10 joueurs différents',
            self::StarCollector => 'Recevoir 10 étoiles',
            self::StarShower => '3 étoiles en moins de 2 heures',
            self::SurpriseChelem => 'Réussir un chelem non annoncé',
            self::ThreeOutlersLoss => 'Perdre avec 3 bouts',
            self::TriplePoignee => 'Déclarer une poignée triple',
            self::Wall => '10 victoires en défense d\'affilée',
            self::ZeroBout => 'Gagner avec 0 bout',
        };
    }

    public function emoji(): string
    {
        return match ($this) {
            self::Audacious => '🎲',
            self::CatchThemAll => '⚾',
            self::Centurion => '💯',
            self::ChampionStreak => '🔥',
            self::CloseCall => '😓',
            self::Comfortable10 => '💪',
            self::Comfortable20 => '🦾',
            self::Comfortable30 => '🔥',
            self::Comfortable40 => '🌋',
            self::Comfortable50 => '☀️',
            self::Comeback => '📈',
            self::DestinyHand => '⚖️',
            self::FirstChelem => '👑',
            self::FirstGame => '🎮',
            self::FriendCaller => '📞',
            self::GardeContreWon => '🏆',
            self::Kamikaze => '⚔️',
            self::Konami => '🕹️',
            self::LastPlace => '💀',
            self::LosingStreak => '📉',
            self::Marathon => '⏰',
            self::NightOwl => '🌙',
            self::NoNet => '🎯',
            self::PetitMalin => '🃏',
            self::Regular => '🔟',
            self::RisingStar => '🌟',
            self::SelfCaller => '🤙',
            self::Social => '👥',
            self::StarCollector => '⭐',
            self::StarShower => '☄️',
            self::SurpriseChelem => '🎩',
            self::ThreeOutlersLoss => '🤦',
            self::TriplePoignee => '🤲',
            self::Wall => '🛡️',
            self::ZeroBout => '🎯',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Audacious => 'Audacieux',
            self::CatchThemAll => 'Attrapez-les tous',
            self::Centurion => 'Centurion',
            self::ChampionStreak => 'Inarrêtable',
            self::CloseCall => 'Si près du but',
            self::Comfortable10 => 'Confortable +10',
            self::Comfortable20 => 'Confortable +20',
            self::Comfortable30 => 'Confortable +30',
            self::Comfortable40 => 'Confortable +40',
            self::Comfortable50 => 'Confortable +50',
            self::Comeback => 'Comeback',
            self::DestinyHand => 'Main du destin',
            self::FirstChelem => 'Premier Chelem',
            self::FirstGame => 'Première donne',
            self::FriendCaller => 'Appel à un ami',
            self::GardeContreWon => 'Garde contre réussie',
            self::Kamikaze => 'Kamikaze',
            self::Konami => '',
            self::LastPlace => 'Lanterne rouge',
            self::LosingStreak => 'Série noire',
            self::Marathon => 'Marathon',
            self::NightOwl => 'Noctambule',
            self::NoNet => 'Sans filet',
            self::PetitMalin => 'Petit malin',
            self::Regular => 'Habitué',
            self::RisingStar => 'Étoile montante',
            self::SelfCaller => 'Auto-appel',
            self::Social => 'Sociable',
            self::StarCollector => 'Collectionneur d\'étoiles',
            self::StarShower => 'Pluie d\'étoiles',
            self::SurpriseChelem => 'Chelem surprise',
            self::ThreeOutlersLoss => '3 bouts pour rien',
            self::TriplePoignee => 'Poignée triple',
            self::Wall => 'Muraille',
            self::ZeroBout => 'Zéro bout',
        };
    }

    public function availableSince(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('2026-03-25');
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
