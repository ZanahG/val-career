import type {
  CoachCareerState,
  CoachChampionsGroup,
  CoachChampionsGroupStanding,
  CoachChampionsMatch,
  CoachChampionsQualifier,
  CoachChampionsState,
} from "../types/coach";
import {getCoachCompetitiveStrengthTable,getStoredCompetitiveStrength} from "./coachTeamStrength";
import type {CompetitiveCircuit} from "../types/career";
import {TEAMS} from "../data/teams";
import {getStagePlacement} from "./coachStage";

const GROUPS:CoachChampionsGroup[]=["A","B","C","D"];

export function createCoachChampions(career:CoachCareerState):CoachChampionsState {
  const competitiveStrengthByTeam=getCoachCompetitiveStrengthTable(career);
  const qualifiers=createChampionsQualifiers(career,competitiveStrengthByTeam);
  const groups=createChampionsGroups(qualifiers);

  const groupStandings:CoachChampionsGroupStanding[]=GROUPS.flatMap(group=>
    groups[group].map(teamId=>({
      teamId,
      group,
      wins:0,
      losses:0,
      mapsWon:0,
      mapsLost:0,
      qualified:false,
      eliminated:false,
    })),
  );

  const matches:CoachChampionsMatch[]=GROUPS.flatMap(group=>createInitialGroupMatches(group,groups[group]));

  return advanceChampionsCPU({
    playerTeamId:career.team.teamId,
    phase:"Groups",
    qualifiers,
    groups,
    groupStandings,
    matches,
    playoffQualifiedIds:[],
    placementByTeam:{},
    championTeamId:null,
    competitiveStrengthByTeam,
    complete:false,
  });
}

export function getNextPlayerChampionsMatch(state:CoachChampionsState) {
  return state.matches.find(match=>
    match.status==="Ready"&&
    (match.teamAId===state.playerTeamId||match.teamBId===state.playerTeamId)
  );
}

export function playPlayerChampionsMatchWithScore(
  state:CoachChampionsState,
  playerWon:boolean,
  playerMapsWon:number,
  playerMapsLost:number,
):CoachChampionsState {
  const match=getNextPlayerChampionsMatch(state);
  if(!match)return state;

  const playerIsA=match.teamAId===state.playerTeamId;
  const opponentId=playerIsA?match.teamBId:match.teamAId;

  if(!opponentId)return state;

  const winnerId=playerWon?state.playerTeamId:opponentId;
  const loserId=playerWon?opponentId:state.playerTeamId;

  const scoreA=playerIsA?playerMapsWon:playerMapsLost;
  const scoreB=playerIsA?playerMapsLost:playerMapsWon;

  return advanceChampionsCPU(
    resolveChampionsMatch(
      state,
      match.id,
      winnerId,
      loserId,
      scoreA,
      scoreB,
    ),
  );
}

export function getChampionsPlacement(state:CoachChampionsState,teamId:string) {
  return state.placementByTeam[teamId]??(
    state.championTeamId===teamId
      ?1
      :state.playoffQualifiedIds.includes(teamId)
        ?8
        :16
  );
}

export function getChampionsPlayerRecord(state:CoachChampionsState) {
  const matches=state.matches.filter(match=>
    match.status==="Complete"&&
    (match.teamAId===state.playerTeamId||match.teamBId===state.playerTeamId)
  );

  return {
    wins:matches.filter(match=>match.winnerId===state.playerTeamId).length,
    losses:matches.filter(match=>match.loserId===state.playerTeamId).length,
  };
}

export function advanceChampionsCPU(initial:CoachChampionsState):CoachChampionsState {
  let state=refreshChampionsState(initial);

  for(let guard=0;guard<500;guard++){
    if(state.complete)return state;

    const playerMatch=getNextPlayerChampionsMatch(state);
    if(playerMatch)return state;

    const cpuMatch=state.matches.find(match=>
      match.status==="Ready"&&
      match.teamAId!==state.playerTeamId&&
      match.teamBId!==state.playerTeamId
    );

    if(cpuMatch&&cpuMatch.teamAId&&cpuMatch.teamBId){
      const result=simulateCPUScore(state,cpuMatch);
      state=resolveChampionsMatch(
        state,
        cpuMatch.id,
        result.winnerId,
        result.loserId,
        result.scoreA,
        result.scoreB,
      );
      state=refreshChampionsState(state);
      continue;
    }

    const refreshed=refreshChampionsState(state);

    if(JSON.stringify(refreshed)===JSON.stringify(state))break;

    state=refreshed;
  }

  return state;
}

