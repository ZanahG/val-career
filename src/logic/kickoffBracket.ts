import type {CompetitiveCircuit, TeamDefinition} from "../types/career";
import type {VCTBracketMatch, VCTBracketState, VCTBracketTeamSlot} from "../types/vct";
import {getStoredCompetitiveStrength} from "./coachTeamStrength";
import {TEAMS} from "../data/teams";

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - .5);

const direct = (teamId: string): VCTBracketTeamSlot => ({teamId});
const winner = (sourceMatchId: string): VCTBracketTeamSlot => ({sourceMatchId, sourceResult: "Winner"});
const loser = (sourceMatchId: string): VCTBracketTeamSlot => ({sourceMatchId, sourceResult: "Loser"});

export function createKickoffBracket(circuit: CompetitiveCircuit, playerTeamId: string, season: number, competitiveStrengthByTeam?:Record<string,number>,): VCTBracketState | undefined {
  const teams = TEAMS.filter((team) => team.tier === 1 && team.circuit === circuit);
  if (teams.length < 12) return undefined;

  const entrants = teams.slice(0,12);
  const draw = getKickoffDraw(entrants,circuit,season,competitiveStrengthByTeam);

  const matches: VCTBracketMatch[] = [
    createMatch("u1-1","Upper",1,"Upper Round 1",1,1,direct(draw.firstRound[0][0]),direct(draw.firstRound[0][1])),
    createMatch("u1-2","Upper",1,"Upper Round 1",2,2,direct(draw.firstRound[1][0]),direct(draw.firstRound[1][1])),
    createMatch("u1-3","Upper",1,"Upper Round 1",3,3,direct(draw.firstRound[2][0]),direct(draw.firstRound[2][1])),
    createMatch("u1-4","Upper",1,"Upper Round 1",4,4,direct(draw.firstRound[3][0]),direct(draw.firstRound[3][1])),

    createMatch("u2-1","Upper",2,"Upper Round 2",1,5,direct(draw.byes[0]),winner("u1-1")),
    createMatch("u2-2","Upper",2,"Upper Round 2",2,6,direct(draw.byes[1]),winner("u1-2")),
    createMatch("u2-3","Upper",2,"Upper Round 2",3,7,direct(draw.byes[2]),winner("u1-3")),
    createMatch("u2-4","Upper",2,"Upper Round 2",4,8,direct(draw.byes[3]),winner("u1-4")),

    createMatch("m1-1","Middle",1,"Middle Round 1",1,9,loser("u1-1"),loser("u2-4")),
    createMatch("m1-2","Middle",1,"Middle Round 1",2,10,loser("u1-2"),loser("u2-3")),
    createMatch("m1-3","Middle",1,"Middle Round 1",3,11,loser("u1-3"),loser("u2-2")),
    createMatch("m1-4","Middle",1,"Middle Round 1",4,12,loser("u1-4"),loser("u2-1")),

    createMatch("m2-1","Middle",2,"Middle Round 2",1,13,winner("m1-1"),winner("m1-2")),
    createMatch("m2-2","Middle",2,"Middle Round 2",2,14,winner("m1-3"),winner("m1-4")),

    createMatch("u3-1","Upper",3,"Upper Round 3",1,15,winner("u2-1"),winner("u2-2")),
    createMatch("u3-2","Upper",3,"Upper Round 3",2,16,winner("u2-3"),winner("u2-4")),

    createMatch("l1-1","Lower",1,"Lower Round 1",1,17,loser("m1-1"),loser("m1-2")),
    createMatch("l1-2","Lower",1,"Lower Round 1",2,18,loser("m1-3"),loser("m1-4")),

    createMatch("l2-1","Lower",2,"Lower Round 2",1,19,loser("m2-2"),winner("l1-1")),
    createMatch("l2-2","Lower",2,"Lower Round 2",2,20,loser("m2-1"),winner("l1-2")),

    createMatch("m3-1","Middle",3,"Middle Round 3",1,21,loser("u3-1"),winner("m2-1")),
    createMatch("m3-2","Middle",3,"Middle Round 3",2,22,loser("u3-2"),winner("m2-2")),

    createMatch("l3-1","Lower",3,"Lower Round 3",1,23,loser("m3-1"),winner("l2-1")),
    createMatch("l3-2","Lower",3,"Lower Round 3",2,24,loser("m3-2"),winner("l2-2")),

    createMatch("m4","Middle",4,"Middle Round 4",1,25,winner("m3-1"),winner("m3-2")),
    createMatch("l4","Lower",4,"Lower Round 4",1,26,winner("l3-1"),winner("l3-2")),

    createMatch("uf","Upper",4,"Upper Final",1,27,winner("u3-1"),winner("u3-2"),5),
    createMatch("l5","Lower",5,"Lower Round 5",1,28,loser("m4"),winner("l4")),

    createMatch("mf","Middle",5,"Middle Final",1,29,loser("uf"),winner("m4"),5),
    createMatch("lf","Lower",6,"Lower Final",1,30,loser("mf"),winner("l5"),5),
  ];

  return advanceKickoffCPU(updateKickoffBracket({matches, playerTeamId, qualifiedTeamIds: [], playerQualified: false, playerEliminated: false, complete: false, competitiveStrengthByTeam,}));
}

