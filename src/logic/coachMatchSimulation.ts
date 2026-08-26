import type {CoachCareerState,CoachMapName,CoachMatchResult,CoachPlayer} from "../types/coach";
import type {MatchBoxScore,MatchMapStats,MatchPlayerStats} from "../types/matchStats";
import {getTeamById} from "../data/teams";
import {createInitialCoachMapPool,getMapScore} from "./coachMapPool";
import {getCoachTacticalFit} from "./coachTactics";

const DUELIST_AGENTS=["Iso","Jett","Neon","Phoenix","Raze","Reyna","Waylay","Yoru"];
const CONTROLLER_AGENTS=["Astra","Brimstone","Clove","Harbor","Miks","Omen","Viper"];
const INITIATOR_AGENTS=["Breach","Fade","Gekko","Kayo","Skye","Sova","Tejo"];
const SENTINEL_AGENTS=["Chamber","Cypher","Deadlock","Killjoy","Sage","Veto","Vyse"];
const FLEX_AGENTS=[...DUELIST_AGENTS,...CONTROLLER_AGENTS,...INITIATOR_AGENTS,...SENTINEL_AGENTS];

interface CoachSeriesSimulation {
  result:CoachMatchResult;
  boxScore:MatchBoxScore;
}

export function simulateCoachSeries(career:CoachCareerState,opponentTeamId:string,seriesMaps:CoachMapName[]):CoachSeriesSimulation|null {
  const team=getTeamById(career.team.teamId);
  const opponent=getTeamById(opponentTeamId);
  if(!team||!opponent)return null;

  const playerRoster=getMatchRoster(career.team.roster);
  const opponentRoster=getMatchRoster(career.playerPool.filter(player=>player.teamId===opponent.id));

  if(playerRoster.length<5||opponentRoster.length<5)return null;

  const bestOf=getSeriesBestOf(seriesMaps);
  const winsRequired=Math.ceil(bestOf/2);

  const opponentMapPool=createInitialCoachMapPool(opponent);
  const maps:MatchMapStats[]=[];
  let playerWins=0;
  let opponentWins=0;

  for(let index=0;index<seriesMaps.length;index++){
    if(playerWins===winsRequired||opponentWins===winsRequired)break;

    const mapName=seriesMaps[index];
    const playerMap=career.team.mapPool.maps.find(map=>map.map===mapName);
    const opponentMap=opponentMapPool.maps.find(map=>map.map===mapName);

    const playerPower=getPlayerTeamPower(career,playerRoster,playerMap?getMapScore(playerMap):70);
    const opponentPower=getOpponentTeamPower(opponent.strength,opponentRoster,opponentMap?getMapScore(opponentMap):70);
    const playerWon=rollMapWinner(playerPower,opponentPower);
    const score=createMapScore(playerWon);

    if(playerWon)playerWins++;
    else opponentWins++;

    const allyAgents=new Set<string>();
    const enemyAgents=new Set<string>();

    const allyPlayers=playerRoster.map(player=>{
      const agent=pickAgentForRole(player.role,allyAgents);
      return createCoachMapPlayer(player,team.id,playerWon,score.for,score.against,agent);
    });

    const enemyPlayers=opponentRoster.map(player=>{
      const agent=pickAgentForRole(player.role,enemyAgents);
      return createCoachMapPlayer(player,opponent.id,!playerWon,score.against,score.for,agent);
    });

    maps.push({
      mapNumber:index+1,
      mapName,
      scoreA:score.for,
      scoreB:score.against,
      players:[...allyPlayers,...enemyPlayers],
    });
  }

  const won=playerWins>opponentWins;

  const result:CoachMatchResult={
    id:`coach-${career.coach.season}-${career.team.teamId}-${opponentTeamId}-${Date.now()}`,
    opponentTeamId,
    won,
    mapsWon:playerWins,
    mapsLost:opponentWins,
    maps:maps.map(map=>map.mapName as CoachMapName),
  };

  const boxScore:MatchBoxScore={
    teamAId:team.id,
    teamBId:opponent.id,
    scoreA:playerWins,
    scoreB:opponentWins,
    bestOf,
    maps,
    players:aggregatePlayers(maps),
  };

  return {result,boxScore};
}