/* =========================================================
   QUALIFICATION
========================================================= */

function createChampionsQualifiers(
  career:CoachCareerState,
  competitiveStrengthByTeam:Record<string,number>,
):CoachChampionsQualifier[] {
  const circuits=getTier1Circuits();

  return circuits.flatMap((circuit,circuitIndex)=>{
    const regionalTeams=TEAMS.filter(team=>team.tier===1&&team.circuit===circuit);
    const isPlayerCircuit=circuit===career.coach.circuit;

    const stage2Ranking=isPlayerCircuit
      ?getRealStage2Ranking(
        career,
        regionalTeams.map(team=>team.id),
        circuitIndex,
        competitiveStrengthByTeam,
      )
      :getSimulatedRegionalRanking(
        regionalTeams.map(team=>team.id),
        career.coach.season,
        circuitIndex,
        competitiveStrengthByTeam,
      );

    const directIds=stage2Ranking.slice(0,2);

    const pointRanking=isPlayerCircuit
      ?getRealChampionshipPointRanking(career,regionalTeams.map(team=>team.id),directIds)
      :getSimulatedPointsRanking(
        regionalTeams.map(team=>team.id),
        directIds,
        career.coach.season,
        circuitIndex,
        competitiveStrengthByTeam,
      );

    const pointsTable=isPlayerCircuit
      ?career.seasonState?.championshipPointsByTeam??{}
      :createSimulatedPointsTable(
        regionalTeams.map(team=>team.id),
        career.coach.season,
        circuitIndex,
        competitiveStrengthByTeam,
      );

    const qualifiers:CoachChampionsQualifier[]=[];

    if(directIds[0]){
      qualifiers.push({
        teamId:directIds[0],
        circuit,
        seed:1,
        qualificationMethod:"Stage 2",
        championshipPoints:pointsTable[directIds[0]]??0,
      });
    }

    if(directIds[1]){
      qualifiers.push({
        teamId:directIds[1],
        circuit,
        seed:2,
        qualificationMethod:"Stage 2",
        championshipPoints:pointsTable[directIds[1]]??0,
      });
    }

    if(pointRanking[0]){
      qualifiers.push({
        teamId:pointRanking[0],
        circuit,
        seed:3,
        qualificationMethod:"Championship Points",
        championshipPoints:pointsTable[pointRanking[0]]??0,
      });
    }

    if(pointRanking[1]){
      qualifiers.push({
        teamId:pointRanking[1],
        circuit,
        seed:4,
        qualificationMethod:"Championship Points",
        championshipPoints:pointsTable[pointRanking[1]]??0,
      });
    }

    return qualifiers;
  });
}

function getRealStage2Ranking(
  career:CoachCareerState,
  teamIds:string[],
  circuitIndex:number,
  strengths:Record<string,number>,
) {
  const stage=career.seasonState?.stage2;

  if(!stage){
    return getSimulatedRegionalRanking(
      teamIds,
      career.coach.season,
      circuitIndex,
      strengths,
    );
  }

  return [...teamIds].sort((a,b)=>{
    const placementA=getStagePlacement(stage,a);
    const placementB=getStagePlacement(stage,b);

    if(placementA!==placementB)return placementA-placementB;

    return a.localeCompare(b);
  });
}

function getRealChampionshipPointRanking(career:CoachCareerState,teamIds:string[],excludedIds:string[]) {
  const points=career.seasonState?.championshipPointsByTeam??{};
  const excluded=new Set(excludedIds);

  return teamIds
    .filter(teamId=>!excluded.has(teamId))
    .sort((a,b)=>{
      const pointsA=points[a]??0;
      const pointsB=points[b]??0;

      if(pointsB!==pointsA)return pointsB-pointsA;

      return a.localeCompare(b);
    });
}

function getSimulatedRegionalRanking(
  teamIds:string[],
  season:number,
  circuitIndex:number,
  strengths:Record<string,number>,
) {
  return [...teamIds].sort((a,b)=>{
    const scoreA=
      getStoredCompetitiveStrength(strengths,a)+
      getChampionsVariance(`${season}:${circuitIndex}:${a}:stage2`);

    const scoreB=
      getStoredCompetitiveStrength(strengths,b)+
      getChampionsVariance(`${season}:${circuitIndex}:${b}:stage2`);

    if(scoreB!==scoreA)return scoreB-scoreA;

    return a.localeCompare(b);
  });
}

