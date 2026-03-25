const DECEMBER = 11; // 0-indexed
const DOOM_DAY = 10;

const BASE_HINT_CHANCE = 0.02;
const DOOM_WEEK_HINT_CHANCE = 0.1;

export function isDoomWeek(now: Date = new Date()): boolean {
  if (now.getMonth() !== DECEMBER) return false;

  const dec10 = new Date(now.getFullYear(), DECEMBER, DOOM_DAY);
  // getDay(): 0=Sun, 1=Mon ... 6=Sat → convert to Mon=0 offset
  const dayOfWeek = (dec10.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const mondayDay = DOOM_DAY - dayOfWeek;
  const sundayDay = mondayDay + 6;

  const day = now.getDate();
  return day >= mondayDay && day <= sundayDay;
}

export function getHintChance(now: Date = new Date()): number {
  return isDoomWeek(now) ? DOOM_WEEK_HINT_CHANCE : BASE_HINT_CHANCE;
}
