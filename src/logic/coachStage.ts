import type {CoachCareerState,CoachStage1Match,CoachStage1Standing,CoachStageEvent,CoachStageState} from "../types/coach";
import {getCoachCompetitiveStrengthTable,getStoredCompetitiveStrength} from "./coachTeamStrength";
import {TEAMS} from "../data/teams";

export function createCoachStage(career:CoachCareerState,event:CoachStageEvent):CoachStageState {
  const competitiveStrengthByTeam=getCoachCompetitiveStrengthTable(career);

  const teams=TEAMS
    .filter(team=>team.tier===1&&team.circuit===career.coach.circuit)
    .sort((a,b)=>{
      const strengthA=getStoredCompetitiveStrength(competitiveStrengthByTeam,a.id);
      const strengthB=getStoredCompetitiveStrength(competitiveStrengthByTeam,b.id);

      const varianceA=getStageVariance(`${career.coach.season}:${event}:${a.id}:seed`);
      const varianceB=getStageVariance(`${career.coach.season}:${event}:${b.id}:seed`);

      return (strengthB+varianceB)-(strengthA+varianceA);
    });

  const alpha=teams.filter((_,index)=>index%2===0).map(team=>team.id);
  const omega=teams.filter((_,index)=>index%2===1).map(team=>team.id);

  const standings:CoachStage1Standing[]=[
    ...alpha.map(teamId=>createStanding(teamId,"Alpha")),
    ...omega.map(teamId=>createStanding(teamId,"Omega")),
  ];

  const matches=[
    ...createRoundRobin(event,alpha,"Alpha"),
    ...createRoundRobin(event,omega,"Omega"),
  ];

  const state:CoachStageState={
    event,
    playerTeamId:career.team.teamId,
    phase:"Regular Season",
    groups:{Alpha:alpha,Omega:omega},
    standings,
    matches,
    playoffSeeds:[],
    placementByTeam:{},
    complete:false,
    competitiveStrengthByTeam,
  };

  return advanceStageCPU(state);
}

export function createCoachStage1(career:CoachCareerState) {
  return createCoachStage(career,"Stage 1");
}

export function createCoachStage2(career:CoachCareerState) {
  return createCoachStage(career,"Stage 2");
}

export function getNextPlayerStageMatch(state:CoachStageState) {
  return state.matches.find(match=>
    match.status==="Ready"&&
    (match.teamAId===state.playerTeamId||match.teamBId===state.playerTeamId),
  );
}

export function getNextPlayerStage1Match(state:CoachStageState) {
  return getNextPlayerStageMatch(state);
}

export function playPlayerStageMatchWithScore(state:CoachStageState,playerWon:boolean,playerMapsWon:number,playerMapsLost:number) {
  const match=getNextPlayerStageMatch(state);

  if(!match||!match.teamAId||!match.teamBId)return state;

  const playerIsA=match.teamAId===state.playerTeamId;
  const winnerId=playerWon?state.playerTeamId:playerIsA?match.teamBId:match.teamAId;
  const scoreA=playerIsA?playerMapsWon:playerMapsLost;
  const scoreB=playerIsA?playerMapsLost:playerMapsWon;

  let updated=completeStageMatch(state,match.id,winnerId,scoreA,scoreB);
  updated=updateStage(updated);

  return advanceStageCPU(updated);
}

export function playPlayerStage1MatchWithScore(state:CoachStageState,playerWon:boolean,playerMapsWon:number,playerMapsLost:number) {
  return playPlayerStageMatchWithScore(state,playerWon,playerMapsWon,playerMapsLost);
}

export function getStagePlacement(state:CoachStageState,teamId:string) {
  return state.placementByTeam[teamId]??13;
}

export function getStage1Placement(state:CoachStageState,teamId:string) {
  return getStagePlacement(state,teamId);
}

export function getStagePlayerRecord(state:CoachStageState) {
  const matches=state.matches.filter(match=>
    match.status==="Complete"&&
    (match.teamAId===state.playerTeamId||match.teamBId===state.playerTeamId),
  );

  return {
    wins:matches.filter(match=>match.winnerId===state.playerTeamId).length,
    losses:matches.filter(match=>match.loserId===state.playerTeamId).length,
  };
}

export function getStage1PlayerRecord(state:CoachStageState) {
  return getStagePlayerRecord(state);
}

export function advanceStageCPU(initial:CoachStageState):CoachStageState {
  let state=updateStage(initial);

  for(let guard=0;guard<150;guard++) {
    if(state.complete)return state;

    const playerMatch=getNextPlayerStageMatch(state);
    if(playerMatch)return state;

    const cpuMatch=state.matches.find(match=>
      match.status==="Ready"&&
      match.teamAId!==state.playerTeamId&&
      match.teamBId!==state.playerTeamId,
    );

    if(!cpuMatch)return updateStage(state);
    if(!cpuMatch.teamAId||!cpuMatch.teamBId)return state;

    const winnerId=getCPUWinner(state,cpuMatch);
    const required=Math.ceil(cpuMatch.bestOf/2);
    const loserMaps=seededNumber(`${state.event}:${cpuMatch.id}:score`)%required;

    state=completeStageMatch(
      state,
      cpuMatch.id,
      winnerId,
      winnerId===cpuMatch.teamAId?required:loserMaps,
      winnerId===cpuMatch.teamBId?required:loserMaps,
    );

    state=updateStage(state);
  }

  return state;
}

