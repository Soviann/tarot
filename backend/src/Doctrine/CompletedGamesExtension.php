<?php

declare(strict_types=1);

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\Enum\GameStatus;
use Doctrine\ORM\QueryBuilder;

/**
 * Filtre les games pour n'afficher que les complétées sur le sub-resource GET /sessions/{id}/games.
 */
final class CompletedGamesExtension implements QueryCollectionExtensionInterface
{
    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        if (Game::class !== $resourceClass || !$operation instanceof GetCollection) {
            return;
        }

        // N'appliquer que sur le sub-resource (présence de sessionId dans les URI variables)
        /** @var array<string, mixed> $uriVariables */
        $uriVariables = $context['uri_variables'] ?? [];
        if (!isset($uriVariables['sessionId'])) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];
        $paramName = $queryNameGenerator->generateParameterName('status');
        $queryBuilder
            ->andWhere(\sprintf('%s.status = :%s', $rootAlias, $paramName))
            ->setParameter($paramName, GameStatus::Completed);
    }
}
