import type {CompetitiveCircuit} from "./career";

export type MastersSeed = 1 | 2 | 3;

export interface MastersQualifiedTeam {
  teamId: string;
  circuit: CompetitiveCircuit;
  seed: MastersSeed;
}

export interface MastersSwissMatch {
  id: string;
  round: number;
  teamAId: string;
  teamBId: string;
  played: boolean;
  mapsA: number;
  mapsB: number;
  roundsA: number;
  roundsB: number;
  winnerId?: string;
}

export interface MastersSwissStanding {
  teamId: string;
  wins: number;
  losses: number;
  mapsWon: number;
  mapsLost: number;
  roundsWon: number;
  roundsLost: number;
  qualified: boolean;
  eliminated: boolean;
}

export interface VCTMastersSwissState {
  teamIds: string[];
  matches: MastersSwissMatch[];
  standings: MastersSwissStanding[];
  complete: boolean;
}

export type MastersBracketRound = "Upper Quarterfinals" | "Upper Semifinals" | "Upper Final" | "Lower Round 1" | "Lower Round 2" | "Lower Round 3" | "Lower Final" | "Grand Final";

export interface MastersBracketMatch {
  id: string;
  round: MastersBracketRound;
  teamAId?: string;
  teamBId?: string;
  played: boolean;
  bestOf: 3 | 5;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  loserId?: string;
}

export interface VCTMastersBracketState {
  teamIds: string[];
  matches: MastersBracketMatch[];
  complete: boolean;
  championId?: string;
}

export interface VCTMastersState {
  qualifiedTeams: MastersQualifiedTeam[];
  directPlayoffTeamIds: string[];
  swissTeamIds: string[];
  swiss: VCTMastersSwissState;
  bracket?: VCTMastersBracketState;
  complete: boolean;
}