export function advanceStage1CPU(initial:CoachStageState) {
  return advanceStageCPU(initial);
}

function updateStage(state:CoachStageState):CoachStageState {
  if(state.complete)return state;

  if(state.phase==="Regular Season")return updateRegularSeason(state);
  if(state.phase==="Playoffs")return updatePlayoffs(state);

  return state;
}

function updateRegularSeason(state:CoachStageState):CoachStageState {
  let updated=refreshStandings(state);

  const regularMatches=updated.matches.filter(match=>match.phase==="Regular Season");

  if(!regularMatches.length||!regularMatches.every(match=>match.status==="Complete"))return updated;

  const alpha=getOrderedGroup(updated,"Alpha");
  const omega=getOrderedGroup(updated,"Omega");

  const qualified=[...alpha.slice(0,4),...omega.slice(0,4)];
  const eliminated=[...alpha.slice(4),...omega.slice(4)];

  const globalSeeds=[...qualified].sort((a,b)=>compareStanding(updated,a,b));
  const placementByTeam={...updated.placementByTeam};

  eliminated.forEach((teamId,index)=>{
    placementByTeam[teamId]=9+index;
  });

  updated={
    ...updated,
    phase:"Playoffs",
    playoffSeeds:globalSeeds,
    placementByTeam,
    standings:updated.standings.map(standing=>({
      ...standing,
      qualified:qualified.includes(standing.teamId),
      eliminated:eliminated.includes(standing.teamId),
    })),
    matches:[
      ...updated.matches,
      ...createPlayoffBracket(updated.event,globalSeeds),
    ],
  };

  return updatePlayoffs(updated);
}

