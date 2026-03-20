<?php

declare(strict_types=1);

namespace App\Tests\Doctrine;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Doctrine\CompletedGamesExtension;
use App\Entity\Game;
use App\Enum\GameStatus;
use Doctrine\ORM\QueryBuilder;
use PHPUnit\Framework\TestCase;

final class CompletedGamesExtensionTest extends TestCase
{
    private CompletedGamesExtension $extension;

    protected function setUp(): void
    {
        $this->extension = new CompletedGamesExtension();
    }

    public function testAppliesFilterForGameGetCollectionWithSessionId(): void
    {
        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->method('getRootAliases')->willReturn(['o']);
        $queryBuilder->expects($this->once())
            ->method('andWhere')
            ->with('o.status = :status_xxx')
            ->willReturnSelf();
        $queryBuilder->expects($this->once())
            ->method('setParameter')
            ->with('status_xxx', GameStatus::Completed);

        $queryNameGenerator = $this->createStub(QueryNameGeneratorInterface::class);
        $queryNameGenerator->method('generateParameterName')
            ->willReturn('status_xxx');

        $this->extension->applyToCollection(
            $queryBuilder,
            $queryNameGenerator,
            Game::class,
            new GetCollection(),
            ['uri_variables' => ['sessionId' => 1]],
        );
    }

    public function testSkipsNonGameResource(): void
    {
        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->expects($this->never())->method('andWhere');

        $queryNameGenerator = $this->createStub(QueryNameGeneratorInterface::class);

        $this->extension->applyToCollection(
            $queryBuilder,
            $queryNameGenerator,
            \stdClass::class,
            new GetCollection(),
            ['uri_variables' => ['sessionId' => 1]],
        );
    }

    public function testSkipsNonGetCollectionOperation(): void
    {
        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->expects($this->never())->method('andWhere');

        $queryNameGenerator = $this->createStub(QueryNameGeneratorInterface::class);

        $this->extension->applyToCollection(
            $queryBuilder,
            $queryNameGenerator,
            Game::class,
            new Get(),
            ['uri_variables' => ['sessionId' => 1]],
        );
    }

    public function testSkipsWithoutSessionId(): void
    {
        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->expects($this->never())->method('andWhere');

        $queryNameGenerator = $this->createStub(QueryNameGeneratorInterface::class);

        $this->extension->applyToCollection(
            $queryBuilder,
            $queryNameGenerator,
            Game::class,
            new GetCollection(),
            ['uri_variables' => []],
        );
    }

    public function testSkipsWhenOperationIsNull(): void
    {
        $queryBuilder = $this->createMock(QueryBuilder::class);
        $queryBuilder->expects($this->never())->method('andWhere');

        $queryNameGenerator = $this->createStub(QueryNameGeneratorInterface::class);

        $this->extension->applyToCollection(
            $queryBuilder,
            $queryNameGenerator,
            Game::class,
            null,
            ['uri_variables' => ['sessionId' => 1]],
        );
    }
}
