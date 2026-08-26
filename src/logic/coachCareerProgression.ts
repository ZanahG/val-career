import type {CoachCareerHistory,CoachCareerState,CoachOffseasonState,CoachPlayer} from "../types/coach";
import {getTeamById,TEAMS} from "../data/teams";

export function finishCoachSeason(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  if(!season||season.phase!=="Complete")return career;

  const alreadyFinished=career.coach.careerHistory.some(entry=>entry.season===season.season&&entry.teamId===career.team.teamId);
  if(alreadyFinished)return career;

  const team=getTeamById(career.team.teamId);
  const matches=Object.values(season.events).flatMap(event=>event.matches);
  const wins=matches.filter(match=>match.won).length;
  const losses=matches.filter(match=>!match.won).length;
  const trophies=getCoachSeasonTrophies(career);
  const placement=getCoachSeasonPlacement(career);
  const reputationGain=getCoachSeasonReputationGain(career);

  const historyEntry:CoachCareerHistory={
    season:season.season,
    teamId:career.team.teamId,
    teamName:team?.name??career.team.teamId,
    stage:"VCT",
    wins,
    losses,
    placement,
    trophies,
  };

  return {
    ...career,
    coach:{
      ...career.coach,
      reputation:Math.min(100,career.coach.reputation+reputationGain),
      trophies:mergeUnique(career.coach.trophies,trophies),
      careerHistory:[...career.coach.careerHistory,historyEntry],
    },
  };
}

export function beginCoachOffseason(career:CoachCareerState):CoachCareerState {
  const finished=finishCoachSeason(career);
  const season=finished.seasonState;

  if(!season||season.phase!=="Complete")return career;
  if(finished.offseason)return finished;

  const roster=finished.team.roster.map(player=>progressCoachPlayer(normalizeContract(player)));
  const playerPool=finished.playerPool.map(player=>progressCoachPlayer(normalizeContract(player)));

  const updatedRoster:CoachPlayer[]=[];
  const departures:CoachOffseasonState["departures"]=[];
  const freeAgentIds:string[]=[];

  for(const player of roster){
    const remaining=Math.max(0,(player.contractSeasonsRemaining??1)-1);

    if(remaining===0){
      departures.push({
        playerId:player.id,
        playerName:player.ign,
        previousTeamId:finished.team.teamId,
        reason:"Contract Expired",
      });

      freeAgentIds.push(player.id);

      continue;
    }

    updatedRoster.push({
      ...player,
      age:player.age+1,
      contractSeasonsRemaining:remaining,
    });
  }

  const rosterIds=new Set(roster.map(player=>player.id));

  const updatedPool=playerPool.map(player=>{
    if(rosterIds.has(player.id)){
      const remaining=Math.max(0,(player.contractSeasonsRemaining??1)-1);

      return {
        ...player,
        teamId:remaining===0?"free-agent":player.teamId,
        starter:remaining===0?false:player.starter,
        age:player.age+1,
        contractSeasonsRemaining:remaining,
      };
    }

    const remaining=Math.max(0,(player.contractSeasonsRemaining??2)-1);

    return {
      ...player,
      teamId:remaining===0?"free-agent":player.teamId,
      starter:remaining===0?false:player.starter,
      age:player.age+1,
      contractSeasonsRemaining:remaining,
    };
  });

  const allFreeAgentIds=Array.from(
    new Set([
      ...freeAgentIds,
      ...updatedPool
        .filter(player=>player.teamId==="free-agent")
        .map(player=>player.id),
    ]),
  );

  const payroll=updatedRoster.reduce((total,player)=>total+player.salary,0);

  return {
    ...finished,
    team:{
      ...finished.team,
      roster:updatedRoster,
      finances:{
        ...finished.team.finances,
        currentMonthlyPayroll:payroll,
      },
    },
    playerPool:updatedPool,
    offseason:{
      season:season.season,
      phase:"Contracts",
      departures,
      renewals:[],
      transfers:[],
      freeAgentIds:allFreeAgentIds,
      completed:false,
    },
  };
}