function updatePlayoffs(state:CoachStageState):CoachStageState {
  if(state.phase!=="Playoffs")return state;

  const prefix=getEventPrefix(state.event);
  let matches=[...state.matches];

  matches=setMatchTeams(
    matches,
    `${prefix}-uqf-1`,
    state.playoffSeeds[2]??null,
    state.playoffSeeds[5]??null,
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-uqf-2`,
    state.playoffSeeds[3]??null,
    state.playoffSeeds[4]??null,
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-usf-1`,
    state.playoffSeeds[0]??null,
    getWinner(matches,`${prefix}-uqf-2`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-usf-2`,
    state.playoffSeeds[1]??null,
    getWinner(matches,`${prefix}-uqf-1`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr1-1`,
    state.playoffSeeds[6]??null,
    getLoser(matches,`${prefix}-uqf-1`),
  );

  matches=setMatchTeams(
    matches,
    `${prefix}-lr1-2`,
    state.playoffSeeds[7]??null,
    getLoser(matches,`${prefix}-uqf-2`),
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

function refreshStandings(state:CoachStageState):CoachStageState {
  const standings=state.standings.map(standing=>{
    let wins=0;
    let losses=0;
    let mapsWon=0;
    let mapsLost=0;

    for(const match of state.matches) {
      if(match.phase!=="Regular Season"||match.status!=="Complete")continue;
      if(match.teamAId!==standing.teamId&&match.teamBId!==standing.teamId)continue;

      const isA=match.teamAId===standing.teamId;
      const ownScore=isA?match.scoreA??0:match.scoreB??0;
      const enemyScore=isA?match.scoreB??0:match.scoreA??0;

      mapsWon+=ownScore;
      mapsLost+=enemyScore;

      if(match.winnerId===standing.teamId)wins++;
      else losses++;
    }

    return {...standing,wins,losses,mapsWon,mapsLost};
  });

  return {...state,standings};
}

function getOrderedGroup(state:CoachStageState,group:"Alpha"|"Omega") {
  return state.standings
    .filter(standing=>standing.group===group)
    .sort((a,b)=>{
      if(b.wins!==a.wins)return b.wins-a.wins;

      const diffA=a.mapsWon-a.mapsLost;
      const diffB=b.mapsWon-b.mapsLost;

      if(diffB!==diffA)return diffB-diffA;
      return b.mapsWon-a.mapsWon;
    })
    .map(standing=>standing.teamId);
}

function compareStanding(state:CoachStageState,aId:string,bId:string) {
  const a=state.standings.find(standing=>standing.teamId===aId);
  const b=state.standings.find(standing=>standing.teamId===bId);

  if(!a||!b)return 0;
  if(b.wins!==a.wins)return b.wins-a.wins;

  const diffA=a.mapsWon-a.mapsLost;
  const diffB=b.mapsWon-b.mapsLost;

  if(diffB!==diffA)return diffB-diffA;
  return b.mapsWon-a.mapsWon;
}

function createRoundRobin(event:CoachStageEvent,teamIds:string[],group:"Alpha"|"Omega"):CoachStage1Match[] {
  const teams=[...teamIds];
  const rounds:CoachStage1Match[]=[];
  const prefix=getEventPrefix(event);

  if(teams.length%2!==0)teams.push("");

  const totalRounds=teams.length-1;
  const half=teams.length/2;

  for(let round=0;round<totalRounds;round++) {
    for(let index=0;index<half;index++) {
      const teamAId=teams[index];
      const teamBId=teams[teams.length-1-index];

      if(teamAId&&teamBId) {
        rounds.push(
          createMatch(
            `${prefix}-${group.toLowerCase()}-r${round+1}-m${index+1}`,
            "Regular Season",
            `Week ${round+1}`,
            3,
            teamAId,
            teamBId,
            group,
          ),
        );
      }
    }

    const fixed=teams[0];
    const rotating=teams.slice(1);

    rotating.unshift(rotating.pop()!);
    teams.splice(0,teams.length,fixed,...rotating);
  }

  return rounds;
}

function createPlayoffBracket(event:CoachStageEvent,seeds:string[]):CoachStage1Match[] {
  const prefix=getEventPrefix(event);

  return [
    createMatch(`${prefix}-uqf-1`,"Playoffs","Upper Round 1",3,seeds[2]??null,seeds[5]??null),
    createMatch(`${prefix}-uqf-2`,"Playoffs","Upper Round 1",3,seeds[3]??null,seeds[4]??null),

    createMatch(`${prefix}-usf-1`,"Playoffs","Upper Semifinal",3,seeds[0]??null,null),
    createMatch(`${prefix}-usf-2`,"Playoffs","Upper Semifinal",3,seeds[1]??null,null),

    createMatch(`${prefix}-lr1-1`,"Playoffs","Lower Round 1",3,seeds[6]??null,null),
    createMatch(`${prefix}-lr1-2`,"Playoffs","Lower Round 1",3,seeds[7]??null,null),

    createMatch(`${prefix}-uf`,"Playoffs","Upper Final",3,null,null),

    createMatch(`${prefix}-lr2-1`,"Playoffs","Lower Round 2",3,null,null),
    createMatch(`${prefix}-lr2-2`,"Playoffs","Lower Round 2",3,null,null),

    createMatch(`${prefix}-lr3`,"Playoffs","Lower Round 3",3,null,null),
    createMatch(`${prefix}-lf`,"Playoffs","Lower Final",5,null,null),
    createMatch(`${prefix}-gf`,"Playoffs","Grand Final",5,null,null),
  ];
}

function assignPlayoffPlacements(state:CoachStageState):CoachStageState {
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

function completeStageMatch(state:CoachStageState,matchId:string,winnerId:string,scoreA:number,scoreB:number):CoachStageState {
  return {
    ...state,
    matches:state.matches.map(match=>{
      if(match.id!==matchId||!match.teamAId||!match.teamBId)return match;

      return {
        ...match,
        scoreA,
        scoreB,
        winnerId,
        loserId:winnerId===match.teamAId?match.teamBId:match.teamAId,
        status:"Complete" as const,
      };
    }),
  };
}

function setMatchTeams(matches:CoachStage1Match[],id:string,teamAId:string|null,teamBId:string|null) {
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

function createStanding(teamId:string,group:"Alpha"|"Omega"):CoachStage1Standing {
  return {
    teamId,
    group,
    wins:0,
    losses:0,
    mapsWon:0,
    mapsLost:0,
    qualified:false,
    eliminated:false,
  };
}

function createMatch(id:string,phase:CoachStage1Match["phase"],round:string,bestOf:3|5,teamAId:string|null,teamBId:string|null,group?:CoachStage1Match["group"]):CoachStage1Match {
  return {
    id,
    phase,
    group,
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

function getCPUWinner(state:CoachStageState,match:CoachStage1Match) {
  if(!match.teamAId||!match.teamBId)return "";

  const strengthA=getStoredCompetitiveStrength(state.competitiveStrengthByTeam,match.teamAId);
  const strengthB=getStoredCompetitiveStrength(state.competitiveStrengthByTeam,match.teamBId);

  const varianceA=getStageVariance(`${state.event}:${match.id}:${match.teamAId}`);
  const varianceB=getStageVariance(`${state.event}:${match.id}:${match.teamBId}`);

  return strengthA+varianceA>=strengthB+varianceB
    ?match.teamAId
    :match.teamBId;
}

function getWinner(matches:CoachStage1Match[],id:string) {
  return getMatch(matches,id)?.winnerId??null;
}

function getLoser(matches:CoachStage1Match[],id:string) {
  return getMatch(matches,id)?.loserId??null;
}

function getMatch(matches:CoachStage1Match[],id:string) {
  return matches.find(match=>match.id===id);
}

function getEventPrefix(event:CoachStageEvent) {
  return event==="Stage 1"?"stage1":"stage2";
}

function seededNumber(value:string) {
  let hash=2166136261;

  for(let index=0;index<value.length;index++) {
    hash^=value.charCodeAt(index);
    hash=Math.imul(hash,16777619);
  }

  return hash>>>0;
}
function getStageVariance(value:string) {
  return (seededNumber(value)%801)/100-4;
}