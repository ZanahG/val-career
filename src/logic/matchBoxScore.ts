import type {CareerPlayer} from "../types/career";
import type {MatchResult} from "../types/season";
import type {MatchBoxScore,MatchMapStats,MatchPlayerStats} from "../types/matchStats";
import type {VCTMatchPlayer} from "../data/vctPlayers";
import {getTeamById} from "../data/teams";
import {getEffectiveVCTRoster} from "../data/vctPlayers";

const MAP_POOL = ["Haven","Bind","Abyss","Lotus","Sunset","Icebox","Corrode","Ascent","Split"];

const DUELIST_AGENTS = ["Jett","Raze","Yoru","Phoenix","Neon","Iso","Reyna"];
const INITIATOR_AGENTS = ["Sova","Skye","Fade","Breach","Gekko","Kayo","Tejo"];
const CONTROLLER_AGENTS = ["Omen","Brimstone","Astra","Viper","Harbor","Clove"];
const SENTINEL_AGENTS = ["Killjoy","Cypher","Sage","Chamber","Deadlock","Vyse"];
const FLEX_AGENTS = [...DUELIST_AGENTS,...INITIATOR_AGENTS,...CONTROLLER_AGENTS,...SENTINEL_AGENTS];

const random = (min:number,max:number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);

export function createMatchBoxScore(player:CareerPlayer,result:MatchResult,bestOf:3|5=3):MatchBoxScore|null {
  const playerTeam = getTeamById(player.currentTeamId);
  const opponent = getTeamById(result.opponentId);
  if (!playerTeam || !opponent) return null;

  const mapWinners = createSeriesPattern(result.won,bestOf);
  const mapNames = shuffle(MAP_POOL).slice(0,mapWinners.length);

  const playerKills = distributeTotal(result.kills,mapWinners.length);
  const playerDeaths = distributeTotal(result.deaths,mapWinners.length);
  const playerAssists = distributeTotal(result.assists,mapWinners.length);

  const useRealVCTRosters = playerTeam.tier === 1 && opponent.tier === 1;

  const playerVCTRoster = useRealVCTRosters ? getEffectiveVCTRoster(playerTeam.name,player) : [];
  const opponentVCTRoster = useRealVCTRosters ? getEffectiveVCTRoster(opponent.name) : [];

  const realAllies = playerVCTRoster.filter((rosterPlayer) => !rosterPlayer.isCareerPlayer);
  const realEnemies = opponentVCTRoster;

  const maps:MatchMapStats[] = mapWinners.map((playerWon,index) => {
    const score = createMapScore(playerWon);

    const allyTaken = new Set<string>();
    const enemyTaken = new Set<string>();

    const playerAgent = pickPlayerAgent(player,index,allyTaken);
    const playerRow = createCareerPlayerMapStats(player,result,index,playerKills[index],playerDeaths[index],playerAssists[index],playerAgent);

    const allies = useRealVCTRosters && realAllies.length >= 4
      ? realAllies.slice(0,4).map((rosterPlayer) => {
          const agent = pickAgentForRole(normalizeVCTRole(rosterPlayer.role),allyTaken);
          return createVCTMapPlayer(rosterPlayer,playerTeam.id,playerTeam.strength,playerWon,agent);
        })
      : Array.from({length:4},(_,playerIndex) => {
          const agent = pickAgentForRole(getCpuRole(playerIndex),allyTaken);
          return createCPUMapPlayer(`${playerTeam.shortName} Player ${playerIndex + 1}`,`${playerTeam.id}-cpu-${playerIndex + 1}`,playerTeam.id,playerTeam.strength,playerWon,agent);
        });

    const enemies = useRealVCTRosters && realEnemies.length >= 5
      ? realEnemies.slice(0,5).map((rosterPlayer) => {
          const agent = pickAgentForRole(normalizeVCTRole(rosterPlayer.role),enemyTaken);
          return createVCTMapPlayer(rosterPlayer,opponent.id,opponent.strength,!playerWon,agent);
        })
      : Array.from({length:5},(_,playerIndex) => {
          const agent = pickAgentForRole(getCpuRole(playerIndex),enemyTaken);
          return createCPUMapPlayer(`${opponent.shortName} Player ${playerIndex + 1}`,`${opponent.id}-cpu-${playerIndex + 1}`,opponent.id,opponent.strength,!playerWon,agent);
        });

    return {mapNumber:index + 1,mapName:mapNames[index],scoreA:score.for,scoreB:score.against,players:[playerRow,...allies,...enemies]};
  });

  const playerMapWins = mapWinners.filter(Boolean).length;
  const opponentMapWins = mapWinners.length - playerMapWins;

  return {teamAId:playerTeam.id,teamBId:opponent.id,scoreA:playerMapWins,scoreB:opponentMapWins,bestOf,maps,players:aggregatePlayers(maps)};
}

function createSeriesPattern(playerWon:boolean,bestOf:3|5) {
  if (bestOf === 3) {
    if (Math.random() < .45) return playerWon ? [true,true] : [false,false];
    return playerWon ? (Math.random() < .5 ? [true,false,true] : [false,true,true]) : (Math.random() < .5 ? [false,true,false] : [true,false,false]);
  }

  const mapsPlayed = random(3,5);
  if (mapsPlayed === 3) return playerWon ? [true,true,true] : [false,false,false];
  if (mapsPlayed === 4) return playerWon ? shuffle([true,true,false]).concat(true) : shuffle([false,false,true]).concat(false);
  return playerWon ? shuffle([true,true,false,false]).concat(true) : shuffle([false,false,true,true]).concat(false);
}

function createMapScore(playerWon:boolean) {
  const overtime = Math.random() < .12;
  const winningScore = overtime ? random(14,16) : 13;
  const losingScore = overtime ? winningScore - 2 : random(5,11);
  return playerWon ? {for:winningScore,against:losingScore} : {for:losingScore,against:winningScore};
}

function createCareerPlayerMapStats(player:CareerPlayer,result:MatchResult,index:number,kills:number,deaths:number,assists:number,agent:string):MatchPlayerStats {
  const performanceVariation = random(-12,12) / 100;
  const rating = clamp(Number((result.playerRating + performanceVariation).toFixed(2)),.45,1.85);
  const acs = clamp(Math.round(result.acs + random(-35,35)),80,380);

  return {
    id:"career-player",
    name:player.nickname,
    teamId:player.currentTeamId ?? "",
    rating,
    acs,
    kills,
    deaths,
    assists,
    kast:clamp(random(64,88) + (rating >= 1.2 ? 3 : 0),50,95),
    adr:clamp(Math.round(acs * .63 + random(-10,15)),70,220),
    headshot:random(18,45),
    firstKills:random(0,Math.max(2,Math.round(kills * .3))),
    firstDeaths:random(0,Math.max(2,Math.round(deaths * .25))),
    agent,
  };
}

function createVCTMapPlayer(player:VCTMatchPlayer,teamId:string,teamStrength:number,won:boolean,agent:string):MatchPlayerStats {
  const individualSkill = getVCTPlayerSkill(player);
  const teamBonus = Math.round((teamStrength - 75) / 8);
  const skillBonus = Math.round((individualSkill - 80) / 4);
  const aimBonus = Math.round((player.stats.aim - 80) / 5);
  const consistencyBonus = Math.round((player.stats.consistency - 80) / 8);
  const winBonus = won ? random(2,5) : random(-4,1);

  const kills = clamp(random(10,19) + winBonus + teamBonus + skillBonus + aimBonus,5,32);
  const deaths = clamp(random(12,20) - Math.round(winBonus / 2) - consistencyBonus,5,30);
  const assists = clamp(random(3,9) + Math.round((player.stats.communication - 80) / 7),1,15);

  const kd = kills / Math.max(1,deaths);
  const gameSenseBonus = (player.stats.gameSense - 80) / 100;
  const clutchBonus = (player.stats.clutch - 80) / 180;
  const rating = clamp(Number((.69 + kd * .3 + assists * .011 + gameSenseBonus + clutchBonus + (won ? .05 : 0)).toFixed(2)),.45,1.80);

  const acs = clamp(Math.round(120 + kills * 4.2 + aimBonus * 3 + random(-15,22)),90,360);

  return {
    id:`${teamId}-${normalizePlayerId(player.ign)}`,
    name:player.ign,
    teamId,
    rating,
    acs,
    kills,
    deaths,
    assists,
    kast:clamp(random(60,80) + Math.round((player.stats.consistency - 80) / 3) + (won ? 3 : 0),50,95),
    adr:clamp(Math.round(acs * .62 + random(-10,12)),70,220),
    headshot:clamp(random(18,34) + Math.round((player.stats.aim - 80) / 2),10,60),
    firstKills:clamp(random(0,4) + (normalizeVCTRole(player.role) === "Duelist" ? random(1,3) : 0),0,8),
    firstDeaths:random(0,6),
    agent,
  };
}

