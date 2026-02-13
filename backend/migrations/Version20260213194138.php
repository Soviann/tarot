<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260213194138 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE session DROP FOREIGN KEY `FK_D044D5D4F88398A7`');
        $this->addSql('ALTER TABLE session ADD CONSTRAINT FK_D044D5D4F88398A7 FOREIGN KEY (player_group_id) REFERENCES player_group (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE session DROP FOREIGN KEY FK_D044D5D4F88398A7');
        $this->addSql('ALTER TABLE session ADD CONSTRAINT `FK_D044D5D4F88398A7` FOREIGN KEY (player_group_id) REFERENCES player_group (id)');
    }
}
