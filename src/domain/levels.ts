export const LEVELS = ['A2', 'B1', 'B2'] as const;
export type Level = (typeof LEVELS)[number];