export function renewCoachPlayerContract(career:CoachCareerState,playerId:string,seasons:number,salary:number):CoachCareerState {
  const offseason=career.offseason;
  if(!offseason||offseason.completed)return career;

  const sourcePlayer=career.playerPool.find(player=>player.id===playerId)||career.team.roster.find(player=>player.id===playerId);
  if(!sourcePlayer)return career;

  const renewed:CoachPlayer={
    ...sourcePlayer,
    teamId:career.team.teamId,
    salary,
    contractSeasonsRemaining:seasons,
    starter:career.team.roster.length<5?true:sourcePlayer.starter,
  };

  const rosterWithout=career.team.roster.filter(player=>player.id!==playerId);
  const nextRoster=[...rosterWithout,renewed];
  const nextPool=career.playerPool.map(player=>player.id===playerId?renewed:player);
  const payroll=nextRoster.reduce((total,player)=>total+player.salary,0);
  
  if(payroll>career.team.finances.monthlyBudget)return career;

  return {
    ...career,
    team:{
      ...career.team,
      roster:nextRoster,
      finances:{
        ...career.team.finances,
        currentMonthlyPayroll:payroll,
      },
    },
    playerPool:nextPool,
    offseason:{
      ...offseason,
      renewals:[
        ...offseason.renewals.filter(item=>item.playerId!==playerId),
        {playerId,playerName:renewed.ign,seasons,salary},
      ],
      freeAgentIds:offseason.freeAgentIds.filter(id=>id!==playerId),
    },
  };
}

export function releaseCoachPlayer(career:CoachCareerState,playerId:string):CoachCareerState {
  const offseason=career.offseason;
  if(!offseason||offseason.completed)return career;

  const player=career.team.roster.find(item=>item.id===playerId);
  if(!player)return career;

  const roster=career.team.roster.filter(item=>item.id!==playerId);
  const playerPool=career.playerPool.map(item=>item.id===playerId?{...item,teamId:"free-agent",starter:false,contractSeasonsRemaining:0}:item);

  return {
    ...career,
    team:{
      ...career.team,
      roster,
      finances:{
        ...career.team.finances,
        currentMonthlyPayroll:roster.reduce((total,item)=>total+item.salary,0),
      },
    },
    playerPool,
    offseason:{
      ...offseason,
      departures:[
        ...offseason.departures,
        {playerId:player.id,playerName:player.ign,previousTeamId:career.team.teamId,reason:"Released"},
      ],
      freeAgentIds:Array.from(new Set([...offseason.freeAgentIds,playerId])),
    },
  };
}

export function openCoachOffseasonMarket(career:CoachCareerState):CoachCareerState {
  if(!career.offseason||career.offseason.completed)return career;

  return {
    ...career,
    offseason:{
      ...career.offseason,
      phase:"Market",
    },
  };
}

