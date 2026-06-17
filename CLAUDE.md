# NTTRKY Golf Trip Tracker

## Project Brief

A mobile-friendly web app for tracking a golf trip to Utah in late July 2026. Six players (Nathan, Silas, Adam, Evan, Billy, Sam), split into groups for 2–3 rounds. The user sets it up and the group uses it on their phones — no install required, just a shared URL.

The primary goal is **group fun and trash talk**: live leaderboards, side bet standings, and auto-generated end-of-round awards. Everything in one place.

## What to Build

### Scorecard
- Hole-by-hole score entry for all 6 players per round (players may be split across multiple groups/tee times within a round)
- Running totals and score relative to par
- Par input per hole (so the app knows the course layout)

### Live Leaderboard
- Shows standings for the current round in real time
- Trip leaderboard aggregated across all rounds (total strokes or cumulative score vs. par)

### Skins Tracker
- Auto-calculated from scores each hole
- Ties carry over to the next hole
- Tracks skins won per player and total money value (configurable buy-in per skin)

### Cost Tracker
Three categories:
1. **Green fees / cart fees** — what each person paid per round
2. **Skins / side bet winnings** — net money owed between players at end of each round
3. **Trip expenses** — food, lodging, etc. split across the group (simple expense log with even split by default)

### End-of-Round Awards
Auto-generated fun stats from the scorecard data:
- Most 3-putts (or worst hole)
- Longest winning streak on holes
- Most skins won
- Worst single hole
- etc.

## Group Details
- **Players**: 6 — Nathan, Silas, Adam, Evan, Billy, Sam
- **Rounds**: 2–3 rounds over the trip
- **Tech level**: Mixed — the user runs the app and shows the group; others just view on their phones

## Suggested Stack
- **Framework**: Next.js (App Router)
- **State persistence**: Supabase (free tier) so scores survive phone refreshes and all players see the same live data; fall back to `localStorage` for a simpler offline-only version
- **Deployment**: Vercel (free tier, one command deploy)
- **Styling**: Tailwind CSS, mobile-first

## Key UX Constraints
- Must work well on mobile browsers (no app install)
- Score entry should be fast — one person entering scores for the group mid-round
- Leaderboard should be readable at a glance on a phone screen
