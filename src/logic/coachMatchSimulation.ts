import type {CoachCareerState,CoachMapName,CoachMapPool,CoachMapProfile,CoachMatchResult,CoachPlayer,CoachPlayerTacticalRole} from "../types/coach";
import type {MatchBoxScore,MatchMapStats,MatchPlayerStats} from "../types/matchStats";
import {getTeamById} from "../data/teams";
import {createInitialCoachMapPool} from "./coachMapPool";
import {getCoachPlayerTacticalRole,getCoachRoleAssignmentFit,getCoachRoleStructureScore} from "./coachPlayerRoles";
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

interface TeamMapPowerBreakdown {
  roster:number;
  map:number;
  chemistry:number;
  form:number;
  tacticalFit:number;
  roleBalance:number;
  tactics:number;
  total:number;
}

interface OpponentMapPowerBreakdown {
  roster:number;
  map:number;
  roleBalance:number;
  starPower:number;
  teamStrength:number;
  identity:number;
  total:number;
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
    const playerMap=getMapProfile(career.team.mapPool,mapName);
    const opponentMap=getMapProfile(opponentMapPool,mapName);

    const playerPower=getPlayerTeamPower(career,playerRoster,playerMap,opponent.strength);
    const opponentPower=getOpponentTeamPower(opponent.id,opponent.strength,opponentRoster,opponentMap);

    const volatility=getPlayerTacticalVolatility(career);
    const playerWon=rollMapWinner(playerPower.total,opponentPower.total,volatility);
    const score=createMapScore(playerWon,getExpectedMapCloseness(playerPower.total,opponentPower.total));

    if(playerWon)playerWins++;
    else opponentWins++;

    const allyAgents=new Set<string>();
    const enemyAgents=new Set<string>();

    const allyPerformanceBonus=getPlayerPerformanceBonus(career,playerMap,playerWon);

    const allyPlayers=playerRoster.map(player=>{
      const agent=pickAgentForRole(player.role,allyAgents);
      return createCoachMapPlayer(player,team.id,playerWon,score.for,score.against,agent,allyPerformanceBonus);
    });