function getMatchRoster(players:CoachPlayer[]) {
  return [...players]
    .sort((a,b)=>{
      if(a.starter!==b.starter)return a.starter?-1:1;
      if(b.overall!==a.overall)return b.overall-a.overall;
      return a.id.localeCompare(b.id);
    })
    .slice(0,5);
}

function getSeriesBestOf(seriesMaps:CoachMapName[]):3|5 {
  return seriesMaps.length>=5?5:3;
}

function getPlayerTeamPower(career:CoachCareerState,roster:CoachPlayer[],mapScore:number) {
  const rosterQuality=getRosterQuality(roster);
  const roleBalance=getRoleBalanceScore(roster);
  const tacticalFit=getCoachTacticalFit(career);

  return rosterQuality*.42+
    mapScore*.20+
    career.team.chemistry*.12+
    career.team.form*.10+
    tacticalFit*.11+
    roleBalance*.05;
}

function getOpponentTeamPower(teamStrength:number,roster:CoachPlayer[],mapScore:number) {
  const rosterQuality=getRosterQuality(roster);
  const roleBalance=getRoleBalanceScore(roster);
  const starPower=getRosterStarPower(roster);

  return rosterQuality*.52+
    mapScore*.23+
    roleBalance*.10+
    starPower*.10+
    teamStrength*.05;
}

function rollMapWinner(playerPower:number,opponentPower:number) {
  const difference=playerPower-opponentPower;
  const probability=clamp(.5+difference/55,.18,.82);
  return Math.random()<probability;
}

function createMapScore(won:boolean) {
  const overtime=Math.random()<.12;
  const winningScore=overtime?random(14,17):13;
  const losingScore=overtime?winningScore-2:random(5,11);

  return won?{for:winningScore,against:losingScore}:{for:losingScore,against:winningScore};
}

function createCoachMapPlayer(player:CoachPlayer,teamId:string,won:boolean,scoreFor:number,scoreAgainst:number,agent:string):MatchPlayerStats {
  const rounds=scoreFor+scoreAgainst;
  const role=player.role==="IGL"?"Flex":player.role;

  const skillFactor=(player.overall-80)/100;
  const aimFactor=(player.stats.aim-80)/100;
  const consistencyFactor=(player.stats.consistency-80)/100;
  const communicationFactor=(player.stats.communication-80)/100;
  const gameSenseFactor=(player.stats.gameSense-80)/100;
  const clutchFactor=(player.stats.clutch-80)/100;
  const variation=random(-12,12)/100;

  const rating=clamp(
    Number((
      .97+
      skillFactor*.80+
      gameSenseFactor*.15+
      clutchFactor*.10+
      (won?.07:-.04)+
      variation
    ).toFixed(2)),
    .48,
    1.78,
  );

  const duelistBonus=role==="Duelist"?.045:0;
  const assistBonus=role==="Initiator"?.065:role==="Controller"?.045:role==="Sentinel"?.02:0;

  const killsPerRound=clamp(.57+(rating-1)*.31+aimFactor*.16+duelistBonus,.32,1.05);
  const deathsPerRound=clamp(.69-(rating-1)*.16-consistencyFactor*.12+(won?-.035:.025),.40,.93);
  const assistsPerRound=clamp(.20+communicationFactor*.18+assistBonus,.10,.55);

  const kills=clamp(Math.round(rounds*killsPerRound+random(-3,3)),4,Math.round(rounds*1.2));
  const deaths=clamp(Math.round(rounds*deathsPerRound+random(-2,2)),5,Math.round(rounds*.95));
  const assists=clamp(Math.round(rounds*assistsPerRound+random(-2,3)),1,Math.round(rounds*.70));

  const acs=clamp(
    Math.round(120+kills*5+assists*1.25-deaths*.9+aimFactor*35+(rating-1)*45+random(-15,15)),
    90,
    385,
  );

  return {
    id:`${teamId}-${player.id}`,
    name:player.ign,
    teamId,
    rating,
    acs,
    kills,
    deaths,
    assists,
    kast:clamp(Math.round(64+rating*8+consistencyFactor*16+(won?3:0)+random(-5,5)),48,96),
    adr:clamp(Math.round(acs*.62+random(-10,12)),70,230),
    headshot:clamp(random(18,34)+Math.round((player.stats.aim-80)/2),10,62),
    firstKills:clamp(Math.round(kills*(role==="Duelist"?random(14,25):random(7,17))/100),0,Math.round(rounds*.30)),
    firstDeaths:clamp(Math.round(deaths*random(7,22)/100),0,Math.round(rounds*.30)),
    agent,
  };
}

