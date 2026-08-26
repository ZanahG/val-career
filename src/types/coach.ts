import type {CompetitiveCircuit,PlayerRegion,PlayerRole,PlayerStats} from "./career";
import type {VCTBracketState} from "./vct";

export type CoachStage="Tier 2"|"VCT";
export type CoachStageEvent="Stage 1"|"Stage 2";
export type CoachMastersEvent="Masters 1"|"Masters 2";

export type CoachTacticalStyle="Balanced"|"Aggressive"|"Controlled"|"Reactive"|"Anti-Strat";
export type CoachPace="Slow"|"Balanced"|"Fast";
export type CoachRisk="Low"|"Medium"|"High";
export type CoachAttackStyle="Defaults"|"Executions"|"Map Control"|"Explosive";
export type CoachDefenseStyle="Passive"|"Standard"|"Aggressive"|"Retake";
export type CoachOperatorUsage="Rare"|"Situational"|"Priority";

export type CoachMapName="Abyss"|"Ascent"|"Bind"|"Breeze"|"Corrode"|"Haven"|"Icebox"|"Lotus"|"Pearl";
export type CoachVetoAction="ban"|"pick";

export type CoachVCTPhase=
  |"Kickoff"
  |"Masters 1"
  |"Stage 1"
  |"Stage 1 Playoffs"
  |"Masters 2"
  |"Stage 2"
  |"Stage 2 Playoffs"
  |"Champions"
  |"Complete";

export type CoachVCTEventStatus="Locked"|"Active"|"Complete"|"Not Qualified";

export type CoachMastersPhase="Swiss"|"Playoffs"|"Complete";
export type CoachMastersMatchStatus="Pending"|"Ready"|"Complete";
export type CoachMastersMatchStage="Swiss"|"Playoffs";

export type CoachStagePhase="Regular Season"|"Playoffs"|"Complete";
export type CoachStageGroup="Alpha"|"Omega";
export type CoachStageMatchStatus="Pending"|"Ready"|"Complete";

export type CoachChampionsPhase="Groups"|"Playoffs"|"Complete";
export type CoachChampionsGroup="A"|"B"|"C"|"D";
export type CoachChampionsMatchStatus="Pending"|"Ready"|"Complete";
export type CoachChampionsMatchStage="Groups"|"Playoffs";
export type CoachChampionsQualificationMethod="Stage 2"|"Championship Points";

/* =========================
   STAGE 1 / STAGE 2
========================= */
export interface CoachTransferRequest {
  playerId:string;
  playerName:string;
  teamId:string;
  reason:"Not Starting"|"Seeking Stronger Team"|"Contract Situation"|"Career Ambition";
}
export interface CoachMidseasonMarketState {
  season:number;
  phase:"Market"|"Complete";
  transfers:CoachOffseasonTransfer[];
  transferRequests:CoachTransferRequest[];
  freeAgentIds:string[];
  completed:boolean;
}
export interface CoachStageStanding {
  teamId:string;
  group:CoachStageGroup;
  wins:number;
  losses:number;
  mapsWon:number;
  mapsLost:number;
  qualified:boolean;
  eliminated:boolean;
}

export interface CoachStageMatch {
  id:string;
  phase:"Regular Season"|"Playoffs";
  group?:CoachStageGroup;
  round:string;
  bestOf:3|5;
  teamAId:string|null;
  teamBId:string|null;
  scoreA:number|null;
  scoreB:number|null;
  winnerId:string|null;
  loserId:string|null;
  status:CoachStageMatchStatus;
}

export interface CoachStageState {
  event:CoachStageEvent;
  playerTeamId:string;
  phase:CoachStagePhase;
  groups:{
    Alpha:string[];
    Omega:string[];
  };
  standings:CoachStageStanding[];
  matches:CoachStageMatch[];
  playoffSeeds:string[];
  placementByTeam:Record<string,number>;
  complete:boolean;
  competitiveStrengthByTeam?:Record<string,number>;
}

/* Aliases temporales para no romper código antiguo */

export type CoachStage1Phase=CoachStagePhase;
export type CoachStage1Standing=CoachStageStanding;
export type CoachStage1Match=CoachStageMatch;

