import type {CoachCareerState,CoachMastersEvent,CoachMastersMatch,CoachMastersQualifier,CoachMastersState,CoachMastersSwissStanding} from "../types/coach";
import type {CompetitiveCircuit} from "../types/career";
import {TEAMS} from "../data/teams";
import {getCoachCompetitiveStrengthTable,getStoredCompetitiveStrength} from "./coachTeamStrength";
import {getStage1Placement} from "./coachStage";
import {getKickoffPlacement} from "./kickoffBracket";

const SWISS_R1="Swiss Round 1";
const SWISS_R2="Swiss Round 2";
const SWISS_R3="Swiss Round 3";

export function createCoachMasters(career:CoachCareerState,event:CoachMastersEvent):CoachMastersState {
  const qualifiers=createMastersQualifiers(career,event);
  const swissQualifiers=qualifiers.filter(team=>team.seed!==1);
  const competitiveStrengthByTeam=getCoachCompetitiveStrengthTable(career);

  const standings:CoachMastersSwissStanding[]=swissQualifiers.map(team=>({
    teamId:team.teamId,
    wins:0,
    losses:0,
    qualified:false,
    eliminated:false,
  }));

  const state:CoachMastersState={
    event,
    playerTeamId:career.team.teamId,
    phase:"Swiss",
    qualifiers,
    swissStandings:standings,
    playoffQualifiedIds:[],
    matches:createSwissRound1(event,qualifiers),
    placementByTeam:{},
    competitiveStrengthByTeam,
    complete:false,
  };

  return advanceMastersCPU(state);
}

export function createCoachMasters1(career:CoachCareerState) {
  return createCoachMasters(career,"Masters 1");
}

export function createCoachMasters2(career:CoachCareerState) {
  return createCoachMasters(career,"Masters 2");
}

export function getNextPlayerMastersMatch(state:CoachMastersState) {
  return state.matches.find(match=>
    match.status==="Ready"&&
    (match.teamAId===state.playerTeamId||match.teamBId===state.playerTeamId)
  );
}

export function playPlayerMastersMatchWithScore(state:CoachMastersState,playerWon:boolean,playerMapsWon:number,playerMapsLost:number) {
  const match=getNextPlayerMastersMatch(state);

  if(!match||!match.teamAId||!match.teamBId)return state;

  const playerIsA=match.teamAId===state.playerTeamId;
  const winnerId=playerWon?state.playerTeamId:playerIsA?match.teamBId:match.teamAId;
  const scoreA=playerIsA?playerMapsWon:playerMapsLost;
  const scoreB=playerIsA?playerMapsLost:playerMapsWon;

  let updated=completeMastersMatch(state,match.id,winnerId,scoreA,scoreB);
  updated=updateMastersState(updated);

  return advanceMastersCPU(updated);
}

export function getMastersPlacement(state:CoachMastersState,teamId:string) {
  return state.placementByTeam[teamId]??13;
}

export function getMastersPlayerRecord(state:CoachMastersState) {
  const matches=state.matches.filter(match=>
    match.status==="Complete"&&
    (match.teamAId===state.playerTeamId||match.teamBId===state.playerTeamId)
  );

  return {
    wins:matches.filter(match=>match.winnerId===state.playerTeamId).length,
    losses:matches.filter(match=>match.loserId===state.playerTeamId).length,
  };
}

export function advanceMastersCPU(initial:CoachMastersState):CoachMastersState {
  let state=updateMastersState(initial);

  for(let guard=0;guard<100;guard++) {
    if(state.complete)return state;

    const playerMatch=getNextPlayerMastersMatch(state);
    if(playerMatch)return state;

    const cpuMatch=state.matches.find(match=>
      match.status==="Ready"&&
      match.teamAId!==state.playerTeamId&&
      match.teamBId!==state.playerTeamId
    );

    if(!cpuMatch)return updateMastersState(state);
    if(!cpuMatch.teamAId||!cpuMatch.teamBId)return state;

    const winnerId=getCPUWinner(state,cpuMatch);
    const required=Math.ceil(cpuMatch.bestOf/2);
    const loserMaps=seededNumber(`${state.event}:${cpuMatch.id}:score`)%required;
    const scoreA=winnerId===cpuMatch.teamAId?required:loserMaps;
    const scoreB=winnerId===cpuMatch.teamBId?required:loserMaps;

    state=completeMastersMatch(state,cpuMatch.id,winnerId,scoreA,scoreB);
    state=updateMastersState(state);
  }

  return state;
}