function getSimulatedPointsRanking(
  teamIds:string[],
  excludedIds:string[],
  season:number,
  circuitIndex:number,
  strengths:Record<string,number>,
) {
  const excluded=new Set(excludedIds);
  const points=createSimulatedPointsTable(teamIds,season,circuitIndex,strengths);

  return teamIds
    .filter(teamId=>!excluded.has(teamId))
    .sort((a,b)=>{
      if(points[b]!==points[a])return points[b]-points[a];
      return a.localeCompare(b);
    });
}

function createSimulatedPointsTable(
  teamIds:string[],
  season:number,
  circuitIndex:number,
  strengths:Record<string,number>,
) {
  return Object.fromEntries(
    teamIds.map(teamId=>{
      const strength=getStoredCompetitiveStrength(strengths,teamId);
      const variance=getChampionsVariance(`${season}:${circuitIndex}:${teamId}:points`);

      const points=Math.round(
        Math.max(4,Math.min(28,(strength-65)*.7+10+variance)),
      );

      return [teamId,points];
    }),
  );
}

/* =========================================================
   GROUP DRAW
========================================================= */

function createChampionsGroups(qualifiers:CoachChampionsQualifier[]) {
  const groups:{A:string[];B:string[];C:string[];D:string[]}={A:[],B:[],C:[],D:[]};
  const circuits=getTier1Circuits();

  if(circuits.length===4){
    const byCircuit=new Map(
      circuits.map(circuit=>[
        circuit,
        qualifiers
          .filter(qualifier=>qualifier.circuit===circuit)
          .sort((a,b)=>a.seed-b.seed),
      ]),
    );

    const matrix=[
      [0,1,2,3],
      [1,2,3,0],
      [2,3,0,1],
      [3,0,1,2],
    ];

    GROUPS.forEach((group,groupIndex)=>{
      groups[group]=matrix[groupIndex]
        .map((seedIndex,circuitIndex)=>byCircuit.get(circuits[circuitIndex])?.[seedIndex]?.teamId)
        .filter((teamId):teamId is string=>Boolean(teamId));
    });

    if(GROUPS.every(group=>groups[group].length===4))return groups;
  }

  const ordered=[...qualifiers].sort((a,b)=>{
    if(a.seed!==b.seed)return a.seed-b.seed;
    return a.circuit.localeCompare(b.circuit);
  });

  ordered.forEach((qualifier,index)=>{
    groups[GROUPS[index%4]].push(qualifier.teamId);
  });

  return groups;
}

/* =========================================================
   GROUP STAGE
========================================================= */

function createInitialGroupMatches(group:CoachChampionsGroup,teamIds:string[]):CoachChampionsMatch[] {
  return [
    createMatch(
      `champions-group-${group.toLowerCase()}-opening-1`,
      "Groups",
      `Group ${group} Opening Match 1`,
      3,
      teamIds[0]??null,
      teamIds[3]??null,
      group,
    ),
    createMatch(
      `champions-group-${group.toLowerCase()}-opening-2`,
      "Groups",
      `Group ${group} Opening Match 2`,
      3,
      teamIds[1]??null,
      teamIds[2]??null,
      group,
    ),
    createMatch(
      `champions-group-${group.toLowerCase()}-winners`,
      "Groups",
      `Group ${group} Winners Match`,
      3,
      null,
      null,
      group,
    ),
    createMatch(
      `champions-group-${group.toLowerCase()}-elimination`,
      "Groups",
      `Group ${group} Elimination Match`,
      3,
      null,
      null,
      group,
    ),
    createMatch(
      `champions-group-${group.toLowerCase()}-decider`,
      "Groups",
      `Group ${group} Decider Match`,
      3,
      null,
      null,
      group,
    ),
  ];
}

