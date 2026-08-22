import type {CareerPlayer,CompetitiveCircuit} from "../types/career";
import type {MatchResult} from "../types/season";
import type {VCTStageBracketMatch,VCTStageBracketState,VCTStageGroup,VCTStageGroupId,VCTStageGroupMatch,VCTStageGroupsState,VCTStageStanding} from "../types/stage";
import {TEAMS,getTeamById} from "../data/teams";
import {simulateMatch} from "./season";

const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);
const random = (min:number,max:number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function createStageGroups(circuit:CompetitiveCircuit,playerTeamId:string):VCTStageGroupsState {
  const teams = shuffle(TEAMS.filter((team) => team.tier === 1 && team.circuit === circuit));
  const playerTeam = teams.find((team) => team.id === playerTeamId);
  const others = teams.filter((team) => team.id !== playerTeamId);

  const ordered = playerTeam ? [playerTeam,...others] : others;
  const alphaIds:string[] = [];
  const omegaIds:string[] = [];

  ordered.forEach((team,index) => (index % 2 === 0 ? alphaIds : omegaIds).push(team.id));

  const playerGroup:VCTStageGroupId = alphaIds.includes(playerTeamId) ? "Alpha" : "Omega";
  const alpha = createGroup("Alpha",alphaIds);
  const omega = createGroup("Omega",omegaIds);

  return {playerTeamId,playerGroup,groups:{Alpha:alpha,Omega:omega},complete:false};
}

export function getPlayerStageSchedule(state:VCTStageGroupsState) {
  const group = state.groups[state.playerGroup];

  return group.matches
    .filter((match) => match.teamAId === state.playerTeamId || match.teamBId === state.playerTeamId)
    .sort((a,b) => a.round - b.round)
    .map((match) => match.teamAId === state.playerTeamId ? match.teamBId : match.teamAId);
}

export function getNextPlayerStageGroupMatch(state:VCTStageGroupsState) {
  return state.groups[state.playerGroup].matches
    .filter((match) => !match.played && (match.teamAId === state.playerTeamId || match.teamBId === state.playerTeamId))
    .sort((a,b) => a.round - b.round)[0];
}

export function playStageGroupMatch(player:CareerPlayer,state:VCTStageGroupsState):{state:VCTStageGroupsState;result?:MatchResult} {
  const nextMatch = getNextPlayerStageGroupMatch(state);
  if (!nextMatch) return {state:{...state,complete:true}};

  const opponentId = nextMatch.teamAId === state.playerTeamId ? nextMatch.teamBId : nextMatch.teamAId;
  const result = simulateMatch(player,opponentId);
  const playerIsA = nextMatch.teamAId === state.playerTeamId;

  const series = createSeriesScore();
  const rounds = createRoundTotals();

  const playerMaps = result.won ? series.winner : series.loser;
  const opponentMaps = result.won ? series.loser : series.winner;

  const playerRounds = result.won ? rounds.winner : rounds.loser;
  const opponentRounds = result.won ? rounds.loser : rounds.winner;

  let updated = updateGroupMatch(state,nextMatch.id,{
    played:true,
    mapsA:playerIsA ? playerMaps : opponentMaps,
    mapsB:playerIsA ? opponentMaps : playerMaps,
    roundsA:playerIsA ? playerRounds : opponentRounds,
    roundsB:playerIsA ? opponentRounds : playerRounds,
    winnerId:result.won ? state.playerTeamId : opponentId,
  });

  const round = nextMatch.round;

  (["Alpha","Omega"] as VCTStageGroupId[]).forEach((groupId) => {
    const pending = updated.groups[groupId].matches.filter((match) => match.round === round && !match.played && match.teamAId !== state.playerTeamId && match.teamBId !== state.playerTeamId);
    pending.forEach((match) => { updated = simulateCPUGroupMatch(updated,match); });
  });

  updated = recalculateGroups(updated);

  const complete = !getNextPlayerStageGroupMatch(updated);

  return {state:{...updated,complete},result};
}

export function getPlayerStageGroupPlacement(state:VCTStageGroupsState) {
  const standings = state.groups[state.playerGroup].standings;
  const index = standings.findIndex((row) => row.teamId === state.playerTeamId);
  return index >= 0 ? index + 1 : standings.length;
}

export function createStageBracket(groups:VCTStageGroupsState):VCTStageBracketState {
  const alpha = groups.groups.Alpha.standings.slice(0,4).map((row) => row.teamId);
  const omega = groups.groups.Omega.standings.slice(0,4).map((row) => row.teamId);

  const matches:VCTStageBracketMatch[] = [
    createBracketMatch("ur1-1","Upper Round 1",alpha[0],omega[3]),
    createBracketMatch("ur1-2","Upper Round 1",omega[1],alpha[2]),
    createBracketMatch("ur1-3","Upper Round 1",omega[0],alpha[3]),
    createBracketMatch("ur1-4","Upper Round 1",alpha[1],omega[2]),

    createBracketMatch("usf-1","Upper Semifinals"),
    createBracketMatch("usf-2","Upper Semifinals"),
    createBracketMatch("uf","Upper Final"),

    createBracketMatch("lr1-1","Lower Round 1"),
    createBracketMatch("lr1-2","Lower Round 1"),
    createBracketMatch("lr2-1","Lower Round 2"),
    createBracketMatch("lr2-2","Lower Round 2"),
    createBracketMatch("lr3","Lower Round 3"),
    createBracketMatch("lf","Lower Final"),

    createBracketMatch("gf","Grand Final",undefined,undefined,5),
  ];

  return {playerTeamId:groups.playerTeamId,matches,complete:false};
}

export function getNextPlayerStageBracketMatch(state:VCTStageBracketState) {
  return state.matches.find((match) => !match.played && match.teamAId && match.teamBId && (match.teamAId === state.playerTeamId || match.teamBId === state.playerTeamId));
}

export function playStageBracketMatch(player:CareerPlayer,state:VCTStageBracketState):{state:VCTStageBracketState;result?:MatchResult} {
  let prepared = resolveBracketDependencies(state);
  let nextMatch = getNextPlayerStageBracketMatch(prepared);

  if (!nextMatch) {
    prepared = resolveCPUBracket(prepared);
    nextMatch = getNextPlayerStageBracketMatch(prepared);
  }

  if (!nextMatch) return {state:prepared};

  const opponentId = nextMatch.teamAId === prepared.playerTeamId ? nextMatch.teamBId! : nextMatch.teamAId!;
  const result = simulateMatch(player,opponentId);
  const playerIsA = nextMatch.teamAId === prepared.playerTeamId;

  const series = createSeriesScore(nextMatch.bestOf);
  const playerScore = result.won ? series.winner : series.loser;
  const opponentScore = result.won ? series.loser : series.winner;

  prepared = setBracketResult(
    prepared,
    nextMatch.id,
    playerIsA ? playerScore : opponentScore,
    playerIsA ? opponentScore : playerScore
  );

  prepared = resolveBracketDependencies(prepared);

  const losses = getTeamBracketLosses(prepared,prepared.playerTeamId);
  const grandFinal = prepared.matches.find((match) => match.id === "gf");
  const playerAlive = losses < 2 && !grandFinal?.played;

  prepared = playerAlive ? resolveCPUUntilPlayerTurn(prepared) : resolveCPUBracketToEnd(prepared);

  const resolvedGrandFinal = prepared.matches.find((match) => match.id === "gf");
  const complete = Boolean(resolvedGrandFinal?.played) || losses >= 2;

  return {state:{...prepared,complete,championId:resolvedGrandFinal?.winnerId},result};
}

export function getPlayerStageBracketPlacement(state:VCTStageBracketState) {
  if (state.championId === state.playerTeamId) return 1;

  const final = state.matches.find((match) => match.id === "gf");
  if (final?.loserId === state.playerTeamId) return 2;

  const lowerFinal = state.matches.find((match) => match.id === "lf");
  if (lowerFinal?.loserId === state.playerTeamId) return 3;

  const lower3 = state.matches.find((match) => match.id === "lr3");
  if (lower3?.loserId === state.playerTeamId) return 4;

  if (state.matches.some((match) => match.round === "Lower Round 2" && match.loserId === state.playerTeamId)) return 5;
  if (state.matches.some((match) => match.round === "Lower Round 1" && match.loserId === state.playerTeamId)) return 7;

  return 8;
}

function createGroup(id:VCTStageGroupId,teamIds:string[]):VCTStageGroup {
  const matches = createRoundRobin(teamIds,id);
  const standings = teamIds.map((teamId) => emptyStanding(teamId));

  return {id,teamIds,matches,standings};
}

function createRoundRobin(teamIds:string[],groupId:VCTStageGroupId) {
  if (teamIds.length < 2) return [];

  const rotation = [...teamIds];
  if (rotation.length % 2 !== 0) rotation.push("__BYE__");

  const matches:VCTStageGroupMatch[] = [];

  for (let round = 1; round < rotation.length; round++) {
    for (let i = 0; i < rotation.length / 2; i++) {
      const teamAId = rotation[i];
      const teamBId = rotation[rotation.length - 1 - i];

      if (teamAId !== "__BYE__" && teamBId !== "__BYE__") {
        matches.push({
          id:`${groupId.toLowerCase()}-${round}-${i}`,
          round,
          teamAId,
          teamBId,
          played:false,
          mapsA:0,
          mapsB:0,
          roundsA:0,
          roundsB:0,
        });
      }
    }

    rotation.splice(1,0,rotation.pop()!);
  }

  return matches;
}

function simulateCPUGroupMatch(state:VCTStageGroupsState,match:VCTStageGroupMatch) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  const strengthA = teamA?.strength ?? 70;
  const strengthB = teamB?.strength ?? 70;
  const chanceA = .5 + (strengthA - strengthB) * .012;
  const aWon = Math.random() < Math.max(.18,Math.min(.82,chanceA));

  const series = createSeriesScore();
  const rounds = createRoundTotals();

  return updateGroupMatch(state,match.id,{
    played:true,
    mapsA:aWon ? series.winner : series.loser,
    mapsB:aWon ? series.loser : series.winner,
    roundsA:aWon ? rounds.winner : rounds.loser,
    roundsB:aWon ? rounds.loser : rounds.winner,
    winnerId:aWon ? match.teamAId : match.teamBId,
  });
}

