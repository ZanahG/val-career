import type {CareerPlayer,CompetitiveCircuit} from "../types/career";
import type {MatchResult} from "../types/season";
import type {MastersBracketMatch,MastersBracketRound,MastersQualifiedTeam,MastersSwissMatch,MastersSwissStanding,VCTMastersBracketState,VCTMastersState,VCTMastersSwissState} from "../types/masters";
import {TEAMS,getTeamById} from "../data/teams";
import {simulateMatch} from "./season";

const CIRCUITS: CompetitiveCircuit[] = ["Americas","EMEA","Pacific","China"];

const random = (min: number,max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number,max: number) => Math.random() * (max - min) + min;
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - .5);

export function createDefaultMastersQualifiedTeams(): MastersQualifiedTeam[] {
  return CIRCUITS.flatMap((circuit) => simulateCircuitQualifiers(circuit));
}

export function createMastersState(qualifiedTeams: MastersQualifiedTeam[]): VCTMastersState {
  const directPlayoffTeamIds = qualifiedTeams.filter((team) => team.seed === 1).map((team) => team.teamId);
  const swissTeamIds = qualifiedTeams.filter((team) => team.seed === 2 || team.seed === 3).map((team) => team.teamId);

  let swiss = createMastersSwissState(swissTeamIds);
  swiss = createNextSwissRound(swiss,qualifiedTeams);

  return {
    qualifiedTeams,
    directPlayoffTeamIds,
    swissTeamIds,
    swiss,
    complete: false,
  };
}

export function createMastersSwissState(teamIds: string[]): VCTMastersSwissState {
  return {
    teamIds,
    matches: [],
    standings: sortSwissStandings(teamIds.map((teamId) => emptySwissStanding(teamId))),
    complete: false,
  };
}

export function getNextPlayerMastersSwissMatch(masters: VCTMastersState,playerTeamId: string) {
  return masters.swiss.matches.find((match) => !match.played && (match.teamAId === playerTeamId || match.teamBId === playerTeamId));
}

export function playNextMastersSwissMatch(player: CareerPlayer,masters: VCTMastersState): {masters: VCTMastersState; result?: MatchResult} {
  const playerTeamId = player.currentTeamId;
  if (!playerTeamId || masters.swiss.complete) return {masters};

  let swiss = masters.swiss;
  const playerStanding = swiss.standings.find((row) => row.teamId === playerTeamId);

  if (!playerStanding || playerStanding.qualified || playerStanding.eliminated) {
    return {masters: {...masters,swiss: finishSwissIfNeeded(swiss)}};
  }

  let playerMatch = swiss.matches.find((match) => !match.played && (match.teamAId === playerTeamId || match.teamBId === playerTeamId));

  if (!playerMatch) {
    swiss = createNextSwissRound(swiss,masters.qualifiedTeams);
    playerMatch = swiss.matches.find((match) => !match.played && (match.teamAId === playerTeamId || match.teamBId === playerTeamId));
  }

  if (!playerMatch) return {masters: {...masters,swiss: finishSwissIfNeeded(swiss)}};

  const opponentId = playerMatch.teamAId === playerTeamId ? playerMatch.teamBId : playerMatch.teamAId;
  const result = simulateMatch(player,opponentId);

  const playerIsA = playerMatch.teamAId === playerTeamId;
  const series = createSeriesScore();
  const rounds = createRoundScore();

  const playerMaps = result.won ? series.winner : series.loser;
  const opponentMaps = result.won ? series.loser : series.winner;
  const playerRounds = result.won ? rounds.winner : rounds.loser;
  const opponentRounds = result.won ? rounds.loser : rounds.winner;

  swiss = setSwissMatchResult(
    swiss,
    playerMatch.id,
    playerIsA ? playerMaps : opponentMaps,
    playerIsA ? opponentMaps : playerMaps,
    playerIsA ? playerRounds : opponentRounds,
    playerIsA ? opponentRounds : playerRounds,
  );

  swiss = simulateRemainingSwissRound(swiss,playerMatch.round);
  swiss = recalculateSwissStandings(swiss);
  swiss = finishSwissIfNeeded(swiss);

  if (!swiss.complete) swiss = createNextSwissRound(swiss,masters.qualifiedTeams);

  return {masters: {...masters,swiss},result};
}

