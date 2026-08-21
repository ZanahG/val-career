import type {TeamDefinition} from "./career";

export type SeasonPhase = "Regular Season" | "Ascension" | "Complete";

export interface MatchResult {
  id: string;
  opponentId: string;
  won: boolean;
  scoreFor: number;
  scoreAgainst: number;
  playerRating: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  summary: string;
}

export interface StandingRow {
  teamId: string;
  wins: number;
  losses: number;
  roundsWon: number;
  roundsLost: number;
}

export interface SeasonState {
  season: number;
  phase: SeasonPhase;
  week: number;
  schedule: string[];
  playedMatches: MatchResult[];
  standings: StandingRow[];
  ascensionSchedule: string[];
  ascensionMatches: MatchResult[];
  ascensionQualified: boolean;
  ascensionWon: boolean;
}

export interface MatchSimulationContext {
  playerOverall: number;
  team: TeamDefinition;
  opponent: TeamDefinition;
}