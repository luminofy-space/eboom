import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  LayoutGrid,
  Users,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";

export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com";

export type LandingFeature = {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: LayoutGrid,
    titleKey: "features.canvas.title",
    descKey: "features.canvas.description",
  },
  {
    icon: ArrowLeftRight,
    titleKey: "features.incomeExpense.title",
    descKey: "features.incomeExpense.description",
  },
  {
    icon: Wallet,
    titleKey: "features.wallets.title",
    descKey: "features.wallets.description",
  },
  {
    icon: BarChart3,
    titleKey: "features.dashboard.title",
    descKey: "features.dashboard.description",
  },
  {
    icon: CalendarDays,
    titleKey: "features.calendarWhiteboard.title",
    descKey: "features.calendarWhiteboard.description",
  },
  {
    icon: Users,
    titleKey: "features.collaborate.title",
    descKey: "features.collaborate.description",
  },
];

export const LANDING_WORKFLOW_STEPS = [
  {
    step: 1,
    titleKey: "workflow.steps.canvas.title",
    descKey: "workflow.steps.canvas.description",
  },
  {
    step: 2,
    titleKey: "workflow.steps.flows.title",
    descKey: "workflow.steps.flows.description",
  },
  {
    step: 3,
    titleKey: "workflow.steps.visualize.title",
    descKey: "workflow.steps.visualize.description",
  },
] as const;

import type { IconName } from "tech-stack-icons";

export type TechStackEntry = {
  name: string;
  iconName?: IconName;
  label?: string;
};

export const TECH_STACK: TechStackEntry[] = [
  { name: "Next.js 15", iconName: "nextjs" },
  { name: "React 19", iconName: "react" },
  { name: "TypeScript", iconName: "typescript" },
  { name: "Tailwind CSS 4", iconName: "tailwindcss" },
  { name: "shadcn/ui", iconName: "shadcnui" },
  { name: "TanStack Query", iconName: "reactquery" },
  { name: "Redux Toolkit", iconName: "redux" },
  { name: "Express", iconName: "expressjs" },
  { name: "Drizzle ORM", iconName: "drizzle" },
  { name: "PostgreSQL", iconName: "postgresql" },
];

/** DarkVeil hueShift rotates the shader output in YIQ space — high values (>260) skew magenta/pink */
export const DARK_VEIL_PROPS = {
  hueShift: 248,
  noiseIntensity: 0.012,
  scanlineIntensity: 0.02,
  speed: 0.28,
  scanlineFrequency: 0.45,
  warpAmount: 0.32,
} as const;

export const LANDING_CARD_GLOW_PROPS = {
  glowColor: "265 70 55",
  backgroundColor: "transparent",
  borderRadius: 12,
  glowRadius: 24,
  glowIntensity: 0.85,
  glowOnly: true,
  colors: ["#6D28D9", "#7C3AED", "#000000"] as string[],
};

export const COLLABORATORS = [
  {
    name: "Karen Misaghian",
    github: "https://github.com/KarenMisaghian",
  },
  {
    name: "Sina Yekta",
    github: "https://github.com/ceenayekta",
  },
] as const;
