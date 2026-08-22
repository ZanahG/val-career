import type {CompetitiveCircuit} from "./career";
import type {MatchResult} from "./season";
import type {VCTStageBracketState,VCTStageGroupsState} from "./stage";
import type {VCTMastersState} from "./masters";
import type {VCTChampionsState} from "./champions";

export type VCTPhase = "Kickoff" | "Masters 1" | "Stage 1" | "Stage 1 Playoffs" | "Masters 2" | "Stage 2" | "Stage 2 Playoffs" | "Champions" | "Complete";
export type PlayableVCTPhase = Exclude<VCTPhase, "Complete">;
export type VCTEventStatus = "Locked" | "Active" | "Qualified" | "Eliminated" | "Complete" | "Skipped";

export type VCTBracketSection = "Upper" | "Middle" | "Lower";
export type VCTBracketMatchStatus = "Locked" | "Ready" | "Complete";
export type VCTBracketSourceResult = "Winner" | "Loser";

export interface VCTBracketTeamSlot {
  teamId?: string;
  sourceMatchId?: string;
  sourceResult?: VCTBracketSourceResult;
}

export interface VCTBracketMatch {
  id: string;
  section: VCTBracketSection;
  round: number;
  roundName: string;
  order: number;
  sequence: number;
  bestOf: 3 | 5;
  teamA: VCTBracketTeamSlot;
  teamB: VCTBracketTeamSlot;
  teamAId?: string;
  teamBId?: string;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  loserId?: string;
  status: VCTBracketMatchStatus;
  playerMatch: boolean;
}

export interface VCTBracketState {
  matches: VCTBracketMatch[];
  playerTeamId: string;
  qualifiedTeamIds: string[];
  playerQualified: boolean;
  playerEliminated: boolean;
  complete: boolean;
}

export interface VCTEventState {
  status: VCTEventStatus;
  schedule: string[];
  matches: MatchResult[];
  placement?: number;
  championshipPointsEarned: number;
  bracket?: VCTBracketState;
  stageGroups?: VCTStageGroupsState;
  stageBracket?: VCTStageBracketState;
  masters?: VCTMastersState;
  champions?: VCTChampionsState;
}

export interface VCTPendingEvent {
  eventId: string;
  nextPhase: PlayableVCTPhase | "Complete";
  nextSchedule: string[];
}

export interface VCTSeasonState {
  season: number;
  circuit: CompetitiveCircuit;
  phase: VCTPhase;
  championshipPointsByTeam:Record<string,number>;
  events: Record<PlayableVCTPhase, VCTEventState>;
  pendingEvent?: VCTPendingEvent;
  marketWindowPending?:"midseason"|"offseason";
}

export interface VCTSeasonDefinition {
  year: number;
  masters1: {name: string; location: string};
  masters2: {name: string; location: string};
  champions: {name: string; location: string};
}