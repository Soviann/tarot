<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260212172632 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de completed_at sur Game pour le suivi de durée';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game ADD completed_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game DROP completed_at');
    }
}