function updateGroupMatch(state:VCTStageGroupsState,matchId:string,changes:Partial<VCTStageGroupMatch>):VCTStageGroupsState {
  const updateGroup = (group:VCTStageGroup):VCTStageGroup => ({
    ...group,
    matches:group.matches.map((match) => match.id === matchId ? {...match,...changes} : match),
  });

  return {...state,groups:{Alpha:updateGroup(state.groups.Alpha),Omega:updateGroup(state.groups.Omega)}};
}

function recalculateGroups(state:VCTStageGroupsState):VCTStageGroupsState {
  return {...state,groups:{Alpha:recalculateGroup(state.groups.Alpha),Omega:recalculateGroup(state.groups.Omega)}};
}

function recalculateGroup(group:VCTStageGroup):VCTStageGroup {
  const standings = group.teamIds.map((teamId) => emptyStanding(teamId));

  group.matches.filter((match) => match.played).forEach((match) => {
    const a = standings.find((row) => row.teamId === match.teamAId)!;
    const b = standings.find((row) => row.teamId === match.teamBId)!;

    a.mapsWon += match.mapsA;
    a.mapsLost += match.mapsB;
    a.roundsWon += match.roundsA;
    a.roundsLost += match.roundsB;

    b.mapsWon += match.mapsB;
    b.mapsLost += match.mapsA;
    b.roundsWon += match.roundsB;
    b.roundsLost += match.roundsA;

    if (match.winnerId === match.teamAId) {
      a.wins++;
      b.losses++;
    } else {
      b.wins++;
      a.losses++;
    }
  });

  standings.sort((a,b) =>
    b.wins - a.wins ||
    (b.mapsWon - b.mapsLost) - (a.mapsWon - a.mapsLost) ||
    (b.roundsWon - b.roundsLost) - (a.roundsWon - a.roundsLost)
  );

  return {...group,standings};
}