function updateMastersState(state:CoachMastersState):CoachMastersState {
  if(state.complete)return state;

  if(state.phase==="Swiss")return updateSwiss(state);
  if(state.phase==="Playoffs")return updatePlayoffs(state);

  return state;
}

function updateSwiss(state:CoachMastersState):CoachMastersState {
  let updated=refreshSwissStandings(state);

  const round1=updated.matches.filter(match=>match.round===SWISS_R1);
  const round2=updated.matches.filter(match=>match.round===SWISS_R2);
  const round3=updated.matches.filter(match=>match.round===SWISS_R3);

  if(round1.length&&round1.every(match=>match.status==="Complete")&&!round2.length) {
    const winners=updated.swissStandings
      .filter(team=>team.wins===1&&team.losses===0)
      .map(team=>team.teamId);

    const losers=updated.swissStandings
      .filter(team=>team.wins===0&&team.losses===1)
      .map(team=>team.teamId);

    updated={
      ...updated,
      matches:[
        ...updated.matches,
        ...pairTeams(updated.event,winners,SWISS_R2,"winners"),
        ...pairTeams(updated.event,losers,SWISS_R2,"losers"),
      ],
    };
  }

  const refreshedRound2=updated.matches.filter(match=>match.round===SWISS_R2);

  if(refreshedRound2.length===4&&refreshedRound2.every(match=>match.status==="Complete")&&!round3.length) {
    updated=refreshSwissStandings(updated);

    const deciderTeams=updated.swissStandings
      .filter(team=>team.wins===1&&team.losses===1)
      .map(team=>team.teamId);

    updated={
      ...updated,
      matches:[
        ...updated.matches,
        ...pairTeams(updated.event,deciderTeams,SWISS_R3,"decider"),
      ],
    };
  }

  const refreshedRound3=updated.matches.filter(match=>match.round===SWISS_R3);

  if(refreshedRound3.length===2&&refreshedRound3.every(match=>match.status==="Complete")) {
    updated=refreshSwissStandings(updated);

    const swissQualified=updated.swissStandings
      .filter(team=>team.qualified)
      .map(team=>team.teamId);

    if(swissQualified.length===4) {
      updated={
        ...updated,
        phase:"Playoffs",
        playoffQualifiedIds:swissQualified,
        matches:[
          ...updated.matches,
          ...createPlayoffBracket(updated.event,updated.qualifiers,swissQualified),
        ],
      };

      updated=assignSwissPlacements(updated);
      updated=updatePlayoffs(updated);
    }
  }

  return updated;
}

function refreshSwissStandings(state:CoachMastersState):CoachMastersState {
  const standings=state.swissStandings.map(team=>{
    let wins=0;
    let losses=0;

    for(const match of state.matches) {
      if(match.stage!=="Swiss"||match.status!=="Complete")continue;

      if(match.winnerId===team.teamId)wins++;
      if(match.loserId===team.teamId)losses++;
    }

    return {
      ...team,
      wins,
      losses,
      qualified:wins>=2,
      eliminated:losses>=2,
    };
  });

  return {...state,swissStandings:standings};
}

function createSwissRound1(event:CoachMastersEvent,qualifiers:CoachMastersQualifier[]):CoachMastersMatch[] {
  const secondSeeds=qualifiers
    .filter(team=>team.seed===2)
    .sort((a,b)=>a.circuit.localeCompare(b.circuit));

  const thirdSeeds=qualifiers
    .filter(team=>team.seed===3)
    .sort((a,b)=>a.circuit.localeCompare(b.circuit));

  if(secondSeeds.length!==4||thirdSeeds.length!==4)return [];

  const rotatedThirdSeeds=[
    ...thirdSeeds.slice(1),
    thirdSeeds[0],
  ];

  const prefix=getEventPrefix(event);

  return secondSeeds.map((team,index)=>
    createMatch(
      `${prefix}-swiss-r1-${index+1}`,
      "Swiss",
      SWISS_R1,
      3,
      team.teamId,
      rotatedThirdSeeds[index].teamId,
    )
  );
}

