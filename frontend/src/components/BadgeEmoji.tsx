const CUSTOM_BADGE_ICONS: Record<string, string> = {
  catch_them_all: "/pokeball.png",
};

interface BadgeEmojiProps {
  className?: string;
  emoji: string;
  type: string;
}

export default function BadgeEmoji({ className = "text-2xl", emoji, type }: BadgeEmojiProps) {
  const customIcon = CUSTOM_BADGE_ICONS[type];

  if (customIcon) {
    return <img alt={emoji} className="inline-block size-[1.2em]" src={customIcon} />;
  }

  return <span className={className}>{emoji}</span>;
}