/* =========================
   MASTERS 1 / MASTERS 2
========================= */

export interface CoachMastersQualifier {
  teamId:string;
  circuit:CompetitiveCircuit;
  seed:1|2|3;
}

export interface CoachMastersSwissStanding {
  teamId:string;
  wins:number;
  losses:number;
  qualified:boolean;
  eliminated:boolean;
}

export interface CoachMastersMatch {
  id:string;
  stage:CoachMastersMatchStage;
  round:string;
  bestOf:3|5;
  teamAId:string|null;
  teamBId:string|null;
  scoreA:number|null;
  scoreB:number|null;
  winnerId:string|null;
  loserId:string|null;
  status:CoachMastersMatchStatus;
}

export interface CoachMastersState {
  event:CoachMastersEvent;
  playerTeamId:string;
  phase:CoachMastersPhase;
  qualifiers:CoachMastersQualifier[];
  swissStandings:CoachMastersSwissStanding[];
  playoffQualifiedIds:string[];
  matches:CoachMastersMatch[];
  placementByTeam:Record<string,number>;
  complete:boolean;
  competitiveStrengthByTeam?:Record<string,number>;
}

/* =========================
   CHAMPIONS
========================= */

export interface CoachChampionsQualifier {
  teamId:string;
  circuit:CompetitiveCircuit;
  seed:1|2|3|4;
  qualificationMethod:CoachChampionsQualificationMethod;
  championshipPoints:number;
}

export interface CoachChampionsGroupStanding {
  teamId:string;
  group:CoachChampionsGroup;
  wins:number;
  losses:number;
  mapsWon:number;
  mapsLost:number;
  qualified:boolean;
  eliminated:boolean;
}

export interface CoachChampionsMatch {
  id:string;
  stage:CoachChampionsMatchStage;
  group?:CoachChampionsGroup;
  round:string;
  bestOf:3|5;
  teamAId:string|null;
  teamBId:string|null;
  scoreA:number|null;
  scoreB:number|null;
  winnerId:string|null;
  loserId:string|null;
  status:CoachChampionsMatchStatus;
}

export interface CoachChampionsState {
  playerTeamId:string;
  phase:CoachChampionsPhase;
  qualifiers:CoachChampionsQualifier[];
  groups:{
    A:string[];
    B:string[];
    C:string[];
    D:string[];
  };
  groupStandings:CoachChampionsGroupStanding[];
  matches:CoachChampionsMatch[];
  playoffQualifiedIds:string[];
  placementByTeam:Record<string,number>;
  championTeamId:string|null;
  complete:boolean;
  competitiveStrengthByTeam?:Record<string,number>;
}

/* =========================
   RESULTADOS / TEMPORADA
========================= */

export interface CoachMatchResult {
  id:string;
  opponentTeamId:string;
  won:boolean;
  mapsWon:number;
  mapsLost:number;
  maps:CoachMapName[];
}

export interface CoachVCTEventState {
  status:CoachVCTEventStatus;
  matches:CoachMatchResult[];
  placement?:number;
  qualified:boolean;
}

export interface CoachVCTSeasonState {
  season:number;
  circuit:CompetitiveCircuit;
  phase:CoachVCTPhase;

  events:{
    Kickoff:CoachVCTEventState;
    "Masters 1":CoachVCTEventState;
    "Stage 1":CoachVCTEventState;
    "Stage 1 Playoffs":CoachVCTEventState;
    "Masters 2":CoachVCTEventState;
    "Stage 2":CoachVCTEventState;
    "Stage 2 Playoffs":CoachVCTEventState;
    Champions:CoachVCTEventState;
  };

  kickoffBracket?:VCTBracketState;

  masters1?:CoachMastersState;
  masters2?:CoachMastersState;

  stage1?:CoachStageState;
  stage2?:CoachStageState;

  champions?:CoachChampionsState;

  championshipPointsByTeam:Record<string,number>;
}

/* =========================
   MAP VETO
========================= */

export interface CoachVetoStep {
  team:"player"|"opponent";
  action:CoachVetoAction;
}

