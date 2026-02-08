<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260208100113 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table star_event et modifie score_entry (game_id nullable, ajout session_id)';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE star_event (created_at DATETIME NOT NULL, id INT AUTO_INCREMENT NOT NULL, player_id INT NOT NULL, session_id INT NOT NULL, INDEX IDX_3459E28B99E6F5DF (player_id), INDEX IDX_3459E28B613FECDF (session_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE star_event ADD CONSTRAINT FK_3459E28B99E6F5DF FOREIGN KEY (player_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE star_event ADD CONSTRAINT FK_3459E28B613FECDF FOREIGN KEY (session_id) REFERENCES session (id)');
        $this->addSql('ALTER TABLE score_entry ADD session_id INT DEFAULT NULL, CHANGE game_id game_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE score_entry ADD CONSTRAINT FK_926D51F8613FECDF FOREIGN KEY (session_id) REFERENCES session (id)');
        $this->addSql('CREATE INDEX IDX_926D51F8613FECDF ON score_entry (session_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE star_event DROP FOREIGN KEY FK_3459E28B99E6F5DF');
        $this->addSql('ALTER TABLE star_event DROP FOREIGN KEY FK_3459E28B613FECDF');
        $this->addSql('DROP TABLE star_event');
        $this->addSql('ALTER TABLE score_entry DROP FOREIGN KEY FK_926D51F8613FECDF');
        $this->addSql('DROP INDEX IDX_926D51F8613FECDF ON score_entry');
        $this->addSql('ALTER TABLE score_entry DROP session_id, CHANGE game_id game_id INT NOT NULL');
    }
}