function refreshGroupStage(state:CoachChampionsState):CoachChampionsState {
  let matches=[...state.matches];

  for(const group of GROUPS){
    const opening1=getMatch(matches,`champions-group-${group.toLowerCase()}-opening-1`);
    const opening2=getMatch(matches,`champions-group-${group.toLowerCase()}-opening-2`);
    const winners=getMatch(matches,`champions-group-${group.toLowerCase()}-winners`);
    const elimination=getMatch(matches,`champions-group-${group.toLowerCase()}-elimination`);
    const decider=getMatch(matches,`champions-group-${group.toLowerCase()}-decider`);

    if(
      opening1?.status==="Complete"&&
      opening2?.status==="Complete"
    ){
      matches=updatePendingMatch(
        matches,
        winners?.id,
        opening1.winnerId,
        opening2.winnerId,
      );

      matches=updatePendingMatch(
        matches,
        elimination?.id,
        opening1.loserId,
        opening2.loserId,
      );
    }

    const refreshedWinners=getMatch(matches,`champions-group-${group.toLowerCase()}-winners`);
    const refreshedElimination=getMatch(matches,`champions-group-${group.toLowerCase()}-elimination`);

    if(
      refreshedWinners?.status==="Complete"&&
      refreshedElimination?.status==="Complete"
    ){
      matches=updatePendingMatch(
        matches,
        decider?.id,
        refreshedWinners.loserId,
        refreshedElimination.winnerId,
      );
    }
  }

  const standings=calculateGroupStandings(
    state.groupStandings,
    matches,
  );

  const allGroupsComplete=GROUPS.every(group=>{
    const decider=getMatch(matches,`champions-group-${group.toLowerCase()}-decider`);
    return decider?.status==="Complete";
  });

  if(!allGroupsComplete){
    return {
      ...state,
      matches,
      groupStandings:standings,
    };
  }

  const playoffQualifiedIds=GROUPS.flatMap(group=>{
    const winners=getMatch(matches,`champions-group-${group.toLowerCase()}-winners`);
    const decider=getMatch(matches,`champions-group-${group.toLowerCase()}-decider`);

    return [
      winners?.winnerId,
      decider?.winnerId,
    ].filter((teamId):teamId is string=>Boolean(teamId));
  });

  const finalStandings=standings.map(standing=>({
    ...standing,
    qualified:playoffQualifiedIds.includes(standing.teamId),
    eliminated:!playoffQualifiedIds.includes(standing.teamId),
  }));

  const placementByTeam={...state.placementByTeam};

  for(const standing of finalStandings){
    if(!standing.qualified){
      placementByTeam[standing.teamId]=
        getGroupExitPlacement(finalStandings,standing.teamId);
    }
  }

  return {
    ...state,
    phase:"Playoffs",
    matches:[
      ...matches,
      ...createChampionsPlayoffMatches(
        getGroupPlayoffSeeds(matches),
      ),
    ],
    groupStandings:finalStandings,
    playoffQualifiedIds,
    placementByTeam,
  };
}

function calculateGroupStandings(initial:CoachChampionsGroupStanding[],matches:CoachChampionsMatch[]) {
  const standings=initial.map(standing=>({
    ...standing,
    wins:0,
    losses:0,
    mapsWon:0,
    mapsLost:0,
    qualified:false,
    eliminated:false,
  }));

  for(const match of matches){
    if(
      match.stage!=="Groups"||
      match.status!=="Complete"||
      !match.teamAId||
      !match.teamBId||
      match.scoreA===null||
      match.scoreB===null
    )continue;

    const a=standings.find(standing=>standing.teamId===match.teamAId);
    const b=standings.find(standing=>standing.teamId===match.teamBId);

    if(a){
      a.mapsWon+=match.scoreA;
      a.mapsLost+=match.scoreB;

      if(match.winnerId===a.teamId)a.wins++;
      else a.losses++;
    }

    if(b){
      b.mapsWon+=match.scoreB;
      b.mapsLost+=match.scoreA;

      if(match.winnerId===b.teamId)b.wins++;
      else b.losses++;
    }
  }

  return standings;
}

function getGroupPlayoffSeeds(matches:CoachChampionsMatch[]) {
  return Object.fromEntries(
    GROUPS.map(group=>{
      const winners=getMatch(matches,`champions-group-${group.toLowerCase()}-winners`);
      const decider=getMatch(matches,`champions-group-${group.toLowerCase()}-decider`);

      return [
        group,
        {
          first:winners?.winnerId??null,
          second:decider?.winnerId??null,
        },
      ];
    }),
  ) as Record<CoachChampionsGroup,{first:string|null;second:string|null}>;
}

function getGroupExitPlacement(standings:CoachChampionsGroupStanding[],teamId:string) {
  const standing=standings.find(item=>item.teamId===teamId);
  if(!standing)return 16;

  const groupStandings=standings
    .filter(item=>item.group===standing.group&&!item.qualified)
    .sort(compareGroupStanding);

  const index=groupStandings.findIndex(item=>item.teamId===teamId);

  return index===0?9:13;
}