export function simulateCoachCPUOffseason(career:CoachCareerState):CoachCareerState {
  const offseason=career.offseason;
  if(!offseason||offseason.completed)return career;

  const playerTeamId=career.team.teamId;
  const cpuTeamIds=getCoachTier1TeamIds().filter(teamId=>teamId!==playerTeamId);

  let playerPool=[...career.playerPool];
  const transfers=[...offseason.transfers];

  /*
   * PASO 1:
   * Si algún equipo CPU tiene más de 5 jugadores,
   * libera primero a sus jugadores más débiles.
   */
  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length<=5)continue;

    const releases=[...roster]
      .sort((a,b)=>a.overall-b.overall)
      .slice(0,roster.length-5);

    for(const player of releases){
      playerPool=movePlayer(
        playerPool,
        player.id,
        "free-agent",
        0,
      );

      transfers.push({
        playerId:player.id,
        playerName:player.ign,
        fromTeamId:teamId,
        toTeamId:"free-agent",
        salary:0,
      });
    }
  }

  /*
   * PASO 2:
   * Algunos equipos intentan mejorar un jugador
   * mediante transferencia desde otro club CPU.
   */
  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length<5)continue;

    const weakest=[...roster].sort((a,b)=>a.overall-b.overall)[0];
    if(!weakest)continue;

    const shouldUpgrade=
      deterministicNumber(
        `${teamId}-${career.coach.season}-upgrade`,
      )%100<42;

    if(!shouldUpgrade)continue;

    const candidates=playerPool
      .filter(player=>
        player.teamId!==teamId&&
        player.teamId!==playerTeamId&&
        player.teamId!=="free-agent"&&
        player.overall>=weakest.overall+3&&
        (player.contractSeasonsRemaining??0)>0&&
        getCPURoster(playerPool,player.teamId).length>=5
      )
      .sort((a,b)=>{
        if(b.overall!==a.overall)return b.overall-a.overall;
        return a.id.localeCompare(b.id);
      });

    if(!candidates.length)continue;

    const candidateIndex=
      deterministicNumber(
        `${teamId}-${career.coach.season}-target`,
      )%Math.min(candidates.length,5);

    const target=candidates[candidateIndex];
    if(!target)continue;

    const previousTeamId=target.teamId;

    /*
     * No desarmamos equipos que ya tengan solo 5.
     * Deben tener al menos 6 para vender directamente.
     */
    const sellerRoster=getCPURoster(playerPool,previousTeamId);
    if(sellerRoster.length<5)continue;

    const newSalary=getCPUContractSalary(target);

    playerPool=movePlayer(
      playerPool,
      target.id,
      teamId,
      newSalary,
      getCPUContractLength(target,career.coach.season),
    );

    playerPool=movePlayer(
      playerPool,
      weakest.id,
      "free-agent",
      0,
    );

    transfers.push({
      playerId:target.id,
      playerName:target.ign,
      fromTeamId:previousTeamId,
      toTeamId:teamId,
      salary:newSalary,
    });

    transfers.push({
      playerId:weakest.id,
      playerName:weakest.ign,
      fromTeamId:teamId,
      toTeamId:"free-agent",
      salary:0,
    });
  }

  /*
   * PASO 3:
   * Todos los clubes CPU con menos de cinco jugadores
   * fichan agentes libres.
   */
  for(const teamId of cpuTeamIds){
    for(let guard=0;guard<10;guard++){
      const roster=getCPURoster(playerPool,teamId);

      if(roster.length>=5)break;

      const freeAgents=playerPool
        .filter(player=>
          player.teamId==="free-agent"&&
          !career.team.roster.some(current=>current.id===player.id)
        );

      if(!freeAgents.length)break;

      const desiredRole=getMostNeededRole(roster);

      const roleCandidates=freeAgents.filter(player=>player.role===desiredRole);

      const candidates=(roleCandidates.length?roleCandidates:freeAgents)
        .sort((a,b)=>{
          if(b.overall!==a.overall)return b.overall-a.overall;

          const scoreA=deterministicNumber(`${teamId}-${a.id}`);
          const scoreB=deterministicNumber(`${teamId}-${b.id}`);

          return scoreB-scoreA;
        });

      const player=candidates[0];
      if(!player)break;

      const salary=getCPUContractSalary(player);
      const seasons=getCPUContractLength(player,career.coach.season);

      playerPool=movePlayer(
        playerPool,
        player.id,
        teamId,
        salary,
        seasons,
      );

      transfers.push({
        playerId:player.id,
        playerName:player.ign,
        fromTeamId:"free-agent",
        toTeamId:teamId,
        salary,
      });
    }
  }

  /*
   * PASO 4:
   * Ajustar starters de todos los equipos CPU.
   * Los cinco mejores quedan titulares.
   */
  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId)
      .sort((a,b)=>b.overall-a.overall);

    const starterIds=new Set(
      roster.slice(0,5).map(player=>player.id),
    );

    playerPool=playerPool.map(player=>
      player.teamId===teamId
        ?{
            ...player,
            starter:starterIds.has(player.id),
          }
        :player
    );
  }

  const freeAgentIds=playerPool
    .filter(player=>player.teamId==="free-agent")
    .map(player=>player.id);

  return {
    ...career,
    playerPool,
    offseason:{
      ...offseason,
      transfers,
      freeAgentIds,
    },
  };
}

export function completeCoachOffseason(career:CoachCareerState):CoachCareerState {
  const offseason=career.offseason;
  if(!offseason||offseason.completed)return career;

  const simulated=simulateCoachCPUOffseason(career);

  return {
    ...simulated,
    offseason:{
      ...simulated.offseason!,
      phase:"Complete",
      completed:true,
    },
  };
}

export function startNextCoachSeason(career:CoachCareerState):CoachCareerState {
  const offseason=career.offseason;
  const season=career.seasonState;

  if(!season||season.phase!=="Complete")return career;
  if(!offseason?.completed)return career;

  return {
    ...career,
    coach:{
      ...career.coach,
      season:career.coach.season+1,
      age:career.coach.age+1,
    },
    team:{
      ...career.team,
      chemistry:Math.max(35,career.team.chemistry-5),
      form:50,
    },
    seasonState:null,
    offseason:null,
  };
}

export function isCoachSeasonFinished(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season||season.phase!=="Complete")return false;

  return career.coach.careerHistory.some(entry=>entry.season===season.season&&entry.teamId===career.team.teamId);
}