export function getNextPlayerKickoffMatch(bracket: VCTBracketState) {
  return bracket.matches.filter((match) => match.status === "Ready" && (match.teamAId === bracket.playerTeamId || match.teamBId === bracket.playerTeamId)).sort((a,b) => a.sequence - b.sequence)[0];
}

export function playPlayerKickoffMatch(bracket: VCTBracketState, playerWon: boolean) {
  const current = getNextPlayerKickoffMatch(bracket);
  if (!current) return bracket;

  const playerIsA = current.teamAId === bracket.playerTeamId;
  const winnerId = playerWon ? bracket.playerTeamId : playerIsA ? current.teamBId : current.teamAId;

  if (!winnerId) return bracket;

  let updated = completeMatch(bracket, current.id, winnerId);
  updated = updateKickoffBracket(updated);

  return advanceKickoffCPU(updated);
}

export function playPlayerKickoffMatchWithScore(bracket:VCTBracketState,playerWon:boolean,playerMapsWon:number,playerMapsLost:number) {
  const current=getNextPlayerKickoffMatch(bracket);
  if(!current)return bracket;

  const playerIsA=current.teamAId===bracket.playerTeamId;
  const winnerId=playerWon?bracket.playerTeamId:playerIsA?current.teamBId:current.teamAId;

  if(!winnerId)return bracket;

  const scoreA=playerIsA?playerMapsWon:playerMapsLost;
  const scoreB=playerIsA?playerMapsLost:playerMapsWon;

  let updated=completeMatchWithScore(bracket,current.id,winnerId,scoreA,scoreB);
  updated=updateKickoffBracket(updated);

  return advanceKickoffCPU(updated);
}

export function getKickoffPlacement(bracket: VCTBracketState, teamId: string) {
  if (bracket.matches.find((match) => match.id === "uf")?.winnerId === teamId) return 1;
  if (bracket.matches.find((match) => match.id === "mf")?.winnerId === teamId) return 2;
  if (bracket.matches.find((match) => match.id === "lf")?.winnerId === teamId) return 3;
  if (bracket.matches.find((match) => match.id === "lf")?.loserId === teamId) return 4;
  if (bracket.matches.find((match) => match.id === "l5")?.loserId === teamId) return 5;
  if (bracket.matches.find((match) => match.id === "l4")?.loserId === teamId) return 6;

  if (["l3-1","l3-2"].some((id) => bracket.matches.find((match) => match.id === id)?.loserId === teamId)) return 7;
  if (["l2-1","l2-2"].some((id) => bracket.matches.find((match) => match.id === id)?.loserId === teamId)) return 9;
  if (["l1-1","l1-2"].some((id) => bracket.matches.find((match) => match.id === id)?.loserId === teamId)) return 11;

  return 12;
}

function advanceKickoffCPU(bracket: VCTBracketState) {
  let current = updateKickoffBracket(bracket);

  for (let i = 0; i < 100; i++) {
    const readyMatches = current.matches.filter((match) => match.status === "Ready").sort((a,b) => a.sequence - b.sequence);
    if (!readyMatches.length) break;

    const nextMatch = readyMatches[0];
    const containsPlayer = nextMatch.teamAId === current.playerTeamId || nextMatch.teamBId === current.playerTeamId;

    if (containsPlayer && !current.playerQualified && !current.playerEliminated) break;

    const winnerId=simulateCPUWinner(current,nextMatch);
    if (!winnerId) break;

    current = completeMatch(current, nextMatch.id, winnerId);
    current = updateKickoffBracket(current);
  }

  return updateKickoffBracket(current);
}

function updateKickoffBracket(bracket: VCTBracketState): VCTBracketState {
  let matches = bracket.matches.map((match) => {
    if (match.status === "Complete") return {...match, playerMatch: match.teamAId === bracket.playerTeamId || match.teamBId === bracket.playerTeamId};

    const teamAId = resolveSlot(match.teamA, bracket.matches);
    const teamBId = resolveSlot(match.teamB, bracket.matches);
    const status = teamAId && teamBId ? "Ready" as const : "Locked" as const;

    return {...match, teamAId, teamBId, status, playerMatch: teamAId === bracket.playerTeamId || teamBId === bracket.playerTeamId};
  });

  const upperWinner = matches.find((match) => match.id === "uf")?.winnerId;
  const middleWinner = matches.find((match) => match.id === "mf")?.winnerId;
  const lowerWinner = matches.find((match) => match.id === "lf")?.winnerId;
  const qualifiedTeamIds = [upperWinner,middleWinner,lowerWinner].filter((id): id is string => Boolean(id));
  const playerQualified = qualifiedTeamIds.includes(bracket.playerTeamId);
  const playerLosses = matches.filter((match) => match.status === "Complete" && match.loserId === bracket.playerTeamId).length;
  const playerEliminated = !playerQualified && playerLosses >= 3;
  const complete = matches.find((match) => match.id === "lf")?.status === "Complete";

  matches = matches.map((match) => ({...match, playerMatch: match.teamAId === bracket.playerTeamId || match.teamBId === bracket.playerTeamId}));

  return {...bracket, matches, qualifiedTeamIds, playerQualified, playerEliminated, complete};
}