function compareGroupStanding(a:CoachChampionsGroupStanding,b:CoachChampionsGroupStanding) {
  if(b.wins!==a.wins)return b.wins-a.wins;

  const diffA=a.mapsWon-a.mapsLost;
  const diffB=b.mapsWon-b.mapsLost;

  if(diffB!==diffA)return diffB-diffA;
  if(b.mapsWon!==a.mapsWon)return b.mapsWon-a.mapsWon;

  return a.teamId.localeCompare(b.teamId);
}

/* =========================================================
   PLAYOFFS
========================================================= */

function createChampionsPlayoffMatches(
  seeds:Record<CoachChampionsGroup,{first:string|null;second:string|null}>,
):CoachChampionsMatch[] {
  return [
    createMatch("champions-uqf-1","Playoffs","Upper Quarterfinal",3,seeds.A.first,seeds.D.second),
    createMatch("champions-uqf-2","Playoffs","Upper Quarterfinal",3,seeds.B.first,seeds.C.second),
    createMatch("champions-uqf-3","Playoffs","Upper Quarterfinal",3,seeds.C.first,seeds.B.second),
    createMatch("champions-uqf-4","Playoffs","Upper Quarterfinal",3,seeds.D.first,seeds.A.second),

    createMatch("champions-usf-1","Playoffs","Upper Semifinal",3,null,null),
    createMatch("champions-usf-2","Playoffs","Upper Semifinal",3,null,null),
    createMatch("champions-uf","Playoffs","Upper Final",3,null,null),

    createMatch("champions-lr1-1","Playoffs","Lower Round 1",3,null,null),
    createMatch("champions-lr1-2","Playoffs","Lower Round 1",3,null,null),

    createMatch("champions-lr2-1","Playoffs","Lower Round 2",3,null,null),
    createMatch("champions-lr2-2","Playoffs","Lower Round 2",3,null,null),

    createMatch("champions-lr3","Playoffs","Lower Round 3",3,null,null),
    createMatch("champions-lf","Playoffs","Lower Final",5,null,null),
    createMatch("champions-gf","Playoffs","Grand Final",5,null,null),
  ];
}

function refreshPlayoffs(state:CoachChampionsState):CoachChampionsState {
  let matches=[...state.matches];

  const uqf1=getMatch(matches,"champions-uqf-1");
  const uqf2=getMatch(matches,"champions-uqf-2");
  const uqf3=getMatch(matches,"champions-uqf-3");
  const uqf4=getMatch(matches,"champions-uqf-4");

  if(uqf1?.status==="Complete"&&uqf2?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-usf-1",uqf1.winnerId,uqf2.winnerId);
    matches=updatePendingMatch(matches,"champions-lr1-1",uqf1.loserId,uqf2.loserId);
  }

  if(uqf3?.status==="Complete"&&uqf4?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-usf-2",uqf3.winnerId,uqf4.winnerId);
    matches=updatePendingMatch(matches,"champions-lr1-2",uqf3.loserId,uqf4.loserId);
  }

  const usf1=getMatch(matches,"champions-usf-1");
  const usf2=getMatch(matches,"champions-usf-2");
  const lr11=getMatch(matches,"champions-lr1-1");
  const lr12=getMatch(matches,"champions-lr1-2");

  if(usf1?.status==="Complete"&&usf2?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-uf",usf1.winnerId,usf2.winnerId);
  }

  if(lr11?.status==="Complete"&&usf1?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-lr2-1",lr11.winnerId,usf1.loserId);
  }

  if(lr12?.status==="Complete"&&usf2?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-lr2-2",lr12.winnerId,usf2.loserId);
  }

  const lr21=getMatch(matches,"champions-lr2-1");
  const lr22=getMatch(matches,"champions-lr2-2");

  if(lr21?.status==="Complete"&&lr22?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-lr3",lr21.winnerId,lr22.winnerId);
  }

  const uf=getMatch(matches,"champions-uf");
  const lr3=getMatch(matches,"champions-lr3");

  if(uf?.status==="Complete"&&lr3?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-lf",lr3.winnerId,uf.loserId);
  }

  const lf=getMatch(matches,"champions-lf");

  if(uf?.status==="Complete"&&lf?.status==="Complete"){
    matches=updatePendingMatch(matches,"champions-gf",uf.winnerId,lf.winnerId);
  }

  const gf=getMatch(matches,"champions-gf");

  if(gf?.status!=="Complete"){
    return {
      ...state,
      matches,
    };
  }

  const placementByTeam=createFinalPlayoffPlacements(
    state.placementByTeam,
    matches,
  );

  return {
    ...state,
    phase:"Complete",
    matches,
    placementByTeam,
    championTeamId:gf.winnerId,
    complete:true,
  };
}

