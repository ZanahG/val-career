export interface MatchPlayerStats {
  id: string;
  name: string;
  teamId: string;
  rating: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  kast: number;
  adr: number;
  headshot: number;
  firstKills: number;
  firstDeaths: number;
  agent?: string;
  agents?: string[];
}

export interface MatchMapStats {
  mapNumber: number;
  mapName: string;
  scoreA: number;
  scoreB: number;
  players: MatchPlayerStats[];
}

export interface MatchBoxScore {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  bestOf: 3 | 5;
  maps: MatchMapStats[];
  players: MatchPlayerStats[];
}