function aggregatePlayers(maps:MatchMapStats[]):MatchPlayerStats[] {
  const groups=new Map<string,MatchPlayerStats[]>();

  maps.forEach(map=>{
    map.players.forEach(player=>{
      const rows=groups.get(player.id)??[];
      rows.push(player);
      groups.set(player.id,rows);
    });
  });

  return [...groups.entries()].map(([id,rows])=>{
    const first=rows[0];

    return {
      id,
      name:first.name,
      teamId:first.teamId,
      rating:Number(average(rows.map(row=>row.rating)).toFixed(2)),
      acs:Math.round(average(rows.map(row=>row.acs))),
      kills:sum(rows.map(row=>row.kills)),
      deaths:sum(rows.map(row=>row.deaths)),
      assists:sum(rows.map(row=>row.assists)),
      kast:Math.round(average(rows.map(row=>row.kast))),
      adr:Math.round(average(rows.map(row=>row.adr))),
      headshot:Math.round(average(rows.map(row=>row.headshot))),
      firstKills:sum(rows.map(row=>row.firstKills)),
      firstDeaths:sum(rows.map(row=>row.firstDeaths)),
      agent:first.agent,
      agents:rows.map(row=>row.agent).filter(Boolean) as string[],
    };
  });
}

function pickAgentForRole(role:string,taken:Set<string>) {
  const pool=getAgentPool(role);
  const available=pool.filter(agent=>!taken.has(agent));
  const fallback=FLEX_AGENTS.filter(agent=>!taken.has(agent));
  const agent=shuffle(available.length?available:fallback)[0]??"Jett";

  taken.add(agent);
  return agent;
}

function getAgentPool(role:string) {
  if(role==="Duelist")return DUELIST_AGENTS;
  if(role==="Initiator")return INITIATOR_AGENTS;
  if(role==="Controller")return CONTROLLER_AGENTS;
  if(role==="Sentinel")return SENTINEL_AGENTS;
  return FLEX_AGENTS;
}

function random(min:number,max:number){return Math.floor(Math.random()*(max-min+1))+min;}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function shuffle<T>(items:T[]){return [...items].sort(()=>Math.random()-.5);}
function sum(values:number[]){return values.reduce((total,value)=>total+value,0);}
function average(values:number[]){return values.length?sum(values)/values.length:0;}

function getRosterQuality(roster:CoachPlayer[]) {
  if(!roster.length)return 50;

  return average(
    roster.map(player=>
      player.overall*.60+
      player.stats.gameSense*.12+
      player.stats.communication*.10+
      player.stats.consistency*.10+
      player.stats.mental*.08
    ),
  );
}

function getRosterStarPower(roster:CoachPlayer[]) {
  if(!roster.length)return 50;

  const best=[...roster]
    .sort((a,b)=>b.overall-a.overall)
    .slice(0,2);

  return average(best.map(player=>player.overall));
}

function getRoleBalanceScore(roster:CoachPlayer[]) {
  if(roster.length<5)return 50;

  type NonIGLRole=Exclude<CoachPlayer["role"],"IGL">;

  const normalizedRoles:NonIGLRole[]=roster.map(player=>player.role==="IGL"?"Flex":player.role);
  const requiredRoles:NonIGLRole[]=["Duelist","Initiator","Controller","Sentinel"];

  let score=65;

  for(const role of requiredRoles){
    if(normalizedRoles.includes(role))score+=7;
  }

  if(new Set(normalizedRoles).size>=4)score+=7;

  return clamp(score,50,100);
}