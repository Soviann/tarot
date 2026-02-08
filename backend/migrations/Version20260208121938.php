<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260208121938 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE elo_history (created_at DATETIME NOT NULL, id INT AUTO_INCREMENT NOT NULL, rating_after INT NOT NULL, rating_before INT NOT NULL, rating_change INT NOT NULL, game_id INT NOT NULL, player_id INT NOT NULL, INDEX IDX_34D56F42E48FD905 (game_id), INDEX IDX_34D56F4299E6F5DF (player_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE elo_history ADD CONSTRAINT FK_34D56F42E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE elo_history ADD CONSTRAINT FK_34D56F4299E6F5DF FOREIGN KEY (player_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE player ADD elo_rating INT DEFAULT 1500 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE elo_history DROP FOREIGN KEY FK_34D56F42E48FD905');
        $this->addSql('ALTER TABLE elo_history DROP FOREIGN KEY FK_34D56F4299E6F5DF');
        $this->addSql('DROP TABLE elo_history');
        $this->addSql('ALTER TABLE player DROP elo_rating');
    }
}
