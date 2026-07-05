export const AUTH_COLORS = ["#1C1917", "#6D28D9", "#1C1917"] as const;

const [base, accent] = [AUTH_COLORS[0], AUTH_COLORS[1]];

export const authStaticBackgroundStyle = {
  background: `radial-gradient(ellipse at 30% 20%, ${accent} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${accent} 0%, transparent 50%), ${base}`,
};