export interface CoachVetoSelection {
  map:CoachMapName;
  team:"player"|"opponent";
  action:CoachVetoAction;
}

export interface CoachMapVetoState {
  opponentTeamId:string;
  bestOf:3|5;
  availableMaps:CoachMapName[];
  selections:CoachVetoSelection[];
  currentStep:number;
  completed:boolean;
  seriesMaps:CoachMapName[];
}

/* =========================
   MAP POOL
========================= */

export interface CoachMapProfile {
  map:CoachMapName;
  strength:number;
  attack:number;
  defense:number;
  preparation:number;
}

export interface CoachMapPool {
  maps:CoachMapProfile[];
}

/* =========================
   TÁCTICAS
========================= */

export interface CoachTactics {
  pace:CoachPace;
  risk:CoachRisk;
  attackStyle:CoachAttackStyle;
  defenseStyle:CoachDefenseStyle;
  operatorUsage:CoachOperatorUsage;
}

/* =========================
   COACH
========================= */

export interface CoachProfile {
  name:string;
  age:number;
  nationality:string;
  reputation:number;
  season:number;
  teamId:string;
  stage:CoachStage;
  circuit:CompetitiveCircuit;
  region:PlayerRegion;
  trophies:string[];
  careerHistory:CoachCareerHistory[];
}

export interface CoachCareerHistory {
  season:number;
  teamId:string;
  teamName:string;
  stage:CoachStage;
  wins:number;
  losses:number;
  placement:number;
  trophies:string[];
}

/* =========================
   JUGADORES / EQUIPO
========================= */

export interface CoachPlayer {
  id:string;
  ign:string;
  teamId:string;
  role:PlayerRole|"IGL";
  stats:PlayerStats;
  overall:number;
  salary:number;
  age:number;
  starter:boolean;
  contractSeasonsRemaining?:number;
  potential:number;
  peakAge:number;
  marketValue:number;
}

export interface CoachTeamFinances {
  monthlyBudget:number;
  currentMonthlyPayroll:number;
  transferBudget:number;
}

export interface CoachTeamState {
  teamId:string;
  roster:CoachPlayer[];
  finances:CoachTeamFinances;
  chemistry:number;
  form:number;
  tacticalStyle:CoachTacticalStyle;
  tactics:CoachTactics;
  mapPool:CoachMapPool;
  playerAssignments:CoachPlayerAssignment[];
  trainingSessions:number;
  trainingPeriod:string|null;
  trainedMapsThisPeriod:CoachMapName[];
}

export type CoachPlayerTacticalRole="Entry"|"Secondary Entry"|"Main Operator"|"IGL"|"Lurker"|"Anchor"|"Flex";

export interface CoachPlayerAssignment {
  playerId:string;
  tacticalRole:CoachPlayerTacticalRole;
}

export type CoachOffseasonPhase="Contracts"|"Market"|"Complete";

export interface CoachOffseasonDeparture {
  playerId:string;
  playerName:string;
  previousTeamId:string;
  reason:"Contract Expired"|"Released"|"Transfer"|"Retired";
}

export interface CoachOffseasonRenewal {
  playerId:string;
  playerName:string;
  seasons:number;
  salary:number;
}

export interface CoachOffseasonTransfer {
  playerId:string;
  playerName:string;
  fromTeamId:string;
  toTeamId:string;
  salary:number;
  transferFee:number;
}

export interface CoachOffseasonState {
  season:number;
  phase:CoachOffseasonPhase;
  departures:CoachOffseasonDeparture[];
  renewals:CoachOffseasonRenewal[];
  transfers:CoachOffseasonTransfer[];
  transferRequests:CoachTransferRequest[];
  freeAgentIds:string[];
  completed:boolean;
}

/* =========================
   CAREER
========================= */

export interface CoachCareerState {
  coach:CoachProfile;
  team:CoachTeamState;
  playerPool:CoachPlayer[];
  cpuFinancesByTeam:Record<string,CoachTeamFinances>;
  seasonState:CoachVCTSeasonState|null;
  offseason?:CoachOffseasonState|null;
  midseasonMarket?:CoachMidseasonMarketState|null;
}