function pairTeams(event:CoachMastersEvent,teamIds:string[],round:string,prefix:string):CoachMastersMatch[] {
  const eventPrefix=getEventPrefix(event);

  const sorted=[...teamIds].sort(
    (a,b)=>
      seededNumber(`${event}:${round}:${a}`)-
      seededNumber(`${event}:${round}:${b}`),
  );

  const matches:CoachMastersMatch[]=[];

  for(let index=0;index<sorted.length;index+=2) {
    if(!sorted[index+1])continue;

    matches.push(
      createMatch(
        `${eventPrefix}-${round.toLowerCase().replaceAll(" ","-")}-${prefix}-${index/2+1}`,
        "Swiss",
        round,
        3,
        sorted[index],
        sorted[index+1],
      ),
    );
  }

  return matches;
}

function createPlayoffBracket(event:CoachMastersEvent,qualifiers:CoachMastersQualifier[],swissQualified:string[]):CoachMastersMatch[] {
  const prefix=getEventPrefix(event);

  const topSeeds=qualifiers
    .filter(team=>team.seed===1)
    .sort((a,b)=>a.circuit.localeCompare(b.circuit));

  const orderedSwiss=[...swissQualified].sort(
    (a,b)=>
      seededNumber(`${event}:playoff:${a}`)-
      seededNumber(`${event}:playoff:${b}`),
  );

  const matches:CoachMastersMatch[]=[];

  for(let index=0;index<4;index++) {
    matches.push(
      createMatch(
        `${prefix}-uqf-${index+1}`,
        "Playoffs",
        "Upper Quarterfinal",
        3,
        topSeeds[index]?.teamId??null,
        orderedSwiss[index]??null,
      ),
    );
  }

  matches.push(
    createMatch(`${prefix}-usf-1`,"Playoffs","Upper Semifinal",3,null,null),
    createMatch(`${prefix}-usf-2`,"Playoffs","Upper Semifinal",3,null,null),
    createMatch(`${prefix}-uf`,"Playoffs","Upper Final",3,null,null),
    createMatch(`${prefix}-lr1-1`,"Playoffs","Lower Round 1",3,null,null),
    createMatch(`${prefix}-lr1-2`,"Playoffs","Lower Round 1",3,null,null),
    createMatch(`${prefix}-lr2-1`,"Playoffs","Lower Round 2",3,null,null),
    createMatch(`${prefix}-lr2-2`,"Playoffs","Lower Round 2",3,null,null),
    createMatch(`${prefix}-lr3`,"Playoffs","Lower Round 3",3,null,null),
    createMatch(`${prefix}-lf`,"Playoffs","Lower Final",5,null,null),
    createMatch(`${prefix}-gf`,"Playoffs","Grand Final",5,null,null),
  );

  return matches;
}

