import type {CareerPlayer,CompetitiveCircuit} from "../types/career";
import type {MatchResult} from "../types/season";
import type {ChampionsBracketMatch,ChampionsBracketRound,ChampionsGroup,ChampionsGroupId,ChampionsGroupMatch,ChampionsQualifiedTeam,VCTChampionsBracketState,VCTChampionsGroupsState,VCTChampionsState} from "../types/champions";
import {TEAMS,getTeamById} from "../data/teams";
import {simulateMatch} from "./season";

const CIRCUITS: CompetitiveCircuit[] = ["Americas","EMEA","Pacific","China"];
const GROUPS: ChampionsGroupId[] = ["A","B","C","D"];

const random = (min: number,max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number,max: number) => Math.random() * (max - min) + min;
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - .5);

export function createDefaultChampionsQualifiedTeams(): ChampionsQualifiedTeam[] {
  return CIRCUITS.flatMap((circuit) => simulateCircuitChampionsQualifiers(circuit));
}

export function createChampionsState(qualifiedTeams: ChampionsQualifiedTeam[],playerTeamId: string): VCTChampionsState {
  const groups = createChampionsGroups(qualifiedTeams,playerTeamId);

  return {
    qualifiedTeams,
    groups,
    complete: false,
  };
}

export function createChampionsGroups(qualifiedTeams: ChampionsQualifiedTeam[],playerTeamId: string): VCTChampionsGroupsState {
  const assignments = createGroupAssignments(qualifiedTeams);

  const groups = {
    A: createGroup("A",assignments.A),
    B: createGroup("B",assignments.B),
    C: createGroup("C",assignments.C),
    D: createGroup("D",assignments.D),
  };

  const playerGroup = GROUPS.find((groupId) => groups[groupId].teamIds.includes(playerTeamId)) ?? "A";

  return {
    playerTeamId,
    playerGroup,
    groups,
    complete: false,
  };
}

export function getNextPlayerChampionsGroupMatch(state: VCTChampionsGroupsState) {
  const group = state.groups[state.playerGroup];

  return group.matches.find((match) => !match.played && match.teamAId && match.teamBId && (match.teamAId === state.playerTeamId || match.teamBId === state.playerTeamId));
}

export function playChampionsGroupMatch(player: CareerPlayer,state: VCTChampionsGroupsState): {state: VCTChampionsGroupsState; result?: MatchResult} {
  const playerTeamId = player.currentTeamId;
  if (!playerTeamId || state.complete) return {state};

  let updated = resolveChampionsGroups(state);
  updated = simulateGroupsUntilPlayerMatch(updated);

  const nextMatch = getNextPlayerChampionsGroupMatch(updated);

  if (!nextMatch) {
    updated = finishRemainingGroups(updated);
    return {state: finishGroupsIfNeeded(updated)};
  }

  const opponentId = nextMatch.teamAId === playerTeamId ? nextMatch.teamBId! : nextMatch.teamAId!;
  const result = simulateMatch(player,opponentId);

  const playerIsA = nextMatch.teamAId === playerTeamId;
  const score = createSeriesScore(3);

  const playerScore = result.won ? score.winner : score.loser;
  const opponentScore = result.won ? score.loser : score.winner;

  updated = setChampionsGroupMatchResult(
    updated,
    nextMatch.group,
    nextMatch.id,
    playerIsA ? playerScore : opponentScore,
    playerIsA ? opponentScore : playerScore,
  );

  updated = resolveChampionsGroups(updated);
  updated = simulateGroupsUntilPlayerMatch(updated);

  const playerGroup = updated.groups[updated.playerGroup];

  if (playerGroup.complete) updated = finishRemainingGroups(updated);

  updated = finishGroupsIfNeeded(updated);

  return {state: updated,result};
}

export function getChampionsGroupPlacement(state: VCTChampionsGroupsState,teamId: string) {
  const group = GROUPS.map((id) => state.groups[id]).find((entry) => entry.teamIds.includes(teamId));
  if (!group) return 16;

  if (group.qualifiedTeamIds[0] === teamId) return 1;
  if (group.qualifiedTeamIds[1] === teamId) return 2;

  const elimination = group.matches.find((match) => match.round === "Elimination");
  if (elimination?.loserId === teamId) return 4;

  return 3;
}

