<?php

declare(strict_types=1);

namespace App\Tests\Api;

class RateLimitingTest extends ApiTestCase
{
    public function testApiReturns429WhenRateLimitExceeded(): void
    {
        $this->client->disableReboot();

        // Exhaust the rate limit by sending requests up to the limit
        for ($i = 0; $i < 60; ++$i) {
            $this->client->request('GET', '/api/players');
        }

        // The next request should be rate limited
        $this->client->request('GET', '/api/players');
        $this->assertResponseStatusCodeSame(429);
    }

    public function testRateLimitHeadersArePresent(): void
    {
        $this->client->disableReboot();

        $this->client->request('GET', '/api/players');
        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('X-RateLimit-Limit', '60');
        $this->assertResponseHeaderSame('X-RateLimit-Remaining', '59');
    }
}
