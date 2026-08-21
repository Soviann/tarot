import { useTheme } from "next-themes";

const CUSTOM_BADGE_ICONS: Record<string, string> = {
  catch_them_all: "/pokeball.png",
};

export const NOEL_BADGE_VARIANTS: Record<string, string> = {
  audacious: "🎁",
  catch_them_all: "🎄",
  centurion: "🎄",
  champion_streak: "🕯️",
  close_call: "❄️",
  comfortable_10: "🎄",
  comfortable_20: "🎄",
  comfortable_30: "🎄",
  comfortable_40: "🎄",
  comfortable_50: "🎄",
  comeback: "🎁",
  destiny_hand: "⛄",
  first_chelem: "🌟",
  first_game: "🎁",
  friend_caller: "🔔",
  garde_contre_won: "🏆",
  kamikaze: "⚔️",
  konami: "🕹️",
  last_place: "🪵",
  losing_streak: "📉",
  marathon: "⏰",
  night_owl: "🦌",
  no_net: "🎯",
  petit_malin: "🧝",
  regular: "🔟",
  rising_star: "🌟",
  self_caller: "🤙",
  social: "👥",
  star_collector: "⭐",
  star_shower: "🌠",
  surprise_chelem: "🎩",
  three_outliers_loss: "❄️",
  triple_poignee: "🤲",
  wall: "⛄",
  zero_bout: "🎯",
};

interface BadgeEmojiProps {
  className?: string;
  emoji: string;
  type: string;
}

export default function BadgeEmoji({ className = "text-2xl", emoji, type }: BadgeEmojiProps) {
  const { resolvedTheme } = useTheme();
  const isNoel = resolvedTheme === "noel";

  if (isNoel && NOEL_BADGE_VARIANTS[type]) {
    return <span className={className}>{NOEL_BADGE_VARIANTS[type]}</span>;
  }

  const customIcon = CUSTOM_BADGE_ICONS[type];

  if (customIcon) {
    return <img alt={emoji} className="inline-block size-[1.2em]" src={customIcon} />;
  }

  return <span className={className}>{emoji}</span>;
}
