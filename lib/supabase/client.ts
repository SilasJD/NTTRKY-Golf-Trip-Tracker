import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Team = {
  name: string;
  players: string[];
};

export type TeeTime = {
  id: string;
  course_slug: "wolf-creek" | "mt-ogden";
  play_date: string;
  tee_time: string;
  players: string[];
  format: "stroke" | "scramble";
  teams: Team[];
  created_at: string;
};

export type ScoreRow = {
  id: string;
  tee_time_id: string;
  player_name: string;
  hole_number: number;
  strokes: number | null;
  updated_at: string;
};
