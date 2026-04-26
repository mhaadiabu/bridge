export function formatShortDate(stamp: number) {
  return new Date(stamp).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatHours(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}h`;
}
