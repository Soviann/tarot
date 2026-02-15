<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimit;
use Symfony\Component\RateLimiter\RateLimiterFactory;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 10)]
#[AsEventListener(event: KernelEvents::RESPONSE)]
final readonly class RateLimitListener
{
    private const string RATE_LIMIT_KEY = '_rate_limit';

    public function __construct(
        private RateLimiterFactory $apiGeneralLimiter,
    ) {
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        if (!\str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $limiter = $this->apiGeneralLimiter->create($request->getClientIp() ?? 'anonymous');
        $limit = $limiter->consume();

        $request->attributes->set(self::RATE_LIMIT_KEY, $limit);

        if (!$limit->isAccepted()) {
            $response = new JsonResponse(
                ['detail' => 'Too many requests.', 'status' => 429, 'title' => 'Rate limit exceeded', 'type' => 'https://tools.ietf.org/html/rfc6585#section-4'],
                429,
                [
                    'Retry-After' => $limit->getRetryAfter()->getTimestamp() - \time(),
                    'X-RateLimit-Limit' => $limit->getLimit(),
                    'X-RateLimit-Remaining' => $limit->getRemainingTokens(),
                ],
            );
            $event->setResponse($response);
        }
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $limit = $request->attributes->get(self::RATE_LIMIT_KEY);

        if (!$limit instanceof RateLimit) {
            return;
        }

        $response = $event->getResponse();
        $response->headers->set('X-RateLimit-Limit', (string) $limit->getLimit());
        $response->headers->set('X-RateLimit-Remaining', (string) $limit->getRemainingTokens());
    }
}
