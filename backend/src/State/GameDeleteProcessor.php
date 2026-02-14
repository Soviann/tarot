<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\RemoveProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Game;

/**
 * Restaure les ELO avant de supprimer une donne.
 *
 * @implements ProcessorInterface<Game, void>
 */
final readonly class GameDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EloRevertHelper $eloRevertHelper,
        private RemoveProcessor $removeProcessor,
    ) {
    }

    /**
     * @param Game $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $this->eloRevertHelper->revert($data);

        $this->removeProcessor->process($data, $operation, $uriVariables, $context);
    }
}