export function getCoachSeasonTrophies(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season)return [];

  const trophies:string[]=[];

  if(season.events.Kickoff.placement===1)trophies.push(`${season.season} VCT ${season.circuit} Kickoff Champion`);
  if(season.events["Masters 1"].placement===1)trophies.push(`${season.season} Masters 1 Champion`);
  if(season.events["Stage 1 Playoffs"].placement===1)trophies.push(`${season.season} VCT ${season.circuit} Stage 1 Champion`);
  if(season.events["Masters 2"].placement===1)trophies.push(`${season.season} Masters 2 Champion`);
  if(season.events["Stage 2 Playoffs"].placement===1)trophies.push(`${season.season} VCT ${season.circuit} Stage 2 Champion`);
  if(season.events.Champions.placement===1)trophies.push(`${season.season} Valorant Champions Winner`);

  return trophies;
}

function getCoachSeasonPlacement(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season)return 0;

  if(season.events.Champions.placement!==undefined)return season.events.Champions.placement;
  if(season.events["Stage 2 Playoffs"].placement!==undefined)return season.events["Stage 2 Playoffs"].placement;

  return 0;
}

function getCoachSeasonReputationGain(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season)return 0;

  let gain=2;

  const trophies=getCoachSeasonTrophies(career);
  gain+=trophies.length*3;

  const placement=season.events.Champions.placement;

  if(placement===1)gain+=10;
  else if(placement===2)gain+=7;
  else if(placement===3)gain+=5;
  else if(placement!==undefined&&placement<=8)gain+=3;

  return gain;
}

function normalizeContract(player:CoachPlayer):CoachPlayer {
  return {
    ...player,
    contractSeasonsRemaining:player.contractSeasonsRemaining??2,
  };
}

function getCoachTier1TeamIds() {
  return TEAMS
    .filter(team=>team.tier===1)
    .map(team=>team.id);
}

function getCPURoster(playerPool:CoachPlayer[],teamId:string) {
  return playerPool.filter(player=>player.teamId===teamId);
}

function movePlayer(
  playerPool:CoachPlayer[],
  playerId:string,
  teamId:string,
  salary:number,
  contractSeasonsRemaining?:number,
) {
  return playerPool.map(player=>{
    if(player.id!==playerId)return player;

    return {
      ...player,
      teamId,
      salary:teamId==="free-agent"?player.salary:salary,
      starter:false,
      contractSeasonsRemaining:
        teamId==="free-agent"
          ?0
          :contractSeasonsRemaining??player.contractSeasonsRemaining??2,
    };
  });
}

function getCPUContractSalary(player:CoachPlayer) {
  const base=
    player.overall>=90?22000:
    player.overall>=87?18000:
    player.overall>=84?14500:
    player.overall>=80?11000:
    8000;

  const variance=
    deterministicNumber(`${player.id}-salary`)%2500;

  return Math.round((base+variance)/100)*100;
}

function getCPUContractLength(player:CoachPlayer,season:number) {
  return 1+(deterministicNumber(`${player.id}-${season}-contract`)%3);
}

function progressCoachPlayer(player:CoachPlayer):CoachPlayer {
  const development=
    player.age<=20?2:
    player.age<=23?1:
    player.age<=28?0:
    player.age<=31?-1:
    -2;

  if(development===0)return player;

  const variance=
    deterministicNumber(`${player.id}-${player.age}-development`)%3-1;

  const change=Math.max(-2,Math.min(2,development+variance));

  return {
    ...player,
    overall:clamp(player.overall+change,55,99),
    stats:{
      ...player.stats,
      aim:clamp(player.stats.aim+change,40,99),
      gameSense:clamp(player.stats.gameSense+(change>0?1:change),40,99),
      communication:clamp(player.stats.communication+(change>0?1:0),40,99),
      clutch:clamp(player.stats.clutch+change,40,99),
      consistency:clamp(player.stats.consistency+(change>0?1:change),40,99),
      mental:clamp(player.stats.mental+(change<0?-1:0),40,99),
    },
  };
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}

function getMostNeededRole(roster:CoachPlayer[]):CoachPlayer["role"] {
  const roles:CoachPlayer["role"][]=["Duelist","Initiator","Controller","Sentinel","Flex"];

  return [...roles].sort((a,b)=>{
    const countA=roster.filter(player=>player.role===a).length;
    const countB=roster.filter(player=>player.role===b).length;

    if(countA!==countB)return countA-countB;

    return a.localeCompare(b);
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

function mergeUnique(current:string[],incoming:string[]) {
  return Array.from(new Set([...current,...incoming]));
}