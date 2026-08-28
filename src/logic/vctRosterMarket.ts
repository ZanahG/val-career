import type {VCTRealPlayer} from "../data/vctPlayers";
import type {VCTRosterState,VCTTransfer} from "../types/vctRosters";
import {progressVCTPlayers} from "./vctPlayerDevelopment";
import {TEAMS} from "../data/teams";

const shuffle=<T,>(items:T[])=>[...items].sort(()=>Math.random()-.5);
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

const REGION_TRANSFER_WEIGHTS:Record<string,Record<string,number>>={
  Americas:{Americas:1,EMEA:.5,Pacific:.14,China:.05},
  EMEA:{Americas:.5,EMEA:1,Pacific:.22,China:.07},
  Pacific:{Americas:.14,EMEA:.22,Pacific:1,China:.32},
  China:{Americas:.05,EMEA:.07,Pacific:.32,China:1},
};

export function simulateVCTOffseason(state:VCTRosterState,nextSeason:number):VCTRosterState {
  let players=state.players.map(player=>({...player,stats:{...player.stats}}));
  players=progressVCTPlayers(players);

  const transfers:VCTTransfer[]=[];
  const teams=[...new Set(players.map(player=>player.team))];

  for(const teamName of shuffle(teams)){
    const roster=players.filter(player=>player.team===teamName);
    if(roster.length!==5)continue;

    const tier=roster[0]?.tier??1;
    const transferChance=tier===1?.45:.32;

    if(Math.random()>transferChance)continue;

    attemptTeamTransfer(players,teamName,nextSeason,transfers);
  }

  return {
    ...state,
    season:nextSeason,
    players,
    transfers:[...(state.transfers??[]),...transfers],
  };
}

function attemptTeamTransfer(players:VCTRealPlayer[],teamName:string,season:number,transfers:VCTTransfer[]) {
  const roster=players.filter(player=>player.team===teamName);
  if(roster.length!==5)return;

  const outgoing=pickTransferCandidate(roster);
  if(!outgoing)return;

  const targetTeam=pickTargetTeam(players,teamName,outgoing);
  if(!targetTeam)return;

  const targetRoster=players.filter(player=>player.team===targetTeam);
  if(targetRoster.length!==5)return;

  const incoming=pickCompatibleCandidate(targetRoster,outgoing);
  if(!incoming)return;

  const outgoingName=outgoing.ign;
  const incomingName=incoming.ign;

  movePlayerToTeam(outgoing,targetTeam);
  movePlayerToTeam(incoming,teamName);

  transfers.push(
    {season,player:outgoingName,from:teamName,to:targetTeam},
    {season,player:incomingName,from:targetTeam,to:teamName},
  );
}

function pickTargetTeam(players:VCTRealPlayer[],originTeam:string,outgoing:VCTRealPlayer) {
  const originCircuit=normalizeRegion(outgoing.circuit||outgoing.region);
  const originTier=outgoing.tier;

  const teamNames=[...new Set(players.map(player=>player.team))]
    .filter(teamName=>teamName!==originTeam);

  const candidates=teamNames.map(teamName=>{
    const roster=players.filter(player=>player.team===teamName);
    if(roster.length!==5)return undefined;

    const targetSample=roster[0];
    if(!targetSample)return undefined;

    const targetCircuit=normalizeRegion(targetSample.circuit||targetSample.region);
    const targetTier=targetSample.tier;
    const team=TEAMS.find(item=>item.name===teamName);

    const regionWeight=getRegionTransferWeight(originCircuit,targetCircuit);
    const tierWeight=getTierTransferWeight(originTier,targetTier,outgoing);
    const prestigeBonus=team?getPrestigeBonus(team.prestige):0;
    const roleNeed=getRoleNeedScore(roster,outgoing.role);

    const score=
      regionWeight*45+
      tierWeight*30+
      prestigeBonus*15+
      roleNeed*20+
      Math.random()*15;

    return {teamName,score,regionWeight,tierWeight};
  }).filter((candidate):candidate is NonNullable<typeof candidate>=>Boolean(candidate));

  const eligible=candidates.filter(candidate=>{
    const chance=clamp(candidate.regionWeight*candidate.tierWeight+.05,0,1);
    return Math.random()<chance;
  });

  if(!eligible.length)return undefined;

  eligible.sort((a,b)=>b.score-a.score);

  const topCandidates=eligible.slice(0,Math.min(4,eligible.length));
  return shuffle(topCandidates)[0]?.teamName;
}

