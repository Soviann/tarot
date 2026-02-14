<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260214192816 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player ADD last_activity_at DATETIME DEFAULT NULL');
        $this->addSql('UPDATE player p SET last_activity_at = (SELECT MAX(g.completed_at) FROM game g JOIN score_entry se ON se.game_id = g.id WHERE se.player_id = p.id AND g.completed_at IS NOT NULL)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE player DROP last_activity_at');
    }
}