export function simulateMastersSwissWithoutPlayer(masters: VCTMastersState): VCTMastersState {
  let swiss = masters.swiss;

  for (let safety = 0; safety < 10 && !swiss.complete; safety++) {
    swiss = createNextSwissRound(swiss,masters.qualifiedTeams);

    const unplayedRounds = swiss.matches.filter((match) => !match.played).map((match) => match.round);
    if (!unplayedRounds.length) break;

    const currentRound = Math.min(...unplayedRounds);

    swiss = simulateRemainingSwissRound(swiss,currentRound);
    swiss = recalculateSwissStandings(swiss);
    swiss = finishSwissIfNeeded(swiss);
  }

  return {...masters,swiss};
}

export function getMastersSwissQualifiedTeamIds(swiss: VCTMastersSwissState) {
  return swiss.standings.filter((row) => row.qualified).map((row) => row.teamId);
}

export function getMastersSwissEliminatedTeamIds(swiss: VCTMastersSwissState) {
  return swiss.standings.filter((row) => row.eliminated).map((row) => row.teamId);
}

export function createMastersBracket(masters: VCTMastersState): VCTMastersBracketState {
  const swissQualified = getMastersSwissQualifiedTeamIds(masters.swiss).slice(0,4);
  const direct = masters.directPlayoffTeamIds.slice(0,4);
  const seeded = [...direct,...swissQualified];

  const matches: MastersBracketMatch[] = [
    createMastersBracketMatch("uqf-1","Upper Quarterfinals",seeded[0],seeded[7]),
    createMastersBracketMatch("uqf-2","Upper Quarterfinals",seeded[3],seeded[4]),
    createMastersBracketMatch("uqf-3","Upper Quarterfinals",seeded[1],seeded[6]),
    createMastersBracketMatch("uqf-4","Upper Quarterfinals",seeded[2],seeded[5]),

    createMastersBracketMatch("usf-1","Upper Semifinals"),
    createMastersBracketMatch("usf-2","Upper Semifinals"),

    createMastersBracketMatch("uf","Upper Final"),

    createMastersBracketMatch("lr1-1","Lower Round 1"),
    createMastersBracketMatch("lr1-2","Lower Round 1"),

    createMastersBracketMatch("lr2-1","Lower Round 2"),
    createMastersBracketMatch("lr2-2","Lower Round 2"),

    createMastersBracketMatch("lr3","Lower Round 3"),

    createMastersBracketMatch("lf","Lower Final",undefined,undefined,5),
    createMastersBracketMatch("gf","Grand Final",undefined,undefined,5),
  ];

  return {
    teamIds: seeded,
    matches,
    complete: false,
  };
}

export function getNextPlayerMastersBracketMatch(bracket: VCTMastersBracketState,playerTeamId: string) {
  return bracket.matches.find((match) => !match.played && match.teamAId && match.teamBId && (match.teamAId === playerTeamId || match.teamBId === playerTeamId));
}

export function playNextMastersBracketMatch(player: CareerPlayer,masters: VCTMastersState): {masters: VCTMastersState; result?: MatchResult} {
  const playerTeamId = player.currentTeamId;
  if (!playerTeamId || !masters.bracket) return {masters};

  let bracket = resolveMastersBracketDependencies(masters.bracket);
  bracket = simulateMastersCPUUntilPlayerMatch(bracket,playerTeamId);

  const nextMatch = getNextPlayerMastersBracketMatch(bracket,playerTeamId);

  if (!nextMatch) {
    const finishedBracket = finishMastersBracketIfPossible(bracket);
    return {masters: {...masters,bracket: finishedBracket,complete: finishedBracket.complete}};
  }

  const opponentId = nextMatch.teamAId === playerTeamId ? nextMatch.teamBId! : nextMatch.teamAId!;
  const result = simulateMatch(player,opponentId);

  const playerIsA = nextMatch.teamAId === playerTeamId;
  const score = createBracketSeriesScore(nextMatch.bestOf);

  const playerScore = result.won ? score.winner : score.loser;
  const opponentScore = result.won ? score.loser : score.winner;

  bracket = setMastersBracketResult(
    bracket,
    nextMatch.id,
    playerIsA ? playerScore : opponentScore,
    playerIsA ? opponentScore : playerScore,
  );

  bracket = resolveMastersBracketDependencies(bracket);
  bracket = simulateMastersCPUUntilPlayerMatch(bracket,playerTeamId);
  bracket = finishMastersBracketIfPossible(bracket);

  return {
    masters: {...masters,bracket,complete: bracket.complete},
    result,
  };
}

