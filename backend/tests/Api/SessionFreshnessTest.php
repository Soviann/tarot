<?php

declare(strict_types=1);

namespace App\Tests\Api;

class SessionFreshnessTest extends ApiTestCase
{
    public function testFreshnessReturnsUpdatedAt(): void
    {
        $session = $this->createSessionWithPlayers();

        $response = static::createClient()->request('GET', '/api/sessions/'.$session->getId().'/freshness');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertArrayHasKey('updatedAt', $data);
    }

    public function testFreshnessReturns404ForUnknownSession(): void
    {
        static::createClient()->request('GET', '/api/sessions/99999/freshness');

        $this->assertResponseStatusCodeSame(404);
    }
}
