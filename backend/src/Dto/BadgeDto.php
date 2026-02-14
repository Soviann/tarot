<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class BadgeDto implements \JsonSerializable
{
    public function __construct(
        public string $description,
        public string $emoji,
        public string $label,
        public string $type,
    ) {
    }

    /**
     * @param array{description: string, emoji: string, label: string, type: string} $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            description: $data['description'],
            emoji: $data['emoji'],
            label: $data['label'],
            type: $data['type'],
        );
    }

    /**
     * @return array{description: string, emoji: string, label: string, type: string}
     */
    public function jsonSerialize(): array
    {
        return [
            'description' => $this->description,
            'emoji' => $this->emoji,
            'label' => $this->label,
            'type' => $this->type,
        ];
    }
}
