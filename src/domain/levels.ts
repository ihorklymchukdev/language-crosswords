export const LEVELS = ['A2', 'B1', 'B2'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = {
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-intermediate',
};