function updatePlayoffs(state:CoachMastersState):CoachMastersState {
  if(state.phase!=="Playoffs")return state;

  const prefix=getEventPrefix(state.event);
  let matches=[...state.matches];

  matches=setMatchTeams(
    matches,
    `${prefix}-usf-1`,
    getWinner(matches,`${prefix}-uqf-1`),
    getWinner(matches,`${prefix}-uqf-2`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-usf-2`,
    getWinner(matches,`${prefix}-uqf-3`),
    getWinner(matches,`${prefix}-uqf-4`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr1-1`,
    getLoser(matches,`${prefix}-uqf-1`),
    getLoser(matches,`${prefix}-uqf-2`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr1-2`,
    getLoser(matches,`${prefix}-uqf-3`),
    getLoser(matches,`${prefix}-uqf-4`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-uf`,
    getWinner(matches,`${prefix}-usf-1`),
    getWinner(matches,`${prefix}-usf-2`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr2-1`,
    getWinner(matches,`${prefix}-lr1-1`),
    getLoser(matches,`${prefix}-usf-1`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr2-2`,
    getWinner(matches,`${prefix}-lr1-2`),
    getLoser(matches,`${prefix}-usf-2`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr3`,
    getWinner(matches,`${prefix}-lr2-1`),
    getWinner(matches,`${prefix}-lr2-2`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lf`,
    getWinner(matches,`${prefix}-lr3`),
    getLoser(matches,`${prefix}-uf`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-gf`,
    getWinner(matches,`${prefix}-uf`),
    getWinner(matches,`${prefix}-lf`),
  );

  let updated={...state,matches};
  const grandFinal=getMatch(matches,`${prefix}-gf`);

  if(grandFinal?.status==="Complete") {
    updated=assignPlayoffPlacements(updated);

    return {
      ...updated,
      phase:"Complete",
      complete:true,
    };
  }

  return updated;
}

function completeMastersMatch(state:CoachMastersState,matchId:string,winnerId:string,scoreA:number,scoreB:number):CoachMastersState {
  const matches=state.matches.map(match=>{
    if(match.id!==matchId||!match.teamAId||!match.teamBId)return match;

    const loserId=winnerId===match.teamAId?match.teamBId:match.teamAId;

    return {
      ...match,
      winnerId,
      loserId,
      scoreA,
      scoreB,
      status:"Complete" as const,
    };
  });

  return {...state,matches};
}

function setMatchTeams(matches:CoachMastersMatch[],id:string,teamAId:string|null,teamBId:string|null) {
  return matches.map(match=>{
    if(match.id!==id||match.status==="Complete")return match;

    const nextA=match.teamAId??teamAId;
    const nextB=match.teamBId??teamBId;

    return {
      ...match,
      teamAId:nextA,
      teamBId:nextB,
      status:nextA&&nextB?"Ready" as const:"Pending" as const,
    };
  });
}

function assignSwissPlacements(state:CoachMastersState):CoachMastersState {
  const placementByTeam={...state.placementByTeam};

  const round3Losers=state.swissStandings
    .filter(team=>team.wins===1&&team.losses===2)
    .map(team=>team.teamId)
    .sort(
      (a,b)=>
        seededNumber(`${state.event}:placement:${a}`)-
        seededNumber(`${state.event}:placement:${b}`),
    );

  const zeroTwo=state.swissStandings
    .filter(team=>team.wins===0&&team.losses===2)
    .map(team=>team.teamId)
    .sort(
      (a,b)=>
        seededNumber(`${state.event}:placement:${a}`)-
        seededNumber(`${state.event}:placement:${b}`),
    );

  if(round3Losers[0])placementByTeam[round3Losers[0]]=9;
  if(round3Losers[1])placementByTeam[round3Losers[1]]=10;

  if(zeroTwo[0])placementByTeam[zeroTwo[0]]=11;
  if(zeroTwo[1])placementByTeam[zeroTwo[1]]=12;

  return {...state,placementByTeam};
}

function assignPlayoffPlacements(state:CoachMastersState):CoachMastersState {
  const placementByTeam={...state.placementByTeam};
  const prefix=getEventPrefix(state.event);

  const grandFinal=getMatch(state.matches,`${prefix}-gf`);
  const lowerFinal=getMatch(state.matches,`${prefix}-lf`);
  const lowerRound3=getMatch(state.matches,`${prefix}-lr3`);
  const lowerRound2A=getMatch(state.matches,`${prefix}-lr2-1`);
  const lowerRound2B=getMatch(state.matches,`${prefix}-lr2-2`);
  const lowerRound1A=getMatch(state.matches,`${prefix}-lr1-1`);
  const lowerRound1B=getMatch(state.matches,`${prefix}-lr1-2`);

  if(grandFinal?.winnerId)placementByTeam[grandFinal.winnerId]=1;
  if(grandFinal?.loserId)placementByTeam[grandFinal.loserId]=2;
  if(lowerFinal?.loserId)placementByTeam[lowerFinal.loserId]=3;
  if(lowerRound3?.loserId)placementByTeam[lowerRound3.loserId]=4;

  if(lowerRound2A?.loserId)placementByTeam[lowerRound2A.loserId]=5;
  if(lowerRound2B?.loserId)placementByTeam[lowerRound2B.loserId]=6;

  if(lowerRound1A?.loserId)placementByTeam[lowerRound1A.loserId]=7;
  if(lowerRound1B?.loserId)placementByTeam[lowerRound1B.loserId]=8;

  return {...state,placementByTeam};
}

function createMastersQualifiers(career:CoachCareerState,event:CoachMastersEvent):CoachMastersQualifier[] {
  const qualifiers:CoachMastersQualifier[]=[];
  const circuits=getTier1Circuits();

  for(const circuit of circuits) {
    const realRegionalQualifiers=getCareerRegionalQualifiers(career,event,circuit);

    if(realRegionalQualifiers.length===3) {
      realRegionalQualifiers.forEach((teamId,index)=>{
        qualifiers.push({
          teamId,
          circuit,
          seed:(index+1) as 1|2|3,
        });
      });

      continue;
    }

    const simulated=getCPURegionalQualifiers(
      career,
      circuit,
      event,
    );

    simulated.forEach((team,index)=>{
      qualifiers.push({
        teamId:team.id,
        circuit,
        seed:(index+1) as 1|2|3,
      });
    });
  }

  return qualifiers;
}

function getCareerRegionalQualifiers(career:CoachCareerState,event:CoachMastersEvent,circuit:CompetitiveCircuit) {
  if(circuit!==career.coach.circuit)return [];

  if(event==="Masters 1") {
    const kickoff=career.seasonState?.kickoffBracket;

    if(!kickoff?.complete)return [];

    return TEAMS
      .filter(team=>team.tier===1&&team.circuit===circuit)
      .map(team=>({
        teamId:team.id,
        placement:getKickoffPlacement(kickoff,team.id),
      }))
      .filter(item=>item.placement>=1&&item.placement<=3)
      .sort((a,b)=>a.placement-b.placement)
      .map(item=>item.teamId);
  }

  const stage1=career.seasonState?.stage1;

  if(!stage1?.complete)return [];

  return TEAMS
    .filter(team=>team.tier===1&&team.circuit===circuit)
    .map(team=>({
      teamId:team.id,
      placement:getStage1Placement(stage1,team.id),
    }))
    .filter(item=>item.placement>=1&&item.placement<=3)
    .sort((a,b)=>a.placement-b.placement)
    .map(item=>item.teamId);
}

function getCPURegionalQualifiers(career:CoachCareerState,circuit:CompetitiveCircuit,event:CoachMastersEvent) {
  const strengths=getCoachCompetitiveStrengthTable(career);

  return TEAMS
    .filter(team=>team.tier===1&&team.circuit===circuit)
    .sort((a,b)=>{
      const scoreA=getStoredCompetitiveStrength(strengths,a.id)+getMatchVariance(`${career.coach.season}:${event}:${a.id}:qual`);
      const scoreB=getStoredCompetitiveStrength(strengths,b.id)+getMatchVariance(`${career.coach.season}:${event}:${b.id}:qual`);

      return scoreB-scoreA;
    })
    .slice(0,3);
}

function getTier1Circuits():CompetitiveCircuit[] {
  return Array.from(
    new Set(
      TEAMS
        .filter(team=>team.tier===1)
        .map(team=>team.circuit)
        .filter((circuit):circuit is CompetitiveCircuit=>Boolean(circuit)),
    ),
  );
}

function createMatch(id:string,stage:CoachMastersMatch["stage"],round:string,bestOf:3|5,teamAId:string|null,teamBId:string|null):CoachMastersMatch {
  return {
    id,
    stage,
    round,
    bestOf,
    teamAId,
    teamBId,
    scoreA:null,
    scoreB:null,
    winnerId:null,
    loserId:null,
    status:teamAId&&teamBId?"Ready":"Pending",
  };
}

function getCPUWinner(state:CoachMastersState,match:CoachMastersMatch) {
  if(!match.teamAId||!match.teamBId)return "";

  const strengthA=getStoredCompetitiveStrength(state.competitiveStrengthByTeam,match.teamAId);
  const strengthB=getStoredCompetitiveStrength(state.competitiveStrengthByTeam,match.teamBId);

  const varianceA=getMatchVariance(`${state.event}:${match.id}:${match.teamAId}`);
  const varianceB=getMatchVariance(`${state.event}:${match.id}:${match.teamBId}`);

  return strengthA+varianceA>=strengthB+varianceB
    ?match.teamAId
    :match.teamBId;
}

function getWinner(matches:CoachMastersMatch[],id:string) {
  return getMatch(matches,id)?.winnerId??null;
}

function getLoser(matches:CoachMastersMatch[],id:string) {
  return getMatch(matches,id)?.loserId??null;
}

function getMatch(matches:CoachMastersMatch[],id:string) {
  return matches.find(match=>match.id===id);
}

function getEventPrefix(event:CoachMastersEvent) {
  return event==="Masters 1"?"masters1":"masters2";
}

function seededNumber(value:string) {
  let hash=2166136261;

  for(let index=0;index<value.length;index++) {
    hash^=value.charCodeAt(index);
    hash=Math.imul(hash,16777619);
  }

  return hash>>>0;
}
function getMatchVariance(value:string) {
  return (seededNumber(value)%801)/100-4;
}