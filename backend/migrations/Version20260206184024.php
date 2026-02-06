<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260206184024 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE game (id INT AUTO_INCREMENT NOT NULL, chelem VARCHAR(255) NOT NULL, contract VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, oudlers INT DEFAULT NULL, petit_au_bout VARCHAR(255) NOT NULL, poignee VARCHAR(255) NOT NULL, poignee_owner VARCHAR(255) NOT NULL, points DOUBLE PRECISION DEFAULT NULL, position INT NOT NULL, status VARCHAR(255) NOT NULL, partner_id INT DEFAULT NULL, session_id INT NOT NULL, taker_id INT NOT NULL, INDEX IDX_232B318C9393F8FE (partner_id), INDEX IDX_232B318C613FECDF (session_id), INDEX IDX_232B318CB2E74C3 (taker_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE player (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(50) NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_98197A655E237E06 (name), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE score_entry (id INT AUTO_INCREMENT NOT NULL, score INT NOT NULL, game_id INT NOT NULL, player_id INT NOT NULL, INDEX IDX_926D51F8E48FD905 (game_id), INDEX IDX_926D51F899E6F5DF (player_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE session (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, is_active TINYINT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE session_player (session_id INT NOT NULL, player_id INT NOT NULL, INDEX IDX_F772703C613FECDF (session_id), INDEX IDX_F772703C99E6F5DF (player_id), PRIMARY KEY (session_id, player_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE game ADD CONSTRAINT FK_232B318C9393F8FE FOREIGN KEY (partner_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE game ADD CONSTRAINT FK_232B318C613FECDF FOREIGN KEY (session_id) REFERENCES session (id)');
        $this->addSql('ALTER TABLE game ADD CONSTRAINT FK_232B318CB2E74C3 FOREIGN KEY (taker_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE score_entry ADD CONSTRAINT FK_926D51F8E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE score_entry ADD CONSTRAINT FK_926D51F899E6F5DF FOREIGN KEY (player_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE session_player ADD CONSTRAINT FK_F772703C613FECDF FOREIGN KEY (session_id) REFERENCES session (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE session_player ADD CONSTRAINT FK_F772703C99E6F5DF FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game DROP FOREIGN KEY FK_232B318C9393F8FE');
        $this->addSql('ALTER TABLE game DROP FOREIGN KEY FK_232B318C613FECDF');
        $this->addSql('ALTER TABLE game DROP FOREIGN KEY FK_232B318CB2E74C3');
        $this->addSql('ALTER TABLE score_entry DROP FOREIGN KEY FK_926D51F8E48FD905');
        $this->addSql('ALTER TABLE score_entry DROP FOREIGN KEY FK_926D51F899E6F5DF');
        $this->addSql('ALTER TABLE session_player DROP FOREIGN KEY FK_F772703C613FECDF');
        $this->addSql('ALTER TABLE session_player DROP FOREIGN KEY FK_F772703C99E6F5DF');
        $this->addSql('DROP TABLE game');
        $this->addSql('DROP TABLE player');
        $this->addSql('DROP TABLE score_entry');
        $this->addSql('DROP TABLE session');
        $this->addSql('DROP TABLE session_player');
    }
}