export function getChampionsQualifiedTeamIds(state: VCTChampionsGroupsState) {
  return GROUPS.flatMap((groupId) => state.groups[groupId].qualifiedTeamIds);
}

export function createChampionsBracket(groups: VCTChampionsGroupsState): VCTChampionsBracketState {
  const A = groups.groups.A.qualifiedTeamIds;
  const B = groups.groups.B.qualifiedTeamIds;
  const C = groups.groups.C.qualifiedTeamIds;
  const D = groups.groups.D.qualifiedTeamIds;

  const matches: ChampionsBracketMatch[] = [
    createBracketMatch("uqf-1","Upper Quarterfinals",A[0],B[1]),
    createBracketMatch("uqf-2","Upper Quarterfinals",C[0],D[1]),
    createBracketMatch("uqf-3","Upper Quarterfinals",B[0],A[1]),
    createBracketMatch("uqf-4","Upper Quarterfinals",D[0],C[1]),

    createBracketMatch("usf-1","Upper Semifinals"),
    createBracketMatch("usf-2","Upper Semifinals"),

    createBracketMatch("uf","Upper Final"),

    createBracketMatch("lr1-1","Lower Round 1"),
    createBracketMatch("lr1-2","Lower Round 1"),

    createBracketMatch("lr2-1","Lower Round 2"),
    createBracketMatch("lr2-2","Lower Round 2"),

    createBracketMatch("lr3","Lower Round 3"),

    createBracketMatch("lf","Lower Final",undefined,undefined,5),
    createBracketMatch("gf","Grand Final",undefined,undefined,5),
  ];

  return {
    teamIds: [...A,...B,...C,...D],
    matches,
    complete: false,
  };
}

export function getNextPlayerChampionsBracketMatch(bracket: VCTChampionsBracketState,playerTeamId: string) {
  return bracket.matches.find((match) => !match.played && match.teamAId && match.teamBId && (match.teamAId === playerTeamId || match.teamBId === playerTeamId));
}

export function playChampionsBracketMatch(player: CareerPlayer,bracket: VCTChampionsBracketState): {state: VCTChampionsBracketState; result?: MatchResult} {
  const playerTeamId = player.currentTeamId;
  if (!playerTeamId || bracket.complete) return {state: bracket};

  let updated = resolveBracketDependencies(bracket);
  updated = simulateBracketUntilPlayerMatch(updated,playerTeamId);

  const nextMatch = getNextPlayerChampionsBracketMatch(updated,playerTeamId);

  if (!nextMatch) return {state: finishBracketIfPossible(updated)};

  const opponentId = nextMatch.teamAId === playerTeamId ? nextMatch.teamBId! : nextMatch.teamAId!;
  const result = simulateMatch(player,opponentId);

  const playerIsA = nextMatch.teamAId === playerTeamId;
  const score = createSeriesScore(nextMatch.bestOf);

  const playerScore = result.won ? score.winner : score.loser;
  const opponentScore = result.won ? score.loser : score.winner;

  updated = setBracketMatchResult(
    updated,
    nextMatch.id,
    playerIsA ? playerScore : opponentScore,
    playerIsA ? opponentScore : playerScore,
  );

  updated = resolveBracketDependencies(updated);
  updated = simulateBracketUntilPlayerMatch(updated,playerTeamId);
  updated = finishBracketIfPossible(updated);

  return {state: updated,result};
}

export function getChampionsPlacement(bracket: VCTChampionsBracketState,teamId: string) {
  if (bracket.championId === teamId) return 1;

  const grandFinal = bracket.matches.find((match) => match.id === "gf");
  if (grandFinal?.loserId === teamId) return 2;

  const lowerFinal = bracket.matches.find((match) => match.id === "lf");
  if (lowerFinal?.loserId === teamId) return 3;

  const lowerRound3 = bracket.matches.find((match) => match.id === "lr3");
  if (lowerRound3?.loserId === teamId) return 4;

  if (bracket.matches.some((match) => match.round === "Lower Round 2" && match.loserId === teamId)) return 5;
  if (bracket.matches.some((match) => match.round === "Lower Round 1" && match.loserId === teamId)) return 7;

  return 8;
}

