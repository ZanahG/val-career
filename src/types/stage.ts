export type VCTStageGroupId = "Alpha" | "Omega";

export interface VCTStageGroupMatch {
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

export interface VCTStageStanding {
  teamId: string;
  wins: number;
  losses: number;
  mapsWon: number;
  mapsLost: number;
  roundsWon: number;
  roundsLost: number;
}

export interface VCTStageGroup {
  id: VCTStageGroupId;
  teamIds: string[];
  matches: VCTStageGroupMatch[];
  standings: VCTStageStanding[];
}

export interface VCTStageGroupsState {
  playerTeamId: string;
  playerGroup: VCTStageGroupId;
  groups: {Alpha: VCTStageGroup; Omega: VCTStageGroup};
  complete: boolean;
}

export type VCTStageBracketRound = "Upper Round 1" | "Upper Semifinals" | "Upper Final" | "Lower Round 1" | "Lower Round 2" | "Lower Round 3" | "Lower Final" | "Grand Final";

export interface VCTStageBracketMatch {
  id: string;
  round: VCTStageBracketRound;
  teamAId?: string;
  teamBId?: string;
  played: boolean;
  bestOf: 3 | 5;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  loserId?: string;
}

export interface VCTStageBracketState {
  playerTeamId: string;
  matches: VCTStageBracketMatch[];
  complete: boolean;
  championId?: string;
}