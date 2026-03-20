<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Metadata\Operation;
use App\Entity\Session;
use App\Repository\SessionRepository;
use App\State\SessionCollectionProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class SessionCollectionProviderTest extends TestCase
{
    private SessionCollectionProvider $provider;
    private SessionRepository&MockObject $sessionRepository;

    protected function setUp(): void
    {
        $this->sessionRepository = $this->createMock(SessionRepository::class);
        $this->provider = new SessionCollectionProvider($this->sessionRepository);
    }

    public function testDelegatesToRepository(): void
    {
        $sessions = [new Session(), new Session()];
        $this->sessionRepository->expects($this->once())
            ->method('findRecentWithLastActivity')
            ->willReturn($sessions);

        $operation = $this->createStub(Operation::class);
        $result = $this->provider->provide($operation);

        $this->assertSame($sessions, $result);
    }

    public function testReturnsEmptyArray(): void
    {
        $this->sessionRepository->expects($this->once())
            ->method('findRecentWithLastActivity')
            ->willReturn([]);

        $operation = $this->createStub(Operation::class);
        $result = $this->provider->provide($operation);

        $this->assertSame([], $result);
    }
}