function simulateCircuitChampionsQualifiers(circuit: CompetitiveCircuit): ChampionsQualifiedTeam[] {
  const candidates = TEAMS.filter((team) => team.tier === 1 && team.circuit === circuit);

  if (candidates.length < 4) throw new Error(`Not enough Tier 1 teams in ${circuit} to create Champions qualifiers.`);

  const ranking = candidates
    .map((team) => ({team,score: getRegionalPerformanceScore(team.strength,team.prestige)}))
    .sort((a,b) => b.score - a.score)
    .slice(0,4);

  return ranking.map((entry,index) => ({
    teamId: entry.team.id,
    circuit,
    seed: (index + 1) as 1 | 2 | 3 | 4,
  }));
}

function getRegionalPerformanceScore(strength: number,prestige: number) {
  const base = strength * .78 + prestige * .22;
  const form = randomFloat(-12,12);
  const upset = Math.random() < .15 ? randomFloat(3,9) : 0;

  return base + form + upset;
}

function createGroupAssignments(qualifiedTeams: ChampionsQualifiedTeam[]) {
  const assignments: Record<ChampionsGroupId,ChampionsQualifiedTeam[]> = {A: [],B: [],C: [],D: []};

  for (const seed of [1,2,3,4] as const) {
    let pot = shuffle(qualifiedTeams.filter((team) => team.seed === seed));

    if (seed === 1) {
      GROUPS.forEach((groupId,index) => assignments[groupId].push(pot[index]));
      continue;
    }

    pot = findValidPotOrder(pot,assignments);

    GROUPS.forEach((groupId,index) => assignments[groupId].push(pot[index]));
  }

  return {
    A: assignments.A.map((team) => team.teamId),
    B: assignments.B.map((team) => team.teamId),
    C: assignments.C.map((team) => team.teamId),
    D: assignments.D.map((team) => team.teamId),
  };
}

function findValidPotOrder(pot: ChampionsQualifiedTeam[],assignments: Record<ChampionsGroupId,ChampionsQualifiedTeam[]>) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = shuffle(pot);

    const valid = GROUPS.every((groupId,index) => !assignments[groupId].some((team) => team.circuit === candidate[index]?.circuit));

    if (valid) return candidate;
  }

  return pot;
}

function createGroup(id: ChampionsGroupId,teamIds: string[]): ChampionsGroup {
  return {
    id,
    teamIds,
    matches: [
      createGroupMatch(`${id}-opening-1`,id,"Opening",teamIds[0],teamIds[1]),
      createGroupMatch(`${id}-opening-2`,id,"Opening",teamIds[2],teamIds[3]),
      createGroupMatch(`${id}-winners`,id,"Winners"),
      createGroupMatch(`${id}-elimination`,id,"Elimination"),
      createGroupMatch(`${id}-decider`,id,"Decider"),
    ],
    qualifiedTeamIds: [],
    eliminatedTeamIds: [],
    complete: false,
  };
}

function createGroupMatch(id: string,group: ChampionsGroupId,round: ChampionsGroupMatch["round"],teamAId?: string,teamBId?: string): ChampionsGroupMatch {
  return {
    id,
    group,
    round,
    teamAId,
    teamBId,
    played: false,
    bestOf: 3,
  };
}

function resolveChampionsGroups(state: VCTChampionsGroupsState): VCTChampionsGroupsState {
  const groups = {...state.groups};

  GROUPS.forEach((groupId) => {
    groups[groupId] = resolveGroup(groups[groupId]);
  });

  return {...state,groups};
}