function completeMatch(bracket: VCTBracketState, matchId: string, winnerId: string): VCTBracketState {
  const matches = bracket.matches.map((match) => {
    if (match.id !== matchId || !match.teamAId || !match.teamBId) return match;

    const loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
    const winnerIsA = winnerId === match.teamAId;
    const winningScore = match.bestOf === 5 ? 3 : 2;
    const losingScore = Math.floor(Math.random() * winningScore);

    return {
      ...match,
      scoreA: winnerIsA ? winningScore : losingScore,
      scoreB: winnerIsA ? losingScore : winningScore,
      winnerId,
      loserId,
      status: "Complete" as const,
    };
  });

  return {...bracket, matches};
}

function completeMatchWithScore(bracket:VCTBracketState,matchId:string,winnerId:string,scoreA:number,scoreB:number):VCTBracketState {
  const matches=bracket.matches.map(match=>{
    if(match.id!==matchId||!match.teamAId||!match.teamBId)return match;

    const loserId=winnerId===match.teamAId?match.teamBId:match.teamAId;

    return {
      ...match,
      scoreA,
      scoreB,
      winnerId,
      loserId,
      status:"Complete" as const,
    };
  });

  return {...bracket,matches};
}

function resolveSlot(slot: VCTBracketTeamSlot, matches: VCTBracketMatch[]) {
  if (slot.teamId) return slot.teamId;
  if (!slot.sourceMatchId || !slot.sourceResult) return undefined;

  const source = matches.find((match) => match.id === slot.sourceMatchId);
  if (!source || source.status !== "Complete") return undefined;

  return slot.sourceResult === "Winner" ? source.winnerId : source.loserId;
}

function simulateCPUWinner(bracket:VCTBracketState,match:VCTBracketMatch) {
  if(!match.teamAId||!match.teamBId)return undefined;

  const strengthA=getStoredCompetitiveStrength(bracket.competitiveStrengthByTeam,match.teamAId);
  const strengthB=getStoredCompetitiveStrength(bracket.competitiveStrengthByTeam,match.teamBId);

  const difference=strengthA-strengthB;
  const chanceA=Math.max(.18,Math.min(.82,.5+difference/55));

  return Math.random()<chanceA?match.teamAId:match.teamBId;
}

function createMatch(id: string, section: VCTBracketMatch["section"], round: number, roundName: string, order: number, sequence: number, teamA: VCTBracketTeamSlot, teamB: VCTBracketTeamSlot, bestOf: 3 | 5 = 3): VCTBracketMatch {
  return {id, section, round, roundName, order, sequence, bestOf, teamA, teamB, status: "Locked", playerMatch: false};
}

function getKickoffDraw(teams: TeamDefinition[], circuit: CompetitiveCircuit, season: number, competitiveStrengthByTeam?:Record<string,number>,) {
  if (circuit === "Americas" && season === 2026) {
    const required = ["loud","cloud9","envy","evil-geniuses","kru-esports","furia","100-thieves","leviatan","nrg","mibr","sentinels","g2-esports"];
    const hasRealDraw = required.every((id) => teams.some((team) => team.id === id));

    if (hasRealDraw) {
      return {
        firstRound: [["loud","cloud9"],["envy","evil-geniuses"],["kru-esports","furia"],["100-thieves","leviatan"]] as [string,string][],
        byes: ["nrg","mibr","sentinels","g2-esports"],
      };
    }
  }

  const seeded=[...teams].sort((a,b)=>{
    const strengthA=getStoredCompetitiveStrength(competitiveStrengthByTeam,a.id);
    const strengthB=getStoredCompetitiveStrength(competitiveStrengthByTeam,b.id);

    return (strengthB+b.prestige*.05)-(strengthA+a.prestige*.05);
  });
  const byes = seeded.slice(0,4).map((team) => team.id);
  const firstRoundTeams = shuffle(seeded.slice(4,12)).map((team) => team.id);

  return {
    byes,
    firstRound: [[firstRoundTeams[0],firstRoundTeams[1]],[firstRoundTeams[2],firstRoundTeams[3]],[firstRoundTeams[4],firstRoundTeams[5]],[firstRoundTeams[6],firstRoundTeams[7]]] as [string,string][],
  };
}