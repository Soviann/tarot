interface PlayerAvatarProps {
  className?: string;
  name: string;
  playerId?: number;
  size?: "lg" | "md" | "sm";
}

const sizeClasses = {
  lg: "size-14 text-lg",
  md: "size-10 text-sm",
  sm: "size-8 text-xs",
} as const;

const avatarColors = [
  "bg-avatar-0",
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
  "bg-avatar-6",
  "bg-avatar-7",
  "bg-avatar-8",
  "bg-avatar-9",
] as const;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function PlayerAvatar({
  className = "",
  name,
  playerId,
  size = "md",
}: PlayerAvatarProps) {
  const parts = name.split(/[\s-]+/);
  const initials =
    parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const colorIndex = playerId !== undefined ? playerId % 10 : hashCode(name) % 10;
  const colorClass = avatarColors[colorIndex];

  return (
    <div
      aria-label={name}
      className={`${colorClass} ${sizeClasses[size]} inline-flex items-center justify-center rounded-full font-semibold text-white ${className}`.trim()}
      role="img"
    >
      {initials}
    </div>
  );
}