function resolveGroup(group: ChampionsGroup): ChampionsGroup {
  const matches = group.matches.map((match) => ({...match}));

  const opening1 = matches.find((match) => match.id === `${group.id}-opening-1`)!;
  const opening2 = matches.find((match) => match.id === `${group.id}-opening-2`)!;
  const winners = matches.find((match) => match.id === `${group.id}-winners`)!;
  const elimination = matches.find((match) => match.id === `${group.id}-elimination`)!;
  const decider = matches.find((match) => match.id === `${group.id}-decider`)!;

  if (!winners.played) {
    winners.teamAId = winners.teamAId ?? opening1.winnerId;
    winners.teamBId = winners.teamBId ?? opening2.winnerId;
  }

  if (!elimination.played) {
    elimination.teamAId = elimination.teamAId ?? opening1.loserId;
    elimination.teamBId = elimination.teamBId ?? opening2.loserId;
  }

  if (!decider.played) {
    decider.teamAId = decider.teamAId ?? winners.loserId;
    decider.teamBId = decider.teamBId ?? elimination.winnerId;
  }

  const qualifiedTeamIds: string[] = [];
  const eliminatedTeamIds: string[] = [];

  if (winners.played && winners.winnerId) qualifiedTeamIds.push(winners.winnerId);
  if (decider.played && decider.winnerId) qualifiedTeamIds.push(decider.winnerId);

  if (elimination.played && elimination.loserId) eliminatedTeamIds.push(elimination.loserId);
  if (decider.played && decider.loserId) eliminatedTeamIds.push(decider.loserId);

  const complete = qualifiedTeamIds.length === 2 && eliminatedTeamIds.length === 2;

  return {...group,matches,qualifiedTeamIds,eliminatedTeamIds,complete};
}

function simulateGroupsUntilPlayerMatch(state: VCTChampionsGroupsState) {
  let updated = resolveChampionsGroups(state);

  for (let safety = 0; safety < 100; safety++) {
    if (getNextPlayerChampionsGroupMatch(updated)) break;

    const cpuMatch = findNextPlayableCPUGroupMatch(updated);

    if (!cpuMatch) break;

    updated = simulateCPUGroupMatch(updated,cpuMatch.group,cpuMatch.id);
    updated = resolveChampionsGroups(updated);
  }

  return updated;
}

function findNextPlayableCPUGroupMatch(state: VCTChampionsGroupsState) {
  const playerTeamId = state.playerTeamId;

  for (const groupId of GROUPS) {
    const match = state.groups[groupId].matches.find((entry) =>
      !entry.played &&
      entry.teamAId &&
      entry.teamBId &&
      entry.teamAId !== playerTeamId &&
      entry.teamBId !== playerTeamId
    );

    if (match) return match;
  }

  return undefined;
}

function finishRemainingGroups(state: VCTChampionsGroupsState) {
  let updated = resolveChampionsGroups(state);

  for (let safety = 0; safety < 100; safety++) {
    const cpuMatch = findNextPlayableCPUGroupMatch(updated);

    if (!cpuMatch) break;

    updated = simulateCPUGroupMatch(updated,cpuMatch.group,cpuMatch.id);
    updated = resolveChampionsGroups(updated);
  }

  return updated;
}

function simulateCPUGroupMatch(state: VCTChampionsGroupsState,groupId: ChampionsGroupId,matchId: string) {
  const group = state.groups[groupId];
  const match = group.matches.find((entry) => entry.id === matchId);

  if (!match?.teamAId || !match.teamBId) return state;

  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  const aWon = Math.random() < getTeamWinChance(teamA?.strength ?? 75,teamB?.strength ?? 75);
  const score = createSeriesScore(3);

  return setChampionsGroupMatchResult(
    state,
    groupId,
    matchId,
    aWon ? score.winner : score.loser,
    aWon ? score.loser : score.winner,
  );
}

function setChampionsGroupMatchResult(state: VCTChampionsGroupsState,groupId: ChampionsGroupId,matchId: string,scoreA: number,scoreB: number): VCTChampionsGroupsState {
  const group = state.groups[groupId];

  const matches = group.matches.map((match) => {
    if (match.id !== matchId || !match.teamAId || !match.teamBId) return match;

    const aWon = scoreA > scoreB;

    return {
      ...match,
      played: true,
      scoreA,
      scoreB,
      winnerId: aWon ? match.teamAId : match.teamBId,
      loserId: aWon ? match.teamBId : match.teamAId,
    };
  });

  return {
    ...state,
    groups: {
      ...state.groups,
      [groupId]: {...group,matches},
    },
  };
}

