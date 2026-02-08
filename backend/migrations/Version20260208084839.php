<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260208084839 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game ADD dealer_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE game ADD CONSTRAINT FK_232B318C249E6EA1 FOREIGN KEY (dealer_id) REFERENCES player (id)');
        $this->addSql('CREATE INDEX IDX_232B318C249E6EA1 ON game (dealer_id)');
        $this->addSql('ALTER TABLE session ADD current_dealer_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE session ADD CONSTRAINT FK_D044D5D4FFB8DF0D FOREIGN KEY (current_dealer_id) REFERENCES player (id)');
        $this->addSql('CREATE INDEX IDX_D044D5D4FFB8DF0D ON session (current_dealer_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game DROP FOREIGN KEY FK_232B318C249E6EA1');
        $this->addSql('DROP INDEX IDX_232B318C249E6EA1 ON game');
        $this->addSql('ALTER TABLE game DROP dealer_id');
        $this->addSql('ALTER TABLE session DROP FOREIGN KEY FK_D044D5D4FFB8DF0D');
        $this->addSql('DROP INDEX IDX_D044D5D4FFB8DF0D ON session');
        $this->addSql('ALTER TABLE session DROP current_dealer_id');
    }
}
