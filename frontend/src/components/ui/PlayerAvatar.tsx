import { useTheme } from "next-themes";
import { getThemeConfig } from "../../services/themeRegistry";

interface PlayerAvatarProps {
  className?: string;
  color?: string | null;
  name: string;
  playerId?: number;
  size?: "lg" | "md" | "sm";
}

const sizeClasses = {
  lg: "size-14 text-lg",
  md: "size-10 text-sm",
  sm: "size-8 text-xs",
} as const;

const palette = [
  "#264653",
  "#2a9d8f",
  "#e9c46a",
  "#f4a261",
  "#e76f51",
  "#6d597a",
  "#b56576",
  "#355070",
  "#52796f",
  "#bc6c25",
] as const;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.split(/[\s-]+/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function PlayerAvatar({
  className = "",
  color,
  name,
  playerId,
  size = "md",
}: PlayerAvatarProps) {
  const { resolvedTheme } = useTheme();
  const themeConfig = getThemeConfig(resolvedTheme);

  if (themeConfig) {
    const { avatars } = themeConfig;
    const iconIndex = playerId !== undefined ? playerId % avatars.icons.length : hashCode(name) % avatars.icons.length;
    const sizeClass = sizeClasses[size].split(" ")[0];
    const initials = getInitials(name);

    return (
      <div className={`inline-flex flex-col items-center gap-0.5 ${className}`.trim()} role="img" aria-label={name}>
        <img
          alt=""
          className={`${sizeClass} rounded-full object-cover`}
          src={avatars.icons[iconIndex]}
        />
        {avatars.initialsPosition === "below" && (
          <span className="text-[0.6rem] font-bold leading-none text-text-secondary">
            {initials}
          </span>
        )}
      </div>
    );
  }

  const useCustomColor = !!color;
  const colorIndex =
    playerId !== undefined ? playerId % palette.length : hashCode(name) % palette.length;
  const backgroundColor = useCustomColor ? color : palette[colorIndex];

  return (
    <div
      aria-label={name}
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full font-semibold text-white ${className}`.trim()}
      role="img"
      style={{ backgroundColor: backgroundColor! }}
    >
      {getInitials(name)}
    </div>
  );
}