function emptyStanding(teamId:string):VCTStageStanding {
  return {
    teamId,
    wins:0,
    losses:0,
    mapsWon:0,
    mapsLost:0,
    roundsWon:0,
    roundsLost:0,
  };
}

function createBracketMatch(id:string,round:VCTStageBracketMatch["round"],teamAId?:string,teamBId?:string,bestOf:3|5 = 3):VCTStageBracketMatch {
  return {id,round,teamAId,teamBId,played:false,bestOf};
}

function resolveBracketDependencies(state:VCTStageBracketState):VCTStageBracketState {
  const matches = state.matches.map((match) => ({...match}));

  const get = (id:string) => matches.find((match) => match.id === id)!;

  const assign = (id:string,a?:string,b?:string) => {
    const match = get(id);

    if (!match.played) {
      match.teamAId = match.teamAId ?? a;
      match.teamBId = match.teamBId ?? b;
    }
  };

  assign("usf-1",get("ur1-1").winnerId,get("ur1-2").winnerId);
  assign("usf-2",get("ur1-3").winnerId,get("ur1-4").winnerId);

  assign("lr1-1",get("ur1-1").loserId,get("ur1-2").loserId);
  assign("lr1-2",get("ur1-3").loserId,get("ur1-4").loserId);

  assign("uf",get("usf-1").winnerId,get("usf-2").winnerId);

  assign("lr2-1",get("lr1-1").winnerId,get("usf-1").loserId);
  assign("lr2-2",get("lr1-2").winnerId,get("usf-2").loserId);

  assign("lr3",get("lr2-1").winnerId,get("lr2-2").winnerId);
  assign("lf",get("lr3").winnerId,get("uf").loserId);

  assign("gf",get("uf").winnerId,get("lf").winnerId);

  return {...state,matches};
}