    const enemyPlayers=opponentRoster.map(player=>{
      const agent=pickAgentForRole(player.role,enemyAgents);
      return createCoachMapPlayer(player,opponent.id,!playerWon,score.against,score.for,agent,0);
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

function getPlayerTeamPower(career:CoachCareerState,roster:CoachPlayer[],map:CoachMapProfile|null,opponentStrength:number):TeamMapPowerBreakdown {
  const rosterQuality=getRosterQuality(roster);
  const roleBalance=getRoleBalanceScore(roster);
  const tacticalFit=getCoachTacticalFit(career);
  const tacticalRoleStructure=getCoachRoleStructureScore(roster,career.team.playerAssignments??[]);
  const mapPower=getMapProfilePower(map);
  const tacticalBonus=getPlayerTacticalBonus(career,roster,map,opponentStrength);

  const rosterValue=rosterQuality*.42;
  const mapValue=mapPower*.25;
  const chemistryValue=career.team.chemistry*.08;
  const formValue=career.team.form*.06;
  const roleBalanceValue=roleBalance*.07;

  const tacticalFitValue=(tacticalFit-75)*.06;
  const tacticalRoleValue=(tacticalRoleStructure-75)*.04;

  const total=
    rosterValue+
    mapValue+
    chemistryValue+
    formValue+
    tacticalFitValue+
    roleBalanceValue+
    tacticalRoleValue+
    tacticalBonus;

  return {
    roster:rosterValue,
    map:mapValue,
    chemistry:chemistryValue,
    form:formValue,
    tacticalFit:tacticalFitValue,
    roleBalance:roleBalanceValue,
    tactics:tacticalBonus,
    total,
  };
}

function getOpponentTeamPower(teamId:string,teamStrength:number,roster:CoachPlayer[],map:CoachMapProfile|null):OpponentMapPowerBreakdown {
  const rosterQuality=getRosterQuality(roster);
  const roleBalance=getRoleBalanceScore(roster);
  const starPower=getRosterStarPower(roster);
  const mapPower=getMapProfilePower(map);
  const identityBonus=getOpponentIdentityBonus(teamId,teamStrength,map);

  const rosterValue=rosterQuality*.42;
  const mapValue=mapPower*.25;
  const roleBalanceValue=roleBalance*.07;
  const starPowerValue=starPower*.08;
  const strengthValue=teamStrength*.06;

  const total=
    rosterValue+
    mapValue+
    roleBalanceValue+
    starPowerValue+
    strengthValue+
    identityBonus;

  return {
    roster:rosterValue,
    map:mapValue,
    roleBalance:roleBalanceValue,
    starPower:starPowerValue,
    teamStrength:strengthValue,
    identity:identityBonus,
    total,
  };
}

function getMapProfile(pool:CoachMapPool,map:CoachMapName) {
  return pool.maps.find(item=>item.map===map)??null;
}

function getMapProfilePower(map:CoachMapProfile|null) {
  if(!map)return 70;

  return (
    map.strength*.36+
    map.attack*.20+
    map.defense*.20+
    map.preparation*.24
  );
}

function getPlayerTacticalBonus(career:CoachCareerState,roster:CoachPlayer[],map:CoachMapProfile|null,opponentStrength:number) {
  const style=career.team.tacticalStyle;
  const tactics=career.team.tactics;
  const assignments=career.team.playerAssignments??[];

  const communication=getRosterCommunication(roster);
  const gameSense=getRosterGameSense(roster);
  const averageAim=average(roster.map(player=>player.stats.aim));
  const averageMental=average(roster.map(player=>player.stats.mental));
  const averageConsistency=average(roster.map(player=>player.stats.consistency));

  const assignedOperator=roster.find(player=>getCoachPlayerTacticalRole(player,assignments)==="Main Operator");
  const operatorCandidate=assignedOperator??getBestOperatorCandidate(roster);

  let bonus=0;

  /* =========================
     IDENTIDAD + ROSTER
  ========================= */

  if(style==="Aggressive"){
    if(averageAim>=85)bonus+=.45;
    if(averageMental>=82)bonus+=.30;

    if(averageAim<78)bonus-=.45;
    if(averageMental<75)bonus-=.30;
  }

  if(style==="Controlled"){
    if(gameSense>=83)bonus+=.45;
    if(communication>=82)bonus+=.35;
    if(averageConsistency>=82)bonus+=.30;

    if(gameSense<76)bonus-=.40;
    if(communication<75)bonus-=.30;
  }

  if(style==="Reactive"){
    if(gameSense>=84)bonus+=.50;
    if(communication>=83)bonus+=.40;
    if(averageMental>=80)bonus+=.25;

    if(gameSense<77)bonus-=.45;
  }

  if(style==="Anti-Strat"){
    const preparation=map?.preparation??70;

    bonus+=clamp((opponentStrength-80)/12,0,1.15);
    bonus+=clamp((preparation-75)/20,0,.75);

    if(gameSense>=83)bonus+=.25;
    if(communication>=82)bonus+=.20;

    if(preparation<70)bonus-=.70;
  }

  if(style==="Balanced"){
    if(gameSense>=80)bonus+=.20;
    if(communication>=80)bonus+=.20;
    if(averageConsistency>=80)bonus+=.20;
    if(averageAim>=80)bonus+=.20;
  }

  /* =========================
    ATAQUE + ROSTER
  ========================= */

  if(tactics.attackStyle==="Explosive"){
    if(averageAim>=84)bonus+=.25;
    if(averageMental>=80)bonus+=.15;
    if(communication<75)bonus-=.25;
  }

  if(tactics.attackStyle==="Defaults"){
    if(gameSense>=82)bonus+=.25;
    if(averageConsistency>=80)bonus+=.15;
  }

  if(tactics.attackStyle==="Map Control"){
    if(gameSense>=84)bonus+=.35;
    else if(gameSense<76)bonus-=.35;

    if(communication>=82)bonus+=.20;
  }

  if(tactics.attackStyle==="Executions"){
    if(communication>=84)bonus+=.40;
    else if(communication<76)bonus-=.40;

    if(averageConsistency>=82)bonus+=.15;
  }

  /* =========================
    DEFENSA + ROSTER
  ========================= */

  if(tactics.defenseStyle==="Retake"){
    if(communication>=83)bonus+=.35;
    if(gameSense>=82)bonus+=.25;
  }

  if(tactics.defenseStyle==="Aggressive"){
    if(averageAim>=84)bonus+=.30;
    if(averageMental>=80)bonus+=.20;

    if(averageConsistency<75)bonus-=.30;
  }

  if(tactics.defenseStyle==="Passive"){
    if(averageConsistency>=83)bonus+=.30;
    if(gameSense>=82)bonus+=.20;

    if(averageMental<75)bonus-=.20;
  }

  if(tactics.defenseStyle==="Standard"){
    if(communication>=80&&gameSense>=80)bonus+=.20;
  }

  /* =========================
    OPERATOR
  ========================= */

  if(tactics.operatorUsage==="Priority"){
    if(assignedOperator){
      const operatorFit=getCoachRoleAssignmentFit(assignedOperator,"Main Operator");

      if(operatorFit>=88)bonus+=.45;
      else if(operatorFit>=82)bonus+=.25;
      else if(operatorFit<72)bonus-=.30;
    }else{
      bonus-=.45;
    }

    if(operatorCandidate.stats.aim>=92)bonus+=.45;
    else if(operatorCandidate.stats.aim>=87)bonus+=.25;
    else if(operatorCandidate.stats.aim<82)bonus-=.45;

    if(operatorCandidate.stats.consistency>=84)bonus+=.20;
    if(operatorCandidate.stats.mental<74)bonus-=.20;

    if(map&&map.defense>=85)bonus+=.20;

    if(tactics.attackStyle==="Explosive")bonus-=.15;
    if(tactics.pace==="Fast"&&tactics.risk==="High")bonus-=.30;
  }

  if(tactics.operatorUsage==="Situational"){
    if(operatorCandidate.stats.aim>=86)bonus+=.15;
    if(operatorCandidate.stats.gameSense>=82)bonus+=.10;

    if(assignedOperator&&getCoachRoleAssignmentFit(assignedOperator,"Main Operator")>=82)bonus+=.10;
  }

  if(tactics.operatorUsage==="Rare"){
    if(tactics.attackStyle==="Explosive")bonus+=.15;
    if(tactics.pace==="Fast")bonus+=.10;

    if(operatorCandidate.stats.aim>=92&&operatorCandidate.stats.consistency>=85)bonus-=.15;
  }

  /* =========================
     MAPA
  ========================= */

  if(map){
    if(tactics.attackStyle==="Map Control"&&map.attack>=85)bonus+=.25;
    if(tactics.attackStyle==="Executions"&&map.preparation>=85)bonus+=.30;
    if(tactics.defenseStyle==="Retake"&&map.defense>=85)bonus+=.25;
    if(tactics.defenseStyle==="Passive"&&map.defense>=88)bonus+=.20;

    if(map.preparation<65)bonus-=.55;
    if(map.preparation>=90)bonus+=.30;
  }

  bonus+=getPaceRosterBonus(career,roster,map);
  bonus+=getRiskRosterBonus(career,roster);
  bonus+=getAttackDefenseInteractionBonus(career,roster);
  bonus+=getTacticalRoleSynergyBonus(career,roster);

  return clamp(bonus,-3,3);
}

function getTacticalRoleSynergyBonus(career:CoachCareerState,roster:CoachPlayer[]) {
  const tactics=career.team.tactics;
  const assignments=career.team.playerAssignments??[];

  const rolePlayers=(role:string)=>roster.filter(player=>getCoachPlayerTacticalRole(player,assignments)===role);
  const bestFit=(role:CoachPlayerTacticalRole)=>{
    const players=rolePlayers(role);
    if(!players.length)return null;
    return Math.max(...players.map(player=>getCoachRoleAssignmentFit(player,role)));
  };

  const entryFit=bestFit("Entry");
  const secondaryEntryFit=bestFit("Secondary Entry");
  const iglFit=bestFit("IGL");
  const lurkerFit=bestFit("Lurker");
  const anchorFit=bestFit("Anchor");

  let bonus=0;

  if(tactics.attackStyle==="Explosive"){
    if(entryFit!==null){
      if(entryFit>=88)bonus+=.35;
      else if(entryFit>=80)bonus+=.20;
      else if(entryFit<70)bonus-=.25;
    }else bonus-=.35;

    if(secondaryEntryFit!==null&&secondaryEntryFit>=82)bonus+=.15;
    if(lurkerFit!==null&&lurkerFit>=85)bonus-=.10;
  }

  if(tactics.attackStyle==="Defaults"){
    if(iglFit!==null&&iglFit>=82)bonus+=.25;
    if(lurkerFit!==null&&lurkerFit>=82)bonus+=.30;

    if(iglFit===null)bonus-=.25;
  }

  if(tactics.attackStyle==="Map Control"){
    if(iglFit!==null&&iglFit>=82)bonus+=.20;
    if(lurkerFit!==null&&lurkerFit>=80)bonus+=.20;
    if(anchorFit!==null&&anchorFit>=80)bonus+=.10;
  }

  if(tactics.attackStyle==="Executions"){
    if(iglFit!==null&&iglFit>=82)bonus+=.25;
    if(entryFit!==null&&entryFit>=80)bonus+=.20;
    if(secondaryEntryFit!==null&&secondaryEntryFit>=80)bonus+=.15;

    if(iglFit===null)bonus-=.25;
  }

  if(tactics.defenseStyle==="Aggressive"){
    if(entryFit!==null&&entryFit>=82)bonus+=.15;
    if(secondaryEntryFit!==null&&secondaryEntryFit>=80)bonus+=.15;
  }

  if(tactics.defenseStyle==="Passive"){
    if(anchorFit!==null&&anchorFit>=82)bonus+=.25;
    if(lurkerFit!==null&&lurkerFit>=80)bonus+=.10;
  }

  if(tactics.defenseStyle==="Retake"){
    if(anchorFit!==null&&anchorFit>=80)bonus+=.20;
    if(iglFit!==null&&iglFit>=82)bonus+=.20;
  }

  if(tactics.defenseStyle==="Standard"){
    if(anchorFit!==null&&anchorFit>=78)bonus+=.10;
    if(iglFit!==null&&iglFit>=78)bonus+=.10;
  }

  return clamp(bonus,-1,1);
}

function getAttackDefenseInteractionBonus(career:CoachCareerState,roster:CoachPlayer[]) {
  const tactics=career.team.tactics;

  const aim=average(roster.map(player=>player.stats.aim));
  const mental=average(roster.map(player=>player.stats.mental));
  const consistency=average(roster.map(player=>player.stats.consistency));
  const communication=getRosterCommunication(roster);
  const gameSense=getRosterGameSense(roster);

  let bonus=0;

  if(tactics.attackStyle==="Explosive"&&tactics.defenseStyle==="Aggressive"){
    if(aim>=85&&mental>=82)bonus+=.25;
    if(consistency<76)bonus-=.25;
  }

  if(tactics.attackStyle==="Explosive"&&tactics.defenseStyle==="Passive"){
    bonus-=.20;

    if(gameSense>=84&&consistency>=84)bonus+=.10;
  }

  if(tactics.attackStyle==="Defaults"&&tactics.defenseStyle==="Retake"){
    if(gameSense>=83)bonus+=.20;
    if(communication>=82)bonus+=.20;
  }

  if(tactics.attackStyle==="Defaults"&&tactics.defenseStyle==="Aggressive"){
    if(gameSense<78)bonus-=.20;
  }

  if(tactics.attackStyle==="Map Control"&&tactics.defenseStyle==="Standard"){
    if(gameSense>=82&&communication>=80)bonus+=.20;
  }

  if(tactics.attackStyle==="Map Control"&&tactics.defenseStyle==="Passive"){
    if(consistency>=82)bonus+=.15;
  }

  if(tactics.attackStyle==="Executions"&&tactics.defenseStyle==="Retake"){
    if(communication>=84)bonus+=.25;
    else if(communication<76)bonus-=.20;
  }

  if(tactics.attackStyle==="Executions"&&tactics.defenseStyle==="Aggressive"){
    if(communication<78)bonus-=.15;
  }

  return clamp(bonus,-.50,.50);
}

function getPaceRosterBonus(career:CoachCareerState,roster:CoachPlayer[],map:CoachMapProfile|null) {
  const tactics=career.team.tactics;

  const aim=average(roster.map(player=>player.stats.aim));
  const mental=average(roster.map(player=>player.stats.mental));
  const consistency=average(roster.map(player=>player.stats.consistency));
  const communication=getRosterCommunication(roster);
  const gameSense=getRosterGameSense(roster);

  let bonus=0;

  if(tactics.pace==="Fast"){
    if(aim>=85)bonus+=.30;
    else if(aim<77)bonus-=.30;

    if(mental>=82)bonus+=.20;
    else if(mental<74)bonus-=.20;

    if(consistency<74)bonus-=.15;

    if(map&&map.attack>=85)bonus+=.15;
  }

  if(tactics.pace==="Slow"){
    if(gameSense>=84)bonus+=.30;
    else if(gameSense<76)bonus-=.30;

    if(communication>=82)bonus+=.20;
    if(consistency>=82)bonus+=.20;

    if(map){
      if(map.preparation>=85)bonus+=.20;
      if(map.preparation<68)bonus-=.25;
    }
  }

  if(tactics.pace==="Balanced"){
    const balancedAttributes=[aim,mental,consistency,communication,gameSense];
    const weakest=Math.min(...balancedAttributes);
    const strongest=Math.max(...balancedAttributes);

    if(weakest>=79)bonus+=.25;
    if(weakest>=82)bonus+=.15;

    if(strongest-weakest<=10)bonus+=.15;
  }

  return clamp(bonus,-.75,.75);
}

function getRiskRosterBonus(career:CoachCareerState,roster:CoachPlayer[]) {
  const risk=career.team.tactics.risk;

  const aim=average(roster.map(player=>player.stats.aim));
  const mental=average(roster.map(player=>player.stats.mental));
  const clutch=average(roster.map(player=>player.stats.clutch));
  const consistency=average(roster.map(player=>player.stats.consistency));
  const communication=getRosterCommunication(roster);
  const gameSense=getRosterGameSense(roster);

  let bonus=0;

  if(risk==="High"){
    if(mental>=84)bonus+=.25;
    else if(mental<75)bonus-=.30;

    if(aim>=84)bonus+=.20;
    if(clutch>=82)bonus+=.20;

    if(consistency<74)bonus-=.20;
  }

  if(risk==="Low"){
    if(consistency>=84)bonus+=.25;
    else if(consistency<75)bonus-=.30;

    if(gameSense>=83)bonus+=.20;
    if(communication>=82)bonus+=.15;

    if(mental<72)bonus-=.15;
  }

  if(risk==="Medium"){
    const attributes=[mental,clutch,consistency,communication,gameSense];
    const weakest=Math.min(...attributes);
    const strongest=Math.max(...attributes);

    if(weakest>=79)bonus+=.20;
    if(strongest-weakest<=12)bonus+=.15;
  }

  return clamp(bonus,-.65,.65);
}
function getPlayerTacticalVolatility(career:CoachCareerState) {
  const tactics=career.team.tactics;
  let volatility=1;

  if(tactics.risk==="High")volatility+=.22;
  if(tactics.risk==="Low")volatility-=.18;

  if(tactics.pace==="Fast")volatility+=.06;
  if(tactics.pace==="Slow")volatility-=.04;

  if(career.team.tacticalStyle==="Aggressive")volatility+=.06;
  if(career.team.tacticalStyle==="Controlled")volatility-=.06;

  return clamp(volatility,.72,1.32);
}

function getOpponentIdentityBonus(teamId:string,teamStrength:number,map:CoachMapProfile|null) {
  const identity=deterministicNumber(`${teamId}-competitive-identity`)%4;
  let bonus=0;

  if(identity===0){
    bonus+=map?Math.max(0,map.attack-75)*.025:0;
  }

  if(identity===1){
    bonus+=map?Math.max(0,map.defense-75)*.025:0;
  }

  if(identity===2){
    bonus+=map?Math.max(0,map.preparation-75)*.025:0;
  }

  if(identity===3){
    bonus+=(teamStrength-75)*.025;
  }

  return clamp(bonus,0,2);
}

function rollMapWinner(playerPower:number,opponentPower:number,volatility:number) {
  const difference=playerPower-opponentPower;

  const effectiveDifference=difference/volatility;
  const scaledDifference=effectiveDifference/55;

  const randomSwing=((Math.random()-.5)*.06)*volatility;
  const probability=clamp(.5+scaledDifference+randomSwing,.16,.84);

  return Math.random()<probability;
}

function getExpectedMapCloseness(playerPower:number,opponentPower:number) {
  const difference=Math.abs(playerPower-opponentPower);

  if(difference<=2)return "very-close";
  if(difference<=5)return "close";
  if(difference<=9)return "normal";

  return "one-sided";
}

function createMapScore(won:boolean,closeness:"very-close"|"close"|"normal"|"one-sided") {
  const overtimeChance=
    closeness==="very-close"?.24:
    closeness==="close"?.17:
    closeness==="normal"?.10:
    .05;

  const overtime=Math.random()<overtimeChance;

  if(overtime){
    const winningScore=random(14,17);
    const losingScore=winningScore-2;

    return won
      ?{for:winningScore,against:losingScore}
      :{for:losingScore,against:winningScore};
  }

  const losingScore=
    closeness==="very-close"?random(10,11):
    closeness==="close"?random(8,11):
    closeness==="normal"?random(6,10):
    random(3,8);

  return won
    ?{for:13,against:losingScore}
    :{for:losingScore,against:13};
}

function getPlayerPerformanceBonus(career:CoachCareerState,map:CoachMapProfile|null,won:boolean) {
  let bonus=0;

  if(map){
    bonus+=(map.preparation-75)/500;
    bonus+=(map.strength-75)/700;
  }

  bonus+=(getCoachTacticalFit(career)-75)/650;

  if(won)bonus+=.01;

  return clamp(bonus,-.07,.08);
}

function createCoachMapPlayer(player:CoachPlayer,teamId:string,won:boolean,scoreFor:number,scoreAgainst:number,agent:string,performanceBonus:number):MatchPlayerStats {
  const rounds=scoreFor+scoreAgainst;
  const role=player.role;

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
      performanceBonus+
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

  const normalizedRoles=roster.map(player=>player.role);
  const requiredRoles:Exclude<CoachPlayer["role"],"IGL">[]=["Duelist","Initiator","Controller","Sentinel"];

  let score=65;

  for(const role of requiredRoles){
    if(normalizedRoles.includes(role))score+=7;
  }

  if(new Set(normalizedRoles).size>=4)score+=7;

  return clamp(score,50,100);
}

function getRosterCommunication(roster:CoachPlayer[]) {
  return average(roster.map(player=>player.stats.communication));
}

function getRosterGameSense(roster:CoachPlayer[]) {
  return average(roster.map(player=>player.stats.gameSense));
}

function getBestOperatorCandidate(roster:CoachPlayer[]) {
  return [...roster].sort((a,b)=>{
    const scoreA=a.stats.aim+(a.role==="Duelist"?5:0);
    const scoreB=b.stats.aim+(b.role==="Duelist"?5:0);

    return scoreB-scoreA;
  })[0];
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}

function random(min:number,max:number){return Math.floor(Math.random()*(max-min+1))+min;}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function shuffle<T>(items:T[]){return [...items].sort(()=>Math.random()-.5);}
function sum(values:number[]){return values.reduce((total,value)=>total+value,0);}
function average(values:number[]){return values.length?sum(values)/values.length:0;}