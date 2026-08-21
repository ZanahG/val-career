export type ChampionsGroupId = "A" | "B" | "C" | "D";

export type ChampionsGroupRound = "Opening" | "Winners" | "Elimination" | "Decider";

export interface ChampionsGroupMatch {
  id: string;
  group: ChampionsGroupId;
  round: ChampionsGroupRound;
  teamAId?: string;
  teamBId?: string;
  played: boolean;
  bestOf: 3;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  loserId?: string;
}

export interface ChampionsGroup {
  id: ChampionsGroupId;
  teamIds: string[];
  matches: ChampionsGroupMatch[];
  qualifiedTeamIds: string[];
  eliminatedTeamIds: string[];
  complete: boolean;
}

export interface VCTChampionsGroupsState {
  playerTeamId: string;
  playerGroup: ChampionsGroupId;
  groups: {
    A: ChampionsGroup;
    B: ChampionsGroup;
    C: ChampionsGroup;
    D: ChampionsGroup;
  };
  complete: boolean;
}

export type ChampionsBracketRound =
  | "Upper Quarterfinals"
  | "Upper Semifinals"
  | "Upper Final"
  | "Lower Round 1"
  | "Lower Round 2"
  | "Lower Round 3"
  | "Lower Final"
  | "Grand Final";

export interface ChampionsBracketMatch {
  id: string;
  round: ChampionsBracketRound;
  teamAId?: string;
  teamBId?: string;
  played: boolean;
  bestOf: 3 | 5;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  loserId?: string;
}

export interface VCTChampionsBracketState {
  teamIds: string[];
  matches: ChampionsBracketMatch[];
  complete: boolean;
  championId?: string;
}

export interface ChampionsQualifiedTeam {
  teamId: string;
  circuit: "Americas" | "EMEA" | "Pacific" | "China";
  seed: 1 | 2 | 3 | 4;
}

export interface VCTChampionsState {
  qualifiedTeams: ChampionsQualifiedTeam[];
  groups: VCTChampionsGroupsState;
  bracket?: VCTChampionsBracketState;
  complete: boolean;
}