function resolveCPUUntilPlayerTurn(state:VCTStageBracketState) {
  let updated = resolveBracketDependencies(state);

  for (let i = 0; i < 50; i++) {
    if (getNextPlayerStageBracketMatch(updated)) break;

    const cpuMatch = updated.matches.find((match) =>
      !match.played &&
      match.teamAId &&
      match.teamBId &&
      match.teamAId !== updated.playerTeamId &&
      match.teamBId !== updated.playerTeamId
    );

    if (!cpuMatch) break;

    updated = simulateCPUBracketMatch(updated,cpuMatch);
    updated = resolveBracketDependencies(updated);
  }

  return updated;
}

function resolveCPUBracket(state:VCTStageBracketState) {
  return resolveCPUUntilPlayerTurn(state);
}

function resolveCPUBracketToEnd(state:VCTStageBracketState) {
  let updated = resolveBracketDependencies(state);

  for (let i = 0; i < 50; i++) {
    const match = updated.matches.find((item) => !item.played && item.teamAId && item.teamBId);

    if (!match) break;

    if (match.teamAId === updated.playerTeamId || match.teamBId === updated.playerTeamId) break;

    updated = simulateCPUBracketMatch(updated,match);
    updated = resolveBracketDependencies(updated);
  }

  return updated;
}

function simulateCPUBracketMatch(state:VCTStageBracketState,match:VCTStageBracketMatch) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  const strengthA = teamA?.strength ?? 70;
  const strengthB = teamB?.strength ?? 70;
  const chanceA = .5 + (strengthA - strengthB) * .012;
  const aWon = Math.random() < Math.max(.18,Math.min(.82,chanceA));

  const series = createSeriesScore(match.bestOf);

  return setBracketResult(
    state,
    match.id,
    aWon ? series.winner : series.loser,
    aWon ? series.loser : series.winner
  );
}

function setBracketResult(state:VCTStageBracketState,matchId:string,scoreA:number,scoreB:number):VCTStageBracketState {
  const matches = state.matches.map((match) => {
    if (match.id !== matchId || !match.teamAId || !match.teamBId) return match;

    const aWon = scoreA > scoreB;

    return {
      ...match,
      played:true,
      scoreA,
      scoreB,
      winnerId:aWon ? match.teamAId : match.teamBId,
      loserId:aWon ? match.teamBId : match.teamAId,
    };
  });

  return {...state,matches};
}

function getTeamBracketLosses(state:VCTStageBracketState,teamId:string) {
  return state.matches.filter((match) => match.played && match.loserId === teamId).length;
}

function createSeriesScore(bestOf:3|5 = 3) {
  const target = bestOf === 5 ? 3 : 2;
  const loser = random(0,target - 1);

  return {winner:target,loser};
}

function createRoundTotals() {
  const winner = random(26,38);
  const loser = random(12,winner - 2);

  return {winner,loser};
}