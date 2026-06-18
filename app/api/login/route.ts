import { NextResponse } from "next/server";
import { players, isAdminPlayer, type Player } from "@/lib/players";
import { playerPasswords } from "@/lib/server/credentials";

export async function POST(request: Request) {
  const body = await request.json();
  const player = body.player as string;
  const password = body.password as string;

  if (!players.includes(player as Player)) {
    return NextResponse.json({ ok: false, error: "Unknown player" }, { status: 400 });
  }

  if (playerPasswords[player as Player] !== password) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, isAdmin: isAdminPlayer(player as Player) });
}