function getTierTransferWeight(fromTier:1|2,toTier:1|2,player:VCTRealPlayer) {
  if(fromTier===toTier)return 1;

  const skill=getPlayerSkill(player);

  if(fromTier===2&&toTier===1){
    if(skill>=87)return .42;
    if(skill>=84)return .26;
    if(skill>=81)return .12;
    return .04;
  }

  if(fromTier===1&&toTier===2){
    if(skill<=78)return .38;
    if(skill<=81)return .22;
    if(skill<=84)return .10;
    return .03;
  }

  return .05;
}

function pickTransferCandidate(roster:VCTRealPlayer[]) {
  const scored=roster.map(player=>{
    const skill=getPlayerSkill(player);
    const expendability=100-skill;
    const randomFactor=Math.random()*25;

    return {
      player,
      score:expendability*.65+randomFactor,
    };
  });

  scored.sort((a,b)=>b.score-a.score);

  const candidates=scored.slice(0,Math.min(3,scored.length));
  return shuffle(candidates)[0]?.player;
}

function pickCompatibleCandidate(roster:VCTRealPlayer[],outgoing:VCTRealPlayer) {
  const wantedRole=normalizeRole(outgoing.role);

  const scored=roster.map(candidate=>{
    const candidateRole=normalizeRole(candidate.role);
    const sameRoleBonus=candidateRole===wantedRole?35:0;
    const flexBonus=candidateRole==="Flex"?12:0;
    const skill=getPlayerSkill(candidate);

    return {
      player:candidate,
      score:sameRoleBonus+flexBonus+skill*.35+Math.random()*15,
    };
  });

  scored.sort((a,b)=>b.score-a.score);

  const candidates=scored.slice(0,Math.min(3,scored.length));
  return shuffle(candidates)[0]?.player;
}

function movePlayerToTeam(player:VCTRealPlayer,targetTeamName:string) {
  const targetTeam=TEAMS.find(team=>team.name===targetTeamName);

  player.team=targetTeamName;

  if(!targetTeam)return;

  player.teamId=targetTeam.id;
  player.tier=targetTeam.tier;

  if(targetTeam.circuit)player.circuit=targetTeam.circuit;

  if(targetTeam.tier===1){
    player.region=`VCT ${targetTeam.circuit}`;
    return;
  }

  player.region=targetTeam.marketRegion;
}

function getRoleNeedScore(roster:VCTRealPlayer[],role:string) {
  const wantedRole=normalizeRole(role);
  const exactCount=roster.filter(player=>normalizeRole(player.role)===wantedRole).length;

  if(exactCount===0)return 1;
  if(exactCount===1)return .45;

  return .1;
}

function getPrestigeBonus(prestige:number) {
  if(prestige>=92)return 1;
  if(prestige>=86)return .75;
  if(prestige>=80)return .5;
  if(prestige>=74)return .3;
  return .15;
}

function getRegionTransferWeight(fromRegion:string,toRegion:string) {
  return REGION_TRANSFER_WEIGHTS[fromRegion]?.[toRegion]??.05;
}

function normalizeRegion(region:string) {
  const value=region.trim().toLowerCase();

  if(
    value.includes("america")||
    value.includes("latam")||
    value.includes("brazil")||
    value.includes("brasil")||
    value.includes("north america")
  )return "Americas";

  if(
    value.includes("emea")||
    value.includes("europe")||
    value.includes("turkey")||
    value.includes("mena")||
    value.includes("cis")
  )return "EMEA";

  if(
    value.includes("pacific")||
    value.includes("korea")||
    value.includes("japan")||
    value.includes("sea")||
    value.includes("oceania")
  )return "Pacific";

  if(value.includes("china"))return "China";

  return region;
}

function normalizeRole(role:string) {
  if(role==="Duelista"||role==="Duelist")return "Duelist";
  if(role==="Iniciador"||role==="Initiator")return "Initiator";
  if(role==="Controlador"||role==="Controller")return "Controller";
  if(role==="Centinela"||role==="Sentinel")return "Sentinel";
  if(role==="IGL")return "IGL";
  return "Flex";
}

function getPlayerSkill(player:VCTRealPlayer) {
  const {aim,clutch,gameSense,communication,consistency,mental}=player.stats;

  return (
    aim*.30+
    consistency*.20+
    gameSense*.18+
    clutch*.12+
    mental*.10+
    communication*.10
  );
}