export function getMastersBracketPlacement(bracket: VCTMastersBracketState,teamId: string) {
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

function simulateCircuitQualifiers(circuit: CompetitiveCircuit): MastersQualifiedTeam[] {
  const candidates = TEAMS.filter((team) => team.tier === 1 && team.circuit === circuit);

  if (candidates.length < 3) throw new Error(`Not enough Tier 1 teams in ${circuit} to create Masters qualifiers.`);

  const ranking = candidates
    .map((team) => ({
      team,
      score: getRegionalPerformanceScore(team.strength,team.prestige),
    }))
    .sort((a,b) => b.score - a.score)
    .slice(0,3);

  return ranking.map((entry,index) => ({
    teamId: entry.team.id,
    circuit,
    seed: (index + 1) as 1 | 2 | 3,
  }));
}

function getRegionalPerformanceScore(strength: number,prestige: number) {
  const base = strength * .78 + prestige * .22;
  const form = randomFloat(-11,11);
  const upset = Math.random() < .12 ? randomFloat(3,8) : 0;

  return base + form + upset;
}

function createNextSwissRound(swiss: VCTMastersSwissState,qualifiedTeams: MastersQualifiedTeam[]): VCTMastersSwissState {
  if (swiss.complete) return swiss;

  const unplayedMatchExists = swiss.matches.some((match) => !match.played);
  if (unplayedMatchExists) return swiss;

  const activeTeams = swiss.standings.filter((row) => !row.qualified && !row.eliminated);
  if (activeTeams.length < 2) return finishSwissIfNeeded(swiss);

  const round = swiss.matches.length ? Math.max(...swiss.matches.map((match) => match.round)) + 1 : 1;

  const pairs = round === 1
    ? createFirstRoundPairs(activeTeams,qualifiedTeams,swiss.matches)
    : createRecordPairs(activeTeams,swiss.matches);

  const newMatches = pairs.map(([teamAId,teamBId],index): MastersSwissMatch => ({
    id: `masters-swiss-r${round}-${index + 1}`,
    round,
    teamAId,
    teamBId,
    played: false,
    mapsA: 0,
    mapsB: 0,
    roundsA: 0,
    roundsB: 0,
  }));

  return {...swiss,matches: [...swiss.matches,...newMatches]};
}

function createFirstRoundPairs(activeTeams: MastersSwissStanding[],qualifiedTeams: MastersQualifiedTeam[],previousMatches: MastersSwissMatch[]) {
  const seeds2 = shuffle(activeTeams.filter((row) => getSeed(row.teamId,qualifiedTeams) === 2));
  const seeds3 = shuffle(activeTeams.filter((row) => getSeed(row.teamId,qualifiedTeams) === 3));

  const pairs: [string,string][] = [];
  const used = new Set<string>();

  for (const seed2 of seeds2) {
    const circuit = getCircuit(seed2.teamId,qualifiedTeams);

    const opponent = seeds3.find((seed3) => {
      if (used.has(seed3.teamId)) return false;
      if (getCircuit(seed3.teamId,qualifiedTeams) === circuit) return false;
      return !havePlayed(seed2.teamId,seed3.teamId,previousMatches);
    }) ?? seeds3.find((seed3) => !used.has(seed3.teamId));

    if (!opponent) continue;

    pairs.push([seed2.teamId,opponent.teamId]);
    used.add(seed2.teamId);
    used.add(opponent.teamId);
  }

  return pairs;
}

function createRecordPairs(activeTeams: MastersSwissStanding[],previousMatches: MastersSwissMatch[]) {
  const recordGroups = new Map<string,MastersSwissStanding[]>();

  activeTeams.forEach((team) => {
    const key = `${team.wins}-${team.losses}`;
    recordGroups.set(key,[...(recordGroups.get(key) ?? []),team]);
  });

  const pairs: [string,string][] = [];
  const leftovers: MastersSwissStanding[] = [];

  [...recordGroups.values()].forEach((group) => {
    const pool = shuffle(group);

    while (pool.length >= 2) {
      const teamA = pool.shift()!;

      let opponentIndex = pool.findIndex((teamB) => !havePlayed(teamA.teamId,teamB.teamId,previousMatches));
      if (opponentIndex < 0) opponentIndex = 0;

      const [teamB] = pool.splice(opponentIndex,1);
      pairs.push([teamA.teamId,teamB.teamId]);
    }

    leftovers.push(...pool);
  });

  while (leftovers.length >= 2) {
    const teamA = leftovers.shift()!;

    let opponentIndex = leftovers.findIndex((teamB) => !havePlayed(teamA.teamId,teamB.teamId,previousMatches));
    if (opponentIndex < 0) opponentIndex = 0;

    const [teamB] = leftovers.splice(opponentIndex,1);
    pairs.push([teamA.teamId,teamB.teamId]);
  }

  return pairs;
}

function simulateRemainingSwissRound(swiss: VCTMastersSwissState,round: number) {
  let updated = swiss;

  swiss.matches.filter((match) => match.round === round && !match.played).forEach((match) => {
    const teamA = getTeamById(match.teamAId);
    const teamB = getTeamById(match.teamBId);

    const chanceA = getTeamWinChance(teamA?.strength ?? 75,teamB?.strength ?? 75);
    const aWon = Math.random() < chanceA;

    const series = createSeriesScore();
    const rounds = createRoundScore();

    updated = setSwissMatchResult(
      updated,
      match.id,
      aWon ? series.winner : series.loser,
      aWon ? series.loser : series.winner,
      aWon ? rounds.winner : rounds.loser,
      aWon ? rounds.loser : rounds.winner,
    );
  });

  return updated;
}

function setSwissMatchResult(swiss: VCTMastersSwissState,matchId: string,mapsA: number,mapsB: number,roundsA: number,roundsB: number): VCTMastersSwissState {
  const matches = swiss.matches.map((match) => {
    if (match.id !== matchId) return match;

    return {
      ...match,
      played: true,
      mapsA,
      mapsB,
      roundsA,
      roundsB,
      winnerId: mapsA > mapsB ? match.teamAId : match.teamBId,
    };
  });

  return {...swiss,matches};
}

function recalculateSwissStandings(swiss: VCTMastersSwissState): VCTMastersSwissState {
  const standings = swiss.teamIds.map((teamId) => emptySwissStanding(teamId));

  swiss.matches.filter((match) => match.played).forEach((match) => {
    const teamA = standings.find((row) => row.teamId === match.teamAId);
    const teamB = standings.find((row) => row.teamId === match.teamBId);

    if (!teamA || !teamB) return;

    teamA.mapsWon += match.mapsA;
    teamA.mapsLost += match.mapsB;
    teamA.roundsWon += match.roundsA;
    teamA.roundsLost += match.roundsB;

    teamB.mapsWon += match.mapsB;
    teamB.mapsLost += match.mapsA;
    teamB.roundsWon += match.roundsB;
    teamB.roundsLost += match.roundsA;

    if (match.winnerId === match.teamAId) {
      teamA.wins++;
      teamB.losses++;
    } else {
      teamB.wins++;
      teamA.losses++;
    }
  });

  standings.forEach((row) => {
    row.qualified = row.wins >= 2;
    row.eliminated = row.losses >= 2;
  });

  return {...swiss,standings: sortSwissStandings(standings)};
}

function finishSwissIfNeeded(swiss: VCTMastersSwissState): VCTMastersSwissState {
  const qualified = swiss.standings.filter((row) => row.qualified).length;
  const eliminated = swiss.standings.filter((row) => row.eliminated).length;

  const complete =
    qualified >= 4 ||
    eliminated >= 4 ||
    swiss.standings.every((row) => row.qualified || row.eliminated);

  return {...swiss,complete};
}

function sortSwissStandings(standings: MastersSwissStanding[]) {
  return [...standings].sort((a,b) => {
    if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;

    const recordDifference = b.wins - a.wins || a.losses - b.losses;
    if (recordDifference !== 0) return recordDifference;

    const mapDiffA = a.mapsWon - a.mapsLost;
    const mapDiffB = b.mapsWon - b.mapsLost;
    if (mapDiffA !== mapDiffB) return mapDiffB - mapDiffA;

    const roundDiffA = a.roundsWon - a.roundsLost;
    const roundDiffB = b.roundsWon - b.roundsLost;

    return roundDiffB - roundDiffA;
  });
}

function emptySwissStanding(teamId: string): MastersSwissStanding {
  return {
    teamId,
    wins: 0,
    losses: 0,
    mapsWon: 0,
    mapsLost: 0,
    roundsWon: 0,
    roundsLost: 0,
    qualified: false,
    eliminated: false,
  };
}

function createMastersBracketMatch(id: string,round: MastersBracketRound,teamAId?: string,teamBId?: string,bestOf: 3 | 5 = 3): MastersBracketMatch {
  return {
    id,
    round,
    teamAId,
    teamBId,
    played: false,
    bestOf,
  };
}

function resolveMastersBracketDependencies(bracket: VCTMastersBracketState): VCTMastersBracketState {
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

function simulateMastersCPUUntilPlayerMatch(bracket: VCTMastersBracketState,playerTeamId: string) {
  let updated = resolveMastersBracketDependencies(bracket);

  for (let safety = 0; safety < 50; safety++) {
    const playerMatch = getNextPlayerMastersBracketMatch(updated,playerTeamId);
    if (playerMatch) break;

    const cpuMatch = updated.matches.find((match) => !match.played && match.teamAId && match.teamBId && match.teamAId !== playerTeamId && match.teamBId !== playerTeamId);

    if (!cpuMatch) break;

    updated = simulateMastersCPUBracketMatch(updated,cpuMatch);
    updated = resolveMastersBracketDependencies(updated);
  }

  return updated;
}

function simulateMastersCPUBracketMatch(bracket: VCTMastersBracketState,match: MastersBracketMatch) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  const chanceA = getTeamWinChance(teamA?.strength ?? 75,teamB?.strength ?? 75);
  const aWon = Math.random() < chanceA;

  const score = createBracketSeriesScore(match.bestOf);

  return setMastersBracketResult(
    bracket,
    match.id,
    aWon ? score.winner : score.loser,
    aWon ? score.loser : score.winner,
  );
}

function setMastersBracketResult(bracket: VCTMastersBracketState,matchId: string,scoreA: number,scoreB: number): VCTMastersBracketState {
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

function finishMastersBracketIfPossible(bracket: VCTMastersBracketState): VCTMastersBracketState {
  const grandFinal = bracket.matches.find((match) => match.id === "gf");

  if (!grandFinal?.played) return bracket;

  return {
    ...bracket,
    complete: true,
    championId: grandFinal.winnerId,
  };
}

function havePlayed(teamAId: string,teamBId: string,matches: MastersSwissMatch[]) {
  return matches.some((match) =>
    (match.teamAId === teamAId && match.teamBId === teamBId) ||
    (match.teamAId === teamBId && match.teamBId === teamAId)
  );
}

function getSeed(teamId: string,qualifiedTeams: MastersQualifiedTeam[]) {
  return qualifiedTeams.find((team) => team.teamId === teamId)?.seed;
}

function getCircuit(teamId: string,qualifiedTeams: MastersQualifiedTeam[]) {
  return qualifiedTeams.find((team) => team.teamId === teamId)?.circuit;
}

function getTeamWinChance(strengthA: number,strengthB: number) {
  return Math.max(.20,Math.min(.80,.5 + (strengthA - strengthB) * .012));
}

function createSeriesScore() {
  return {
    winner: 2,
    loser: Math.random() < .55 ? 0 : 1,
  };
}

function createRoundScore() {
  const winner = random(26,38);
  const loser = random(12,winner - 2);

  return {winner,loser};
}

function createBracketSeriesScore(bestOf: 3 | 5) {
  const target = bestOf === 5 ? 3 : 2;

  return {
    winner: target,
    loser: random(0,target - 1),
  };
}