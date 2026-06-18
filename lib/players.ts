export const players = ["Nathan", "Silas", "Adam", "Evan", "Billy", "Sam"] as const;

export type Player = (typeof players)[number];

export const playerHints: Record<Player, string> = {
  Nathan: "Your favorite motherly teammate on Artifice",
  Silas: "",
  Adam: "Colin's short roommate in college",
  Evan: "Previous Karate Master / Golf Pro at Rolling Road",
  Billy: "The fruit that was the name of the tunnel we biked through",
  Sam: "Best zyn flavor",
};

export const adminPlayers: Player[] = ["Silas"];

export function isAdminPlayer(player: Player) {
  return adminPlayers.includes(player);
}