function finishGroupsIfNeeded(state: VCTChampionsGroupsState): VCTChampionsGroupsState {
  const complete = GROUPS.every((groupId) => state.groups[groupId].complete);

  return {...state,complete};
}

function createBracketMatch(id: string,round: ChampionsBracketRound,teamAId?: string,teamBId?: string,bestOf: 3 | 5 = 3): ChampionsBracketMatch {
  return {
    id,
    round,
    teamAId,
    teamBId,
    played: false,
    bestOf,
  };
}

function resolveBracketDependencies(bracket: VCTChampionsBracketState): VCTChampionsBracketState {
  const matches = bracket.matches.map((match) => ({...match}));
  const get = (id: string) => matches.find((match) => match.id === id)!;

  const assign = (id: string,teamAId?: string,teamBId?: string) => {
    const match = get(id);

    if (!match.played) {
      match.teamAId = match.teamAId ?? teamAId;
      match.teamBId = match.teamBId ?? teamBId;
    }
  };

  assign("usf-1",get("uqf-1").winnerId,get("uqf-2").winnerId);
  assign("usf-2",get("uqf-3").winnerId,get("uqf-4").winnerId);

  assign("lr1-1",get("uqf-1").loserId,get("uqf-2").loserId);
  assign("lr1-2",get("uqf-3").loserId,get("uqf-4").loserId);

  assign("uf",get("usf-1").winnerId,get("usf-2").winnerId);

  assign("lr2-1",get("lr1-1").winnerId,get("usf-2").loserId);
  assign("lr2-2",get("lr1-2").winnerId,get("usf-1").loserId);

  assign("lr3",get("lr2-1").winnerId,get("lr2-2").winnerId);

  assign("lf",get("lr3").winnerId,get("uf").loserId);
  assign("gf",get("uf").winnerId,get("lf").winnerId);

  return {...bracket,matches};
}

function simulateBracketUntilPlayerMatch(bracket: VCTChampionsBracketState,playerTeamId: string) {
  let updated = resolveBracketDependencies(bracket);

  for (let safety = 0; safety < 50; safety++) {
    if (getNextPlayerChampionsBracketMatch(updated,playerTeamId)) break;

    const cpuMatch = updated.matches.find((match) =>
      !match.played &&
      match.teamAId &&
      match.teamBId &&
      match.teamAId !== playerTeamId &&
      match.teamBId !== playerTeamId
    );

    if (!cpuMatch) break;

    updated = simulateCPUBracketMatch(updated,cpuMatch);
    updated = resolveBracketDependencies(updated);
  }

  return updated;
}

function simulateCPUBracketMatch(bracket: VCTChampionsBracketState,match: ChampionsBracketMatch) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  const aWon = Math.random() < getTeamWinChance(teamA?.strength ?? 75,teamB?.strength ?? 75);
  const score = createSeriesScore(match.bestOf);

  return setBracketMatchResult(
    bracket,
    match.id,
    aWon ? score.winner : score.loser,
    aWon ? score.loser : score.winner,
  );
}

function setBracketMatchResult(bracket: VCTChampionsBracketState,matchId: string,scoreA: number,scoreB: number): VCTChampionsBracketState {
  const matches = bracket.matches.map((match) => {
    if (match.id !== matchId || !match.teamAId || !match.teamBId) return match;

    const aWon = scoreA > scoreB;

    return {
      ...match,
      played: true,
      scoreA,
      scoreB,
      winnerId: aWon ? match.teamAId : match.teamBId,
      loserId: aWon ? match.teamBId : match.teamAId,
    };
  });

  return {...bracket,matches};
}

function finishBracketIfPossible(bracket: VCTChampionsBracketState): VCTChampionsBracketState {
  const grandFinal = bracket.matches.find((match) => match.id === "gf");

  if (!grandFinal?.played) return bracket;

  return {
    ...bracket,
    complete: true,
    championId: grandFinal.winnerId,
  };
}

function getTeamWinChance(strengthA: number,strengthB: number) {
  return Math.max(.20,Math.min(.80,.5 + (strengthA - strengthB) * .012));
}

function createSeriesScore(bestOf: 3 | 5) {
  const target = bestOf === 5 ? 3 : 2;

  return {
    winner: target,
    loser: random(0,target - 1),
  };
}