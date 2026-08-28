import type {CareerPlayer} from "../types/career";
import type {MatchResult} from "../types/season";
import type {MatchBoxScore,MatchMapStats,MatchPlayerStats} from "../types/matchStats";
import type {VCTMatchPlayer} from "../data/vctPlayers";
import {getTeamById} from "../data/teams";
import {getEffectiveVCTRoster} from "../data/vctPlayers";
import type {VCTRosterState} from "../types/vctRosters";

const MAP_POOL = ["Haven","Bind","Abyss","Lotus","Sunset","Icebox","Corrode","Ascent","Split"];

const DUELIST_AGENTS = ["Iso","Jett","Neon","Phoenix","Raze","Reyna","Waylay","Yoru"];
const CONTROLLER_AGENTS = ["Astra","Brimstone","Clove","Harbor","Omen","Viper"];
const INITIATOR_AGENTS = ["Breach","Fade","Gekko","Kayo","Skye","Sova","Tejo"];
const SENTINEL_AGENTS = ["Chamber","Cypher","Deadlock","Killjoy","Sage","Veto","Vyse"];
const FLEX_AGENTS = [...DUELIST_AGENTS,...CONTROLLER_AGENTS,...INITIATOR_AGENTS,...SENTINEL_AGENTS];

const random = (min:number,max:number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5);

export function createMatchBoxScore(player:CareerPlayer,result:MatchResult,bestOf:3|5=3,vctRosters?:VCTRosterState):MatchBoxScore|null {
  const playerTeam = getTeamById(player.currentTeamId);
  const opponent = getTeamById(result.opponentId);
  if (!playerTeam || !opponent) return null;

  const mapWinners = createSeriesPattern(result.won,bestOf);
  const mapNames = shuffle(MAP_POOL).slice(0,mapWinners.length);

  const playerVCTRoster=getEffectiveVCTRoster(playerTeam.name,player,vctRosters);
  const opponentVCTRoster=getEffectiveVCTRoster(opponent.name,undefined,vctRosters);

  const useRealRosters=playerVCTRoster.length>=5&&opponentVCTRoster.length>=5;

  const realAllies=useRealRosters?playerVCTRoster.filter(rosterPlayer=>!rosterPlayer.isCareerPlayer):[];
  const realEnemies=useRealRosters?opponentVCTRoster:[];

  const maps:MatchMapStats[] = mapWinners.map((playerWon,index) => {
    const score = createMapScore(playerWon);

    const allyTaken = new Set<string>();
    const enemyTaken = new Set<string>();

    const playerAgent = pickPlayerAgent(player,index,allyTaken);
    const playerRow = createCareerPlayerMapStats(player,result,score.for,score.against,playerWon,playerAgent);

    const allies=useRealRosters&&realAllies.length>=4
      ? realAllies.slice(0,4).map((rosterPlayer) => {
          const role = normalizeVCTRole(rosterPlayer.role);
          const agent = pickAgentForRole(role,allyTaken);
          return createVCTMapPlayer(rosterPlayer,playerTeam.id,playerTeam.strength,playerWon,score.for,score.against,agent);
        })
      : Array.from({length:4},(_,playerIndex) => {
          const role = getCpuRole(playerIndex);
          const agent = pickAgentForRole(role,allyTaken);
          return createCPUMapPlayer(`${playerTeam.shortName} Player ${playerIndex + 1}`,`${playerTeam.id}-cpu-${playerIndex + 1}`,playerTeam.id,playerTeam.strength,playerWon,score.for,score.against,role,agent);
        });

    const enemies=useRealRosters&&realEnemies.length>=5
      ? realEnemies.slice(0,5).map((rosterPlayer) => {
          const role = normalizeVCTRole(rosterPlayer.role);
          const agent = pickAgentForRole(role,enemyTaken);
          return createVCTMapPlayer(rosterPlayer,opponent.id,opponent.strength,!playerWon,score.against,score.for,agent);
        })
      : Array.from({length:5},(_,playerIndex) => {
          const role = getCpuRole(playerIndex);
          const agent = pickAgentForRole(role,enemyTaken);
          return createCPUMapPlayer(`${opponent.shortName} Player ${playerIndex + 1}`,`${opponent.id}-cpu-${playerIndex + 1}`,opponent.id,opponent.strength,!playerWon,score.against,score.for,role,agent);
        });

    return {
      mapNumber:index + 1,
      mapName:mapNames[index],
      scoreA:score.for,
      scoreB:score.against,
      players:[playerRow,...allies,...enemies],
    };
  });

  const playerMapWins = mapWinners.filter(Boolean).length;
  const opponentMapWins = mapWinners.length - playerMapWins;

  return {
    teamAId:playerTeam.id,
    teamBId:opponent.id,
    scoreA:playerMapWins,
    scoreB:opponentMapWins,
    bestOf,
    maps,
    players:aggregatePlayers(maps),
  };
}

function createSeriesPattern(playerWon:boolean,bestOf:3|5) {
  if (bestOf === 3) {
    if (Math.random() < .45) return playerWon ? [true,true] : [false,false];
    return playerWon
      ? Math.random() < .5 ? [true,false,true] : [false,true,true]
      : Math.random() < .5 ? [false,true,false] : [true,false,false];
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

function createCareerPlayerMapStats(
  player:CareerPlayer,
  result:MatchResult,
  scoreFor:number,
  scoreAgainst:number,
  won:boolean,
  agent:string,
):MatchPlayerStats {
  const rounds = scoreFor + scoreAgainst;
  const performanceVariation = random(-10,10) / 100;

  const rating = clamp(
    Number((result.playerRating+performanceVariation+(won?.08:-.05)).toFixed(2)),
    .55,
    1.85,
  );

  const aimFactor = (player.stats.aim - 75) / 100;
  const commFactor = (player.stats.communication - 75) / 100;

  const killsPerRound = clamp(.56 + (rating - 1) * .32 + aimFactor * .14, .35, 1.05);
  const deathsPerRound = clamp(.70 - (rating - 1) * .18 - (won ? .04 : -.02), .42, .90);
  const assistsPerRound = clamp(.20 + commFactor * .14, .10, .48);

  const kills = clamp(
    Math.round(rounds * killsPerRound + random(-3,3)),
    Math.max(5,Math.round(rounds * .28)),
    Math.round(rounds * 1.25),
  );

  const deaths = clamp(
    Math.round(rounds * deathsPerRound + random(-2,2)),
    Math.max(5,Math.round(rounds * .38)),
    Math.round(rounds * .95),
  );

  const assists = clamp(
    Math.round(rounds * assistsPerRound + random(-2,3)),
    1,
    Math.round(rounds * .65),
  );

  const acs = clamp(
    Math.round(125 + kills * 5.2 + assists * 1.4 - deaths * 1.1 + (rating - 1) * 55 + random(-12,12)),
    90,
    390,
  );

  return {
    id:"career-player",
    name:player.nickname,
    teamId:player.currentTeamId ?? "",
    rating,
    acs,
    kills,
    deaths,
    assists,
    kast:clamp(Math.round(64 + rating * 8 + (won ? 3 : 0) + random(-5,5)),50,96),
    adr:clamp(Math.round(acs * .62 + random(-8,12)),70,230),
    headshot:clamp(random(18,38) + Math.round((player.stats.aim - 80) / 3),10,60),
    firstKills:clamp(random(0,Math.max(2,Math.round(kills * .3))),0,Math.round(rounds * .3)),
    firstDeaths:clamp(random(0,Math.max(2,Math.round(deaths * .25))),0,Math.round(rounds * .3)),
    agent,
  };
}

function createVCTMapPlayer(
  player:VCTMatchPlayer,
  teamId:string,
  teamStrength:number,
  won:boolean,
  scoreFor:number,
  scoreAgainst:number,
  agent:string,
):MatchPlayerStats {
  const rounds = scoreFor + scoreAgainst;
  const role = normalizeVCTRole(player.role);

  const skill = getVCTPlayerSkill(player);
  const skillFactor = (skill - 80) / 100;
  const teamFactor = (teamStrength - 80) / 100;
  const aimFactor = (player.stats.aim - 80) / 100;
  const consistencyFactor = (player.stats.consistency - 80) / 100;
  const communicationFactor = (player.stats.communication - 80) / 100;
  const gameSenseFactor = (player.stats.gameSense - 80) / 100;
  const clutchFactor = (player.stats.clutch - 80) / 100;

  const performanceVariation=random(-10,10)/100;

  const rating=clamp(
    Number((
      .98+
      skillFactor*.82+
      teamFactor*.28+
      gameSenseFactor*.15+
      clutchFactor*.10+
      (won?.13:-.08)+
      performanceVariation
    ).toFixed(2)),
    .48,
    1.78,
  );

  const duelistKillBonus = role === "Duelist" ? .045 : 0;
  const assistRoleBonus = role === "Initiator" ? .065 : role === "Controller" ? .045 : role === "Sentinel" ? .02 : 0;

  const killsPerRound = clamp(
    .57 +
    (rating - 1) * .31 +
    aimFactor * .16 +
    duelistKillBonus,
    .32,
    1.05,
  );

  const deathsPerRound = clamp(
    .69 -
    (rating - 1) * .16 -
    consistencyFactor * .12 +
    (won ? -.035 : .025),
    .40,
    .93,
  );

  const assistsPerRound = clamp(
    .20 +
    communicationFactor * .18 +
    assistRoleBonus,
    .10,
    .55,
  );

  const kills = clamp(
    Math.round(rounds * killsPerRound + random(-3,3)),
    Math.max(4,Math.round(rounds * .25)),
    Math.round(rounds * 1.20),
  );

  const deaths = clamp(
    Math.round(rounds * deathsPerRound + random(-2,2)),
    Math.max(5,Math.round(rounds * .35)),
    Math.round(rounds * .95),
  );

  const assists = clamp(
    Math.round(rounds * assistsPerRound + random(-2,3)),
    1,
    Math.round(rounds * .70),
  );

  const acs = clamp(
    Math.round(
      120 +
      kills * 5 +
      assists * 1.25 -
      deaths * .9 +
      aimFactor * 35 +
      (rating - 1) * 45 +
      random(-15,15),
    ),
    90,
    385,
  );

  return {
    id:`${teamId}-${normalizePlayerId(player.ign)}`,
    name:player.ign,
    teamId,
    rating,
    acs,
    kills,
    deaths,
    assists,
    kast:clamp(
      Math.round(64 + rating * 8 + consistencyFactor * 16 + (won ? 3 : 0) + random(-5,5)),
      48,
      96,
    ),
    adr:clamp(Math.round(acs * .62 + random(-10,12)),70,230),
    headshot:clamp(random(18,34) + Math.round((player.stats.aim - 80) / 2),10,62),
    firstKills:clamp(
      Math.round(kills * (role === "Duelist" ? random(14,25) : random(7,17)) / 100),
      0,
      Math.round(rounds * .30),
    ),
    firstDeaths:clamp(
      Math.round(deaths * random(7,22) / 100),
      0,
      Math.round(rounds * .30),
    ),
    agent,
  };
}

function createCPUMapPlayer(
  name:string,
  id:string,
  teamId:string,
  strength:number,
  won:boolean,
  scoreFor:number,
  scoreAgainst:number,
  role:string,
  agent:string,
):MatchPlayerStats {
  const rounds = scoreFor + scoreAgainst;

  const effectiveSkill = clamp(strength + random(-9,9),58,97);
  const skillFactor = (effectiveSkill - 80) / 100;
  const performanceVariation=random(-11,11)/100;

  const rating=clamp(
    Number((
      .98+
      skillFactor*.78+
      (won?.12:-.08)+
      performanceVariation
    ).toFixed(2)),
    .48,
    1.72,
  );

  const duelistKillBonus = role === "Duelist" ? .04 : 0;
  const assistRoleBonus = role === "Initiator" ? .06 : role === "Controller" ? .04 : role === "Sentinel" ? .02 : 0;

  const killsPerRound = clamp(
    .56 +
    (rating - 1) * .30 +
    skillFactor * .13 +
    duelistKillBonus,
    .32,
    1.02,
  );

  const deathsPerRound = clamp(
    .70 -
    (rating - 1) * .15 -
    skillFactor * .08 +
    (won ? -.03 : .025),
    .42,
    .94,
  );

  const assistsPerRound = clamp(
    .20 +
    assistRoleBonus +
    skillFactor * .05,
    .10,
    .52,
  );

  const kills = clamp(
    Math.round(rounds * killsPerRound + random(-3,3)),
    Math.max(4,Math.round(rounds * .25)),
    Math.round(rounds * 1.15),
  );

  const deaths = clamp(
    Math.round(rounds * deathsPerRound + random(-2,2)),
    Math.max(5,Math.round(rounds * .35)),
    Math.round(rounds * .95),
  );

  const assists = clamp(
    Math.round(rounds * assistsPerRound + random(-2,3)),
    1,
    Math.round(rounds * .68),
  );

  const acs = clamp(
    Math.round(
      120 +
      kills * 4.9 +
      assists * 1.2 -
      deaths * .8 +
      (rating - 1) * 42 +
      random(-16,16),
    ),
    90,
    370,
  );

  return {
    id,
    name,
    teamId,
    rating,
    acs,
    kills,
    deaths,
    assists,
    kast:clamp(Math.round(64 + rating * 8 + (won ? 3 : 0) + random(-7,7)),48,94),
    adr:clamp(Math.round(acs * .62 + random(-12,12)),70,220),
    headshot:random(14,48),
    firstKills:clamp(
      Math.round(kills * (role === "Duelist" ? random(14,25) : random(6,17)) / 100),
      0,
      Math.round(rounds * .30),
    ),
    firstDeaths:clamp(
      Math.round(deaths * random(7,23) / 100),
      0,
      Math.round(rounds * .30),
    ),
    agent,
  };
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
  const pool = getAgentPoolByRole(role);

  if (preferred && pool.includes(preferred) && !taken.has(preferred)) {
    taken.add(preferred);
    return preferred;
  }

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

  return (
    aim * .3 +
    consistency * .2 +
    gameSense * .18 +
    clutch * .12 +
    mental * .1 +
    communication * .1
  );
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

function sum(values:number[]) {
  return values.reduce((total,value) => total + value,0);
}

function average(values:number[]) {
  return values.length ? sum(values) / values.length : 0;
}