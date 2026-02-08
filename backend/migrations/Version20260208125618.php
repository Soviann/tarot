<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260208125618 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE elo_history DROP FOREIGN KEY `FK_34D56F4299E6F5DF`');
        $this->addSql('ALTER TABLE elo_history DROP FOREIGN KEY `FK_34D56F42E48FD905`');
        $this->addSql('ALTER TABLE elo_history ADD CONSTRAINT FK_34D56F4299E6F5DF FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE elo_history ADD CONSTRAINT FK_34D56F42E48FD905 FOREIGN KEY (game_id) REFERENCES game (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE elo_history DROP FOREIGN KEY FK_34D56F42E48FD905');
        $this->addSql('ALTER TABLE elo_history DROP FOREIGN KEY FK_34D56F4299E6F5DF');
        $this->addSql('ALTER TABLE elo_history ADD CONSTRAINT `FK_34D56F42E48FD905` FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE elo_history ADD CONSTRAINT `FK_34D56F4299E6F5DF` FOREIGN KEY (player_id) REFERENCES player (id)');
    }
}