function createCPUMapPlayer(name:string,id:string,teamId:string,strength:number,won:boolean,agent:string):MatchPlayerStats {
  const winBonus = won ? random(2,6) : random(-5,1);
  const strengthBonus = Math.round((strength - 75) / 6);

  const kills = clamp(random(10,22) + winBonus + strengthBonus,5,32);
  const deaths = clamp(random(11,21) - Math.round(winBonus / 2),5,30);
  const assists = random(3,11);
  const kd = kills / Math.max(1,deaths);
  const rating = clamp(Number((.72 + kd * .3 + assists * .012 + (won ? .06 : 0)).toFixed(2)),.45,1.75);
  const acs = clamp(Math.round(125 + kills * 4.1 + random(-18,24)),90,350);

  return {id,name,teamId,rating,acs,kills,deaths,assists,kast:random(58,88),adr:random(85,185),headshot:random(14,48),firstKills:random(0,7),firstDeaths:random(0,7),agent};
}

function aggregatePlayers(maps:MatchMapStats[]):MatchPlayerStats[] {
  const groups = new Map<string,MatchPlayerStats[]>();

  maps.forEach((map) => {
    map.players.forEach((player) => {
      const existing = groups.get(player.id) ?? [];
      existing.push(player);
      groups.set(player.id,existing);
    });
  });

  return [...groups.entries()].map(([id,rows]) => {
    const first = rows[0];

    return {
      id,
      name:first.name,
      teamId:first.teamId,
      rating:Number(average(rows.map((row) => row.rating)).toFixed(2)),
      acs:Math.round(average(rows.map((row) => row.acs))),
      kills:sum(rows.map((row) => row.kills)),
      deaths:sum(rows.map((row) => row.deaths)),
      assists:sum(rows.map((row) => row.assists)),
      kast:Math.round(average(rows.map((row) => row.kast))),
      adr:Math.round(average(rows.map((row) => row.adr))),
      headshot:Math.round(average(rows.map((row) => row.headshot))),
      firstKills:sum(rows.map((row) => row.firstKills)),
      firstDeaths:sum(rows.map((row) => row.firstDeaths)),
      agent:first.agent,
      agents:rows.map((row) => row.agent).filter(Boolean) as string[],
    };
  });
}

function pickPlayerAgent(player:CareerPlayer,mapIndex:number,taken:Set<string>) {
  const preferred = mapIndex === 0 ? player.mainAgent : undefined;
  return pickAgentForRole(player.role,taken,preferred);
}

function pickAgentForRole(role:string,taken:Set<string>,preferred?:string) {
  if (preferred && !taken.has(preferred)) {
    taken.add(preferred);
    return preferred;
  }

  const pool = getAgentPoolByRole(role);
  const available = pool.filter((agent) => !taken.has(agent));
  const fallback = FLEX_AGENTS.filter((agent) => !taken.has(agent));
  const agent = shuffle(available.length ? available : fallback)[0] ?? "Jett";

  taken.add(agent);
  return agent;
}

function getAgentPoolByRole(role:string) {
  if (role === "Duelist") return DUELIST_AGENTS;
  if (role === "Initiator") return INITIATOR_AGENTS;
  if (role === "Controller") return CONTROLLER_AGENTS;
  if (role === "Sentinel") return SENTINEL_AGENTS;
  return FLEX_AGENTS;
}

function normalizeVCTRole(role:string) {
  if (role === "Duelista" || role === "Duelist") return "Duelist";
  if (role === "Iniciador" || role === "Initiator") return "Initiator";
  if (role === "Controlador" || role === "Controller") return "Controller";
  if (role === "Centinela" || role === "Sentinel") return "Sentinel";
  return "Flex";
}

function getVCTPlayerSkill(player:VCTMatchPlayer) {
  const {aim,clutch,gameSense,communication,consistency,mental} = player.stats;
  return aim * .3 + consistency * .2 + gameSense * .18 + clutch * .12 + mental * .1 + communication * .1;
}

function normalizePlayerId(ign:string) {
  return ign.toLowerCase().replace(/[^a-z0-9]+/g,"-");
}

function getCpuRole(index:number) {
  if (index === 0) return "Duelist";
  if (index === 1) return "Initiator";
  if (index === 2) return "Controller";
  if (index === 3) return "Sentinel";
  return "Flex";
}

function distributeTotal(total:number,parts:number) {
  if (parts <= 1) return [total];

  const weights = Array.from({length:parts},() => random(75,125));
  const weightTotal = sum(weights);
  const values = weights.map((weight) => Math.floor(total * weight / weightTotal));
  let remaining = total - sum(values);

  for (let i = 0; remaining > 0; i = (i + 1) % parts) {
    values[i]++;
    remaining--;
  }

  return values;
}

function sum(values:number[]) {
  return values.reduce((total,value) => total + value,0);
}

function average(values:number[]) {
  return values.length ? sum(values) / values.length : 0;
}