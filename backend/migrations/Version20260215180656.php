<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260215180656 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE INDEX IDX_232B318C613FECDF7B00651C ON game (session_id, status)');
        $this->addSql('CREATE INDEX IDX_926D51F8E48FD90599E6F5DF ON score_entry (game_id, player_id)');
        $this->addSql('CREATE INDEX IDX_3459E28B613FECDF99E6F5DF ON star_event (session_id, player_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX IDX_232B318C613FECDF7B00651C ON game');
        $this->addSql('DROP INDEX IDX_926D51F8E48FD90599E6F5DF ON score_entry');
        $this->addSql('DROP INDEX IDX_3459E28B613FECDF99E6F5DF ON star_event');
    }
}