function createFinalPlayoffPlacements(initial:Record<string,number>,matches:CoachChampionsMatch[]) {
  const placements={...initial};

  const gf=getMatch(matches,"champions-gf");
  const lf=getMatch(matches,"champions-lf");
  const lr3=getMatch(matches,"champions-lr3");
  const lr21=getMatch(matches,"champions-lr2-1");
  const lr22=getMatch(matches,"champions-lr2-2");
  const lr11=getMatch(matches,"champions-lr1-1");
  const lr12=getMatch(matches,"champions-lr1-2");

  if(gf?.winnerId)placements[gf.winnerId]=1;
  if(gf?.loserId)placements[gf.loserId]=2;
  if(lf?.loserId)placements[lf.loserId]=3;
  if(lr3?.loserId)placements[lr3.loserId]=4;
  if(lr21?.loserId)placements[lr21.loserId]=5;
  if(lr22?.loserId)placements[lr22.loserId]=6;
  if(lr11?.loserId)placements[lr11.loserId]=7;
  if(lr12?.loserId)placements[lr12.loserId]=8;

  return placements;
}

/* =========================================================
   MATCH RESOLUTION
========================================================= */

function resolveChampionsMatch(
  state:CoachChampionsState,
  matchId:string,
  winnerId:string,
  loserId:string,
  scoreA:number,
  scoreB:number,
):CoachChampionsState {
  const matches=state.matches.map(match=>
    match.id===matchId
      ?{
          ...match,
          scoreA,
          scoreB,
          winnerId,
          loserId,
          status:"Complete" as const,
        }
      :match
  );

  return refreshChampionsState({
    ...state,
    matches,
  });
}

function refreshChampionsState(state:CoachChampionsState):CoachChampionsState {
  if(state.complete)return state;

  if(state.phase==="Groups"){
    return refreshGroupStage(state);
  }

  if(state.phase==="Playoffs"){
    return refreshPlayoffs(state);
  }

  return state;
}

function updatePendingMatch(
  matches:CoachChampionsMatch[],
  matchId:string|undefined,
  teamAId:string|null,
  teamBId:string|null,
) {
  if(!matchId||!teamAId||!teamBId)return matches;

  return matches.map(match=>{
    if(match.id!==matchId||match.status==="Complete")return match;

    return {
      ...match,
      teamAId,
      teamBId,
      status:"Ready" as const,
    };
  });
}

/* =========================================================
   CPU
========================================================= */

function simulateCPUScore(state:CoachChampionsState,match:CoachChampionsMatch) {
  const teamAId=match.teamAId!;
  const teamBId=match.teamBId!;

  const strengthA=getStoredCompetitiveStrength(state.competitiveStrengthByTeam,teamAId);
  const strengthB=getStoredCompetitiveStrength(state.competitiveStrengthByTeam,teamBId);

  const varianceA=getChampionsVariance(`${match.id}:${teamAId}`);
  const varianceB=getChampionsVariance(`${match.id}:${teamBId}`);

  const teamAWins=strengthA+varianceA>=strengthB+varianceB;
  const winsNeeded=match.bestOf===5?3:2;

  const loserMaps=
    seededNumber(`${match.id}:score:${teamAId}:${teamBId}`)%winsNeeded;

  const scoreA=teamAWins?winsNeeded:loserMaps;
  const scoreB=teamAWins?loserMaps:winsNeeded;

  return {
    winnerId:teamAWins?teamAId:teamBId,
    loserId:teamAWins?teamBId:teamAId,
    scoreA,
    scoreB,
  };
}

/* =========================================================
   HELPERS
========================================================= */

function createMatch(
  id:string,
  stage:"Groups"|"Playoffs",
  round:string,
  bestOf:3|5,
  teamAId:string|null,
  teamBId:string|null,
  group?:CoachChampionsGroup,
):CoachChampionsMatch {
  return {
    id,
    stage,
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

function getMatch(matches:CoachChampionsMatch[],id:string) {
  return matches.find(match=>match.id===id);
}

function getTier1Circuits():CompetitiveCircuit[] {
  return Array.from(
    new Set(
      TEAMS
        .filter(team=>team.tier===1&&team.circuit)
        .map(team=>team.circuit),
    ),
  ) as CompetitiveCircuit[];
}

function hashString(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}

function getChampionsVariance(value:string) {
  return (seededNumber(value)%801)/100-4;
}

function seededNumber(value:string) {
  return hashString(value);
}