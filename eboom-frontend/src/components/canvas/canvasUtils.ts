export interface CanvasIconConfig {
  emoji: string;
  color: string;
}

export const PRESET_COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#ef4444", // red
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#eab308", // yellow
  "#64748b", // slate
];

export const PRESET_EMOJIS = [
  "📋", "💰", "💵", "💳", "🏦", "📊", "📈", "🏠",
  "🏢", "💼", "🎯", "🌍", "✈️", "🎓", "🏥", "🍕",
  "🎮", "🚗", "🌱", "⚡", "💡", "🎵", "📱", "🖥️",
];

export const DEFAULT_CANVAS_ICON: CanvasIconConfig = {
  emoji: PRESET_EMOJIS[0],
  color: PRESET_COLORS[0],
};

export function parseCanvasIcon(photoUrl?: string | null): CanvasIconConfig {
  if (!photoUrl) return DEFAULT_CANVAS_ICON;
  try {
    const parsed = JSON.parse(photoUrl);
    if (parsed.emoji && parsed.color) return parsed as CanvasIconConfig;
  } catch {
    // not a JSON icon config, fall through to default
  }
  return DEFAULT_CANVAS_ICON;
}

export function serializeCanvasIcon(config: CanvasIconConfig): string {
  return JSON.stringify(config);
}
