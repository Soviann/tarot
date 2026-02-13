<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260213190038 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE player_group (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, name VARCHAR(100) NOT NULL, UNIQUE INDEX UNIQ_D2B23F835E237E06 (name), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE player_group_player (player_group_id INT NOT NULL, player_id INT NOT NULL, INDEX IDX_CBA2F297F88398A7 (player_group_id), INDEX IDX_CBA2F29799E6F5DF (player_id), PRIMARY KEY (player_group_id, player_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE player_group_player ADD CONSTRAINT FK_CBA2F297F88398A7 FOREIGN KEY (player_group_id) REFERENCES player_group (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE player_group_player ADD CONSTRAINT FK_CBA2F29799E6F5DF FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE session ADD player_group_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE session ADD CONSTRAINT FK_D044D5D4F88398A7 FOREIGN KEY (player_group_id) REFERENCES player_group (id)');
        $this->addSql('CREATE INDEX IDX_D044D5D4F88398A7 ON session (player_group_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE player_group_player DROP FOREIGN KEY FK_CBA2F297F88398A7');
        $this->addSql('ALTER TABLE player_group_player DROP FOREIGN KEY FK_CBA2F29799E6F5DF');
        $this->addSql('DROP TABLE player_group');
        $this->addSql('DROP TABLE player_group_player');
        $this->addSql('ALTER TABLE session DROP FOREIGN KEY FK_D044D5D4F88398A7');
        $this->addSql('DROP INDEX IDX_D044D5D4F88398A7 ON session');
        $this->addSql('ALTER TABLE session DROP player_group_id');
    }
}
