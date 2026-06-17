export const players = ["Nathan", "Silas", "Adam", "Evan", "Billy", "Sam"] as const;

export type Player = (typeof players)[number];
