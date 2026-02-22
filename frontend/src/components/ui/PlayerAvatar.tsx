import { useTheme } from "next-themes";

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

interface ThemeAvatarConfig {
  icons: readonly string[];
  initialsPosition: "hidden" | "inside" | "below";
}

const THEME_AVATARS: Record<string, ThemeAvatarConfig> = {
  doom: {
    icons: [
      "/images/doom/doom-bleeding-256x256.png",
      "/images/doom/doom-d-256x256.png",
      "/images/doom/doom-demon-2-256x256.png",
      "/images/doom/doom-demon-256x256.png",
      "/images/doom/doom-demon-green-256x256.png",
      "/images/doom/doom-demon-red-256x256.png",
      "/images/doom/doom-marine-256x256.png",
      "/images/doom/doomguy-face-512.png",
    ],
    initialsPosition: "hidden",
  },
};

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
  const themeConfig = resolvedTheme ? THEME_AVATARS[resolvedTheme] : undefined;

  if (themeConfig) {
    const iconIndex = playerId !== undefined ? playerId % themeConfig.icons.length : hashCode(name) % themeConfig.icons.length;
    const sizeClass = sizeClasses[size].split(" ")[0];
    const initials = getInitials(name);

    return (
      <div className={`inline-flex flex-col items-center gap-0.5 ${className}`.trim()} role="img" aria-label={name}>
        <img
          alt=""
          className={`${sizeClass} rounded-full object-cover`}
          src={themeConfig.icons[iconIndex]}
        />
        {themeConfig.initialsPosition === "below" && (
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
