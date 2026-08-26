import type {CoachCareerHistory,CoachCareerState,CoachOffseasonState,CoachPlayer} from "../types/coach";
import {createCoachRookieClass} from "./coachRoster";
import {getCoachPlayerMarketValue} from "./coachPlayerValue";
import {getCoachMinimumAcceptedTransferFee,willCoachClubAcceptTransfer} from "./coachTransferEconomy";
import {renewCoachTeamFinances} from "../data/coachBudgets";
import {generateCoachTransferRequests} from "./coachTransferRequests";
import {chooseBestCoachContractOffer,chooseBestCoachTransferOffer,getCoachMostNeededRole,getCoachTransferTargetScore,negotiateCoachPlayerSalary,type CoachContractOffer,type CoachTransferOffer} from "./coachTransferAI";
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
    stage:career.coach.stage,
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

  const retiringIds=new Set(
    finished.playerPool
      .filter(player=>shouldRetireCoachPlayer(player,season.season))
      .map(player=>player.id),
  );

  const retiredFromTeam=finished.team.roster.filter(player=>retiringIds.has(player.id));

  const roster=finished.team.roster
    .filter(player=>!retiringIds.has(player.id))
    .map(player=>progressCoachPlayer(normalizeContract(player)));

  const progressedPlayerPool=finished.playerPool
    .filter(player=>!retiringIds.has(player.id))
    .map(player=>progressCoachPlayer(normalizeContract(player)));

  const rookieSeason=season.season+1;
  const rookies=createCoachRookieClass(rookieSeason);
  const playerPool=[...progressedPlayerPool,...rookies];

  const updatedRoster:CoachPlayer[]=[];
  const departures:CoachOffseasonState["departures"]=retiredFromTeam.map(player=>({
    playerId:player.id,
    playerName:player.ign,
    previousTeamId:finished.team.teamId,
    reason:"Retired",
  }));
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

    const updatedPlayer:CoachPlayer={
      ...player,
      age:player.age+1,
      contractSeasonsRemaining:remaining,
    };

    updatedRoster.push(refreshCoachPlayerMarketValue(updatedPlayer));
  }

  const rosterIds=new Set(roster.map(player=>player.id));

  const updatedPool=playerPool.map(player=>{
    if(player.id.startsWith(`rookie-${rookieSeason}-`))return player;

    if(rosterIds.has(player.id)){
      const remaining=Math.max(0,(player.contractSeasonsRemaining??1)-1);

      const updatedPlayer:CoachPlayer={
        ...player,
        teamId:remaining===0?"free-agent":player.teamId,
        starter:remaining===0?false:player.starter,
        age:player.age+1,
        contractSeasonsRemaining:remaining,
      };

      return refreshCoachPlayerMarketValue(updatedPlayer);
    }

    const remaining=Math.max(0,(player.contractSeasonsRemaining??2)-1);

    const updatedPlayer:CoachPlayer={
      ...player,
      teamId:remaining===0?"free-agent":player.teamId,
      starter:remaining===0?false:player.starter,
      age:player.age+1,
      contractSeasonsRemaining:remaining,
    };

    return refreshCoachPlayerMarketValue(updatedPlayer);
  });

  const allFreeAgentIds=Array.from(
    new Set([
      ...freeAgentIds,
      ...updatedPool.filter(player=>player.teamId==="free-agent").map(player=>player.id),
    ]),
  );

  const payroll=updatedRoster.reduce((total,player)=>total+player.salary,0);

  const userTeam=getTeamById(finished.team.teamId);

  const renewedTeamFinances=userTeam
    ?renewCoachTeamFinances(userTeam,finished.team.finances,payroll)
    :{
      ...finished.team.finances,
      currentMonthlyPayroll:payroll,
    };

  const renewedCPUFinances=renewCoachCPUFinances(
    finished.cpuFinancesByTeam,
    updatedPool,
  );

  return {
    ...finished,
    team:{
      ...finished.team,
      roster:updatedRoster,
      finances:renewedTeamFinances,
    },
    playerPool:updatedPool,
    cpuFinancesByTeam:renewedCPUFinances,
    offseason:{
      season:season.season,
      phase:"Contracts",
      departures,
      renewals:[],
      transfers:[],
      transferRequests:[],
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

  const refreshedRenewed=refreshCoachPlayerMarketValue(renewed);
  const rosterWithout=career.team.roster.filter(player=>player.id!==playerId);
  const nextRoster=[...rosterWithout,refreshedRenewed];
  const nextPool=career.playerPool.map(player=>player.id===playerId?refreshedRenewed:player);
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
        {playerId,playerName:refreshedRenewed.ign,seasons,salary},
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

  const playerPool=career.playerPool.map(item=>{
    if(item.id!==playerId)return item;

    const released:CoachPlayer={
      ...item,
      teamId:"free-agent",
      starter:false,
      contractSeasonsRemaining:0,
    };

    return refreshCoachPlayerMarketValue(released);
  });

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

  const transferRequests=generateCoachTransferRequests(
    career.playerPool,
    career.coach.season,
    career.team.teamId,
  );

  return {
    ...career,
    offseason:{
      ...career.offseason,
      phase:"Market",
      transferRequests,
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
  let cpuFinancesByTeam={...career.cpuFinancesByTeam};
  const transferRequestIds=new Set(offseason.transferRequests.map(request=>request.playerId));
  const replacementPriorityTeams=new Map<string,CoachPlayer["role"]>();

  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length<=5)continue;

    const releases=[...roster]
      .sort((a,b)=>a.overall-b.overall)
      .slice(0,roster.length-5);

    for(const player of releases){
      playerPool=movePlayer(playerPool,player.id,"free-agent",0);
      cpuFinancesByTeam=refreshCPUFinancePayroll(cpuFinancesByTeam,playerPool,teamId);

      transfers.push({
        playerId:player.id,
        playerName:player.ign,
        fromTeamId:teamId,
        toTeamId:"free-agent",
        salary:0,
        transferFee:0,
      });
    }
  }

  const transferOffersByPlayer:Record<string,CoachTransferOffer[]>={};

  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length<5)continue;

    const weakest=[...roster].sort((a,b)=>a.overall-b.overall)[0];
    if(!weakest)continue;

    const shouldUpgrade=deterministicNumber(`${teamId}-${career.coach.season}-upgrade`)%100<42;
    if(!shouldUpgrade)continue;

    const team=getTeamById(teamId);
    const teamStrength=team?.strength??80;

    const candidates=playerPool
      .filter(player=>
        player.teamId!==teamId&&
        player.teamId!==playerTeamId&&
        player.teamId!=="free-agent"&&
        player.overall>=weakest.overall+2&&
        (player.contractSeasonsRemaining??0)>0&&
        getCPURoster(playerPool,player.teamId).length>=5
      )
      .sort((a,b)=>{
        const requestBonusA=transferRequestIds.has(a.id)?18:0;
        const requestBonusB=transferRequestIds.has(b.id)?18:0;
        const scoreA=getCoachTransferTargetScore(roster,a,teamStrength)+requestBonusA;
        const scoreB=getCoachTransferTargetScore(roster,b,teamStrength)+requestBonusB;

        if(scoreB!==scoreA)return scoreB-scoreA;

        return b.overall-a.overall;
      })
      .slice(0,4);

    for(const target of candidates){
      const sellerRoster=getCPURoster(playerPool,target.teamId);

      if(sellerRoster.length<5)continue;

      const currentTeam=getTeamById(target.teamId);
      const currentTeamStrength=currentTeam?.strength??80;
      const transferRequested=transferRequestIds.has(target.id);

      const minimumTransferFee=getCoachMinimumAcceptedTransferFee(
        target,
        sellerRoster,
        transferRequested,
      );

      const offeredTransferFee=getCPUTransferOfferFee(
        minimumTransferFee,
        teamId,
        target.id,
        career.coach.season,
        "offseason",
      );

      if(!willCoachClubAcceptTransfer(target,sellerRoster,offeredTransferFee,transferRequested))continue;

      const rosterAfterReplacement=roster.filter(player=>player.id!==weakest.id);

      const salaryNegotiation=negotiateCoachPlayerSalary(
        target,
        currentTeamStrength,
        teamStrength,
        roster,
        career.coach.season,
        salary=>canCPUAffordTransfer(cpuFinancesByTeam,teamId,offeredTransferFee,salary,rosterAfterReplacement),
      );

      if(!salaryNegotiation.accepted)continue;

      const offer:CoachTransferOffer={
        buyerTeamId:teamId,
        buyerTeamStrength:teamStrength,
        transferFee:offeredTransferFee,
        salary:salaryNegotiation.salary,
        seasons:getCPUContractLength(target,career.coach.season),
      };

      transferOffersByPlayer[target.id]=[
        ...(transferOffersByPlayer[target.id]??[]),
        offer,
      ];
    }
  }

  const contractedCandidates=Object.entries(transferOffersByPlayer)
    .map(([playerId,offers])=>({
      player:playerPool.find(player=>player.id===playerId),
      offers,
    }))
    .filter((item):item is {player:CoachPlayer;offers:CoachTransferOffer[]}=>Boolean(item.player))
    .sort((a,b)=>{
      const requestBonusA=transferRequestIds.has(a.player.id)?20:0;
      const requestBonusB=transferRequestIds.has(b.player.id)?20:0;

      return (b.player.overall+requestBonusB)-(a.player.overall+requestBonusA);
    });

  for(const {player,offers} of contractedCandidates){
    if(player.teamId==="free-agent"||player.teamId===playerTeamId)continue;

    const sellerTeamId=player.teamId;
    const sellerRoster=getCPURoster(playerPool,sellerTeamId);

    if(sellerRoster.length<5)continue;

    const transferRequested=transferRequestIds.has(player.id);

    const viableOffers=offers.filter(offer=>{
      const buyerRoster=getCPURoster(playerPool,offer.buyerTeamId);

      if(buyerRoster.length<5)return false;

      const weakest=[...buyerRoster].sort((a,b)=>a.overall-b.overall)[0];

      if(!weakest)return false;
      if(player.overall<weakest.overall+2)return false;

      const buyerRosterAfterReplacement=buyerRoster.filter(item=>item.id!==weakest.id);

      if(!willCoachClubAcceptTransfer(player,sellerRoster,offer.transferFee,transferRequested))return false;

      return canCPUAffordTransfer(
        cpuFinancesByTeam,
        offer.buyerTeamId,
        offer.transferFee,
        offer.salary,
        buyerRosterAfterReplacement,
      );
    });

    if(!viableOffers.length)continue;

    const currentRostersByTeam=Object.fromEntries(
      viableOffers.map(offer=>[
        offer.buyerTeamId,
        getCPURoster(playerPool,offer.buyerTeamId),
      ]),
    ) as Record<string,CoachPlayer[]>;

    const bestOffer=chooseBestCoachTransferOffer(player,viableOffers,currentRostersByTeam);
    if(!bestOffer)continue;

    const buyerRoster=getCPURoster(playerPool,bestOffer.buyerTeamId);
    const weakest=[...buyerRoster].sort((a,b)=>a.overall-b.overall)[0];

    if(!weakest)continue;

    const buyerRosterAfterReplacement=buyerRoster.filter(item=>item.id!==weakest.id);

    if(!canCPUAffordTransfer(
      cpuFinancesByTeam,
      bestOffer.buyerTeamId,
      bestOffer.transferFee,
      bestOffer.salary,
      buyerRosterAfterReplacement,
    ))continue;

    playerPool=movePlayer(playerPool,player.id,bestOffer.buyerTeamId,bestOffer.salary,bestOffer.seasons);
    playerPool=movePlayer(playerPool,weakest.id,"free-agent",0);

    replacementPriorityTeams.set(sellerTeamId,player.role);

    cpuFinancesByTeam=applyCPUTransferFee(
      cpuFinancesByTeam,
      bestOffer.buyerTeamId,
      sellerTeamId,
      bestOffer.transferFee,
    );

    cpuFinancesByTeam=refreshCPUFinancePayroll(
      cpuFinancesByTeam,
      playerPool,
      bestOffer.buyerTeamId,
    );

    cpuFinancesByTeam=refreshCPUFinancePayroll(
      cpuFinancesByTeam,
      playerPool,
      sellerTeamId,
    );

    transfers.push({
      playerId:player.id,
      playerName:player.ign,
      fromTeamId:sellerTeamId,
      toTeamId:bestOffer.buyerTeamId,
      salary:bestOffer.salary,
      transferFee:bestOffer.transferFee,
    });

    transfers.push({
      playerId:weakest.id,
      playerName:weakest.ign,
      fromTeamId:bestOffer.buyerTeamId,
      toTeamId:"free-agent",
      salary:0,
      transferFee:0,
    });
  }

  fillPriorityReplacements(
    playerTeamId,
    replacementPriorityTeams,
    career.coach.season,
    playerPool,
    cpuFinancesByTeam,
    transfers,
    updatedPool=>{playerPool=updatedPool;},
    updatedFinances=>{cpuFinancesByTeam=updatedFinances;},
    career.team.roster,
  );

  const freeAgentOffersByPlayer:Record<string,CoachContractOffer[]>={};

  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length>=5)continue;

    const team=getTeamById(teamId);
    const teamStrength=team?.strength??80;
    const desiredRole=getCoachMostNeededRole(roster);

    const freeAgents=playerPool.filter(player=>
      player.teamId==="free-agent"&&
      !career.team.roster.some(current=>current.id===player.id)
    );

    const roleCandidates=freeAgents.filter(player=>player.role===desiredRole);
    const candidatePool=roleCandidates.length?roleCandidates:freeAgents;

    const candidates=[...candidatePool]
      .sort((a,b)=>{
        const scoreA=getCoachTransferTargetScore(roster,a,teamStrength);
        const scoreB=getCoachTransferTargetScore(roster,b,teamStrength);

        if(scoreB!==scoreA)return scoreB-scoreA;

        return b.overall-a.overall;
      })
      .slice(0,5);

    for(const candidate of candidates){
      const salaryNegotiation=negotiateCoachPlayerSalary(
        candidate,
        70,
        teamStrength,
        roster,
        career.coach.season,
        salary=>canCPUAffordTransfer(cpuFinancesByTeam,teamId,0,salary,roster),
      );

      if(!salaryNegotiation.accepted)continue;

      const offer:CoachContractOffer={
        teamId,
        teamStrength,
        salary:salaryNegotiation.salary,
        seasons:getCPUContractLength(candidate,career.coach.season),
      };

      freeAgentOffersByPlayer[candidate.id]=[
        ...(freeAgentOffersByPlayer[candidate.id]??[]),
        offer,
      ];
    }
  }

  const freeAgentCandidates=Object.entries(freeAgentOffersByPlayer)
    .map(([playerId,offers])=>({
      player:playerPool.find(player=>player.id===playerId),
      offers,
    }))
    .filter((item):item is {player:CoachPlayer;offers:CoachContractOffer[]}=>Boolean(item.player))
    .sort((a,b)=>b.player.overall-a.player.overall);

  for(const {player,offers} of freeAgentCandidates){
    if(player.teamId!=="free-agent")continue;

    const viableOffers=offers.filter(offer=>{
      const currentRoster=getCPURoster(playerPool,offer.teamId);

      if(currentRoster.length>=5)return false;

      return canCPUAffordTransfer(
        cpuFinancesByTeam,
        offer.teamId,
        0,
        offer.salary,
        currentRoster,
      );
    });

    if(!viableOffers.length)continue;

    const currentRostersByTeam=Object.fromEntries(
      viableOffers.map(offer=>[
        offer.teamId,
        getCPURoster(playerPool,offer.teamId),
      ]),
    ) as Record<string,CoachPlayer[]>;

    const bestOffer=chooseBestCoachContractOffer(player,viableOffers,currentRostersByTeam);
    if(!bestOffer)continue;

    const currentRoster=getCPURoster(playerPool,bestOffer.teamId);

    if(currentRoster.length>=5)continue;

    if(!canCPUAffordTransfer(
      cpuFinancesByTeam,
      bestOffer.teamId,
      0,
      bestOffer.salary,
      currentRoster,
    ))continue;

    playerPool=movePlayer(
      playerPool,
      player.id,
      bestOffer.teamId,
      bestOffer.salary,
      bestOffer.seasons,
    );

    cpuFinancesByTeam=refreshCPUFinancePayroll(
      cpuFinancesByTeam,
      playerPool,
      bestOffer.teamId,
    );

    transfers.push({
      playerId:player.id,
      playerName:player.ign,
      fromTeamId:"free-agent",
      toTeamId:bestOffer.teamId,
      salary:bestOffer.salary,
      transferFee:0,
    });
  }

  for(const teamId of cpuTeamIds){
    for(let guard=0;guard<10;guard++){
      const roster=getCPURoster(playerPool,teamId);

      if(roster.length>=5)break;

      const team=getTeamById(teamId);
      const teamStrength=team?.strength??80;
      const desiredRole=getCoachMostNeededRole(roster);

      const freeAgents=playerPool.filter(player=>
        player.teamId==="free-agent"&&
        !career.team.roster.some(current=>current.id===player.id)
      );

      if(!freeAgents.length)break;

      const roleCandidates=freeAgents.filter(player=>player.role===desiredRole);
      const candidatePool=roleCandidates.length?roleCandidates:freeAgents;

      const candidates=[...candidatePool].sort((a,b)=>{
        const scoreA=getCoachTransferTargetScore(roster,a,teamStrength);
        const scoreB=getCoachTransferTargetScore(roster,b,teamStrength);

        if(scoreB!==scoreA)return scoreB-scoreA;

        return b.overall-a.overall;
      });

      let signed=false;

      for(const candidate of candidates){
        const salaryNegotiation=negotiateCoachPlayerSalary(
          candidate,
          70,
          teamStrength,
          roster,
          career.coach.season,
          salary=>canCPUAffordTransfer(cpuFinancesByTeam,teamId,0,salary,roster),
        );

        if(!salaryNegotiation.accepted)continue;

        const salary=salaryNegotiation.salary;
        const seasons=getCPUContractLength(candidate,career.coach.season);

        playerPool=movePlayer(playerPool,candidate.id,teamId,salary,seasons);
        cpuFinancesByTeam=refreshCPUFinancePayroll(cpuFinancesByTeam,playerPool,teamId);

        transfers.push({
          playerId:candidate.id,
          playerName:candidate.ign,
          fromTeamId:"free-agent",
          toTeamId:teamId,
          salary,
          transferFee:0,
        });

        signed=true;
        break;
      }

      if(!signed)break;
    }
  }

  ({playerPool,cpuFinancesByTeam}=ensureCPUMinimumRosters(
    playerTeamId,
    cpuTeamIds,
    career.coach.season,
    "offseason",
    playerPool,
    cpuFinancesByTeam,
    transfers,
    career.team.roster,
  ));

  playerPool=refreshCPUStarters(playerPool,cpuTeamIds);

  const freeAgentIds=playerPool
    .filter(player=>player.teamId==="free-agent")
    .map(player=>player.id);

  return {
    ...career,
    playerPool,
    cpuFinancesByTeam,
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

export function beginCoachMidseasonMarket(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;

  if(!season)return career;
  if(season.events["Stage 1 Playoffs"].status!=="Complete")return career;
  if(career.midseasonMarket)return career;

  const transferRequests=generateCoachTransferRequests(
    career.playerPool,
    career.coach.season,
    career.team.teamId,
  );

  const freeAgentIds=career.playerPool
    .filter(player=>player.teamId==="free-agent")
    .map(player=>player.id);

  return {
    ...career,
    midseasonMarket:{
      season:career.coach.season,
      phase:"Market",
      transfers:[],
      transferRequests,
      freeAgentIds,
      completed:false,
    },
  };
}

export function simulateCoachCPUMidseasonMarket(career:CoachCareerState):CoachCareerState {
  const market=career.midseasonMarket;
  if(!market||market.completed)return career;

  const playerTeamId=career.team.teamId;
  const cpuTeamIds=getCoachTier1TeamIds().filter(teamId=>teamId!==playerTeamId);

  let playerPool=[...career.playerPool];
  let cpuFinancesByTeam={...career.cpuFinancesByTeam};
  const transfers=[...market.transfers];
  const transferRequestIds=new Set(market.transferRequests.map(request=>request.playerId));
  const replacementPriorityTeams=new Map<string,CoachPlayer["role"]>();
  const transferOffersByPlayer:Record<string,CoachTransferOffer[]>={};

  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length<5)continue;

    const shouldUpgrade=deterministicNumber(`${teamId}-${career.coach.season}-midseason-upgrade`)%100<20;
    if(!shouldUpgrade)continue;

    const weakest=[...roster].sort((a,b)=>a.overall-b.overall)[0];
    if(!weakest)continue;

    const team=getTeamById(teamId);
    const teamStrength=team?.strength??80;

    const candidates=playerPool
      .filter(player=>
        player.teamId!==teamId&&
        player.teamId!==playerTeamId&&
        player.teamId!=="free-agent"&&
        (player.contractSeasonsRemaining??0)>0&&
        player.overall>=weakest.overall+2&&
        getCPURoster(playerPool,player.teamId).length>=5
      )
      .sort((a,b)=>{
        const requestBonusA=transferRequestIds.has(a.id)?22:0;
        const requestBonusB=transferRequestIds.has(b.id)?22:0;
        const scoreA=getCoachTransferTargetScore(roster,a,teamStrength)+requestBonusA;
        const scoreB=getCoachTransferTargetScore(roster,b,teamStrength)+requestBonusB;

        if(scoreB!==scoreA)return scoreB-scoreA;

        return b.overall-a.overall;
      })
      .slice(0,3);

    for(const target of candidates){
      const sellerRoster=getCPURoster(playerPool,target.teamId);

      if(sellerRoster.length<5)continue;

      const currentTeam=getTeamById(target.teamId);
      const currentTeamStrength=currentTeam?.strength??80;
      const transferRequested=transferRequestIds.has(target.id);

      const minimumTransferFee=getCoachMinimumAcceptedTransferFee(
        target,
        sellerRoster,
        transferRequested,
      );

      const offeredTransferFee=getCPUTransferOfferFee(
        minimumTransferFee,
        teamId,
        target.id,
        career.coach.season,
        "midseason",
      );

      if(!willCoachClubAcceptTransfer(
        target,
        sellerRoster,
        offeredTransferFee,
        transferRequested,
      ))continue;

      const rosterAfterReplacement=roster.filter(player=>player.id!==weakest.id);

      const salaryNegotiation=negotiateCoachPlayerSalary(
        target,
        currentTeamStrength,
        teamStrength,
        roster,
        career.coach.season,
        salary=>canCPUAffordTransfer(
          cpuFinancesByTeam,
          teamId,
          offeredTransferFee,
          salary,
          rosterAfterReplacement,
        ),
      );

      if(!salaryNegotiation.accepted)continue;

      const offer:CoachTransferOffer={
        buyerTeamId:teamId,
        buyerTeamStrength:teamStrength,
        transferFee:offeredTransferFee,
        salary:salaryNegotiation.salary,
        seasons:getCPUContractLength(target,career.coach.season),
      };

      transferOffersByPlayer[target.id]=[
        ...(transferOffersByPlayer[target.id]??[]),
        offer,
      ];
    }
  }

  const contractedCandidates=Object.entries(transferOffersByPlayer)
    .map(([playerId,offers])=>({
      player:playerPool.find(player=>player.id===playerId),
      offers,
    }))
    .filter((item):item is {player:CoachPlayer;offers:CoachTransferOffer[]}=>Boolean(item.player))
    .sort((a,b)=>{
      const requestBonusA=transferRequestIds.has(a.player.id)?20:0;
      const requestBonusB=transferRequestIds.has(b.player.id)?20:0;

      return (b.player.overall+requestBonusB)-(a.player.overall+requestBonusA);
    });

  for(const {player,offers} of contractedCandidates){
    if(player.teamId==="free-agent"||player.teamId===playerTeamId)continue;

    const sellerTeamId=player.teamId;
    const sellerRoster=getCPURoster(playerPool,sellerTeamId);

    if(sellerRoster.length<5)continue;

    const transferRequested=transferRequestIds.has(player.id);

    const viableOffers=offers.filter(offer=>{
      const buyerRoster=getCPURoster(playerPool,offer.buyerTeamId);

      if(buyerRoster.length<5)return false;

      const weakest=[...buyerRoster].sort((a,b)=>a.overall-b.overall)[0];

      if(!weakest)return false;
      if(player.overall<weakest.overall+2)return false;

      const buyerRosterAfterReplacement=buyerRoster.filter(item=>item.id!==weakest.id);

      if(!willCoachClubAcceptTransfer(
        player,
        sellerRoster,
        offer.transferFee,
        transferRequested,
      ))return false;

      return canCPUAffordTransfer(
        cpuFinancesByTeam,
        offer.buyerTeamId,
        offer.transferFee,
        offer.salary,
        buyerRosterAfterReplacement,
      );
    });

    if(!viableOffers.length)continue;

    const currentRostersByTeam=Object.fromEntries(
      viableOffers.map(offer=>[
        offer.buyerTeamId,
        getCPURoster(playerPool,offer.buyerTeamId),
      ]),
    ) as Record<string,CoachPlayer[]>;

    const bestOffer=chooseBestCoachTransferOffer(
      player,
      viableOffers,
      currentRostersByTeam,
    );

    if(!bestOffer)continue;

    const buyerRoster=getCPURoster(playerPool,bestOffer.buyerTeamId);
    const weakest=[...buyerRoster].sort((a,b)=>a.overall-b.overall)[0];

    if(!weakest)continue;

    const buyerRosterAfterReplacement=buyerRoster.filter(item=>item.id!==weakest.id);

    if(!canCPUAffordTransfer(
      cpuFinancesByTeam,
      bestOffer.buyerTeamId,
      bestOffer.transferFee,
      bestOffer.salary,
      buyerRosterAfterReplacement,
    ))continue;

    playerPool=movePlayer(
      playerPool,
      player.id,
      bestOffer.buyerTeamId,
      bestOffer.salary,
      bestOffer.seasons,
    );

    playerPool=movePlayer(
      playerPool,
      weakest.id,
      "free-agent",
      0,
    );

    replacementPriorityTeams.set(sellerTeamId,player.role);

    cpuFinancesByTeam=applyCPUTransferFee(
      cpuFinancesByTeam,
      bestOffer.buyerTeamId,
      sellerTeamId,
      bestOffer.transferFee,
    );

    cpuFinancesByTeam=refreshCPUFinancePayroll(
      cpuFinancesByTeam,
      playerPool,
      bestOffer.buyerTeamId,
    );

    cpuFinancesByTeam=refreshCPUFinancePayroll(
      cpuFinancesByTeam,
      playerPool,
      sellerTeamId,
    );

    transfers.push({
      playerId:player.id,
      playerName:player.ign,
      fromTeamId:sellerTeamId,
      toTeamId:bestOffer.buyerTeamId,
      salary:bestOffer.salary,
      transferFee:bestOffer.transferFee,
    });

    transfers.push({
      playerId:weakest.id,
      playerName:weakest.ign,
      fromTeamId:bestOffer.buyerTeamId,
      toTeamId:"free-agent",
      salary:0,
      transferFee:0,
    });
  }

  fillPriorityReplacements(
    playerTeamId,
    replacementPriorityTeams,
    career.coach.season,
    playerPool,
    cpuFinancesByTeam,
    transfers,
    updatedPool=>{playerPool=updatedPool;},
    updatedFinances=>{cpuFinancesByTeam=updatedFinances;},
    career.team.roster,
  );

  const freeAgentOffersByPlayer:Record<string,CoachContractOffer[]>={};

  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(playerPool,teamId);

    if(roster.length>=5)continue;

    const team=getTeamById(teamId);
    const teamStrength=team?.strength??80;
    const desiredRole=getCoachMostNeededRole(roster);

    const freeAgents=playerPool.filter(player=>
      player.teamId==="free-agent"&&
      !career.team.roster.some(current=>current.id===player.id)
    );

    const roleCandidates=freeAgents.filter(player=>player.role===desiredRole);
    const candidatePool=roleCandidates.length?roleCandidates:freeAgents;

    const candidates=[...candidatePool]
      .sort((a,b)=>{
        const scoreA=getCoachTransferTargetScore(roster,a,teamStrength);
        const scoreB=getCoachTransferTargetScore(roster,b,teamStrength);

        if(scoreB!==scoreA)return scoreB-scoreA;

        return b.overall-a.overall;
      })
      .slice(0,4);

    for(const candidate of candidates){
      const salaryNegotiation=negotiateCoachPlayerSalary(
        candidate,
        70,
        teamStrength,
        roster,
        career.coach.season,
        salary=>canCPUAffordTransfer(
          cpuFinancesByTeam,
          teamId,
          0,
          salary,
          roster,
        ),
      );

      if(!salaryNegotiation.accepted)continue;

      const offer:CoachContractOffer={
        teamId,
        teamStrength,
        salary:salaryNegotiation.salary,
        seasons:getCPUContractLength(candidate,career.coach.season),
      };

      freeAgentOffersByPlayer[candidate.id]=[
        ...(freeAgentOffersByPlayer[candidate.id]??[]),
        offer,
      ];
    }
  }

  const freeAgentCandidates=Object.entries(freeAgentOffersByPlayer)
    .map(([playerId,offers])=>({
      player:playerPool.find(player=>player.id===playerId),
      offers,
    }))
    .filter((item):item is {player:CoachPlayer;offers:CoachContractOffer[]}=>Boolean(item.player))
    .sort((a,b)=>b.player.overall-a.player.overall);

  for(const {player,offers} of freeAgentCandidates){
    if(player.teamId!=="free-agent")continue;

    const viableOffers=offers.filter(offer=>{
      const roster=getCPURoster(playerPool,offer.teamId);

      if(roster.length>=5)return false;

      return canCPUAffordTransfer(
        cpuFinancesByTeam,
        offer.teamId,
        0,
        offer.salary,
        roster,
      );
    });

    if(!viableOffers.length)continue;

    const currentRostersByTeam=Object.fromEntries(
      viableOffers.map(offer=>[
        offer.teamId,
        getCPURoster(playerPool,offer.teamId),
      ]),
    ) as Record<string,CoachPlayer[]>;

    const bestOffer=chooseBestCoachContractOffer(
      player,
      viableOffers,
      currentRostersByTeam,
    );

    if(!bestOffer)continue;

    const roster=getCPURoster(playerPool,bestOffer.teamId);

    if(roster.length>=5)continue;

    if(!canCPUAffordTransfer(
      cpuFinancesByTeam,
      bestOffer.teamId,
      0,
      bestOffer.salary,
      roster,
    ))continue;

    playerPool=movePlayer(
      playerPool,
      player.id,
      bestOffer.teamId,
      bestOffer.salary,
      bestOffer.seasons,
    );

    cpuFinancesByTeam=refreshCPUFinancePayroll(
      cpuFinancesByTeam,
      playerPool,
      bestOffer.teamId,
    );

    transfers.push({
      playerId:player.id,
      playerName:player.ign,
      fromTeamId:"free-agent",
      toTeamId:bestOffer.teamId,
      salary:bestOffer.salary,
      transferFee:0,
    });
  }

  ({playerPool,cpuFinancesByTeam}=ensureCPUMinimumRosters(
    playerTeamId,
    cpuTeamIds,
    career.coach.season,
    "midseason",
    playerPool,
    cpuFinancesByTeam,
    transfers,
    career.team.roster,
  ));

  playerPool=refreshCPUStarters(playerPool,cpuTeamIds);

  const freeAgentIds=playerPool
    .filter(player=>player.teamId==="free-agent")
    .map(player=>player.id);

  return {
    ...career,
    playerPool,
    cpuFinancesByTeam,
    midseasonMarket:{
      ...market,
      transfers,
      freeAgentIds,
    },
  };
}

export function completeCoachMidseasonMarket(career:CoachCareerState):CoachCareerState {
  const market=career.midseasonMarket;

  if(!market||market.completed)return career;

  const simulated=simulateCoachCPUMidseasonMarket(career);

  return {
    ...simulated,
    midseasonMarket:{
      ...simulated.midseasonMarket!,
      phase:"Complete",
      completed:true,
    },
  };
}

export function clearCoachMidseasonMarket(career:CoachCareerState):CoachCareerState {
  if(!career.midseasonMarket?.completed)return career;

  return {
    ...career,
    midseasonMarket:null,
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
    midseasonMarket:null,
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

function ensureCPUMinimumRosters(
  playerTeamId:string,
  cpuTeamIds:string[],
  season:number,
  window:"offseason"|"midseason",
  currentPool:CoachPlayer[],
  currentFinances:CoachCareerState["cpuFinancesByTeam"],
  transfers:CoachOffseasonState["transfers"],
  playerRoster:CoachPlayer[],
) {
  let playerPool=currentPool;
  let cpuFinancesByTeam=currentFinances;

  for(const teamId of cpuTeamIds){
    if(teamId===playerTeamId)continue;

    for(let guard=0;guard<10;guard++){
      const roster=getCPURoster(playerPool,teamId);
      if(roster.length>=5)break;

      const team=getTeamById(teamId);
      const teamStrength=team?.strength??80;
      const desiredRole=getCoachMostNeededRole(roster);

      const freeAgents=playerPool.filter(player=>
        player.teamId==="free-agent"&&
        !playerRoster.some(current=>current.id===player.id)
      );

      const roleCandidates=freeAgents.filter(player=>player.role===desiredRole);
      const candidatePool=roleCandidates.length?roleCandidates:freeAgents;
      const candidates=[...candidatePool].sort((a,b)=>{
        const scoreA=getCoachTransferTargetScore(roster,a,teamStrength);
        const scoreB=getCoachTransferTargetScore(roster,b,teamStrength);

        if(scoreB!==scoreA)return scoreB-scoreA;
        return b.overall-a.overall;
      });

      let signed=false;

      for(const candidate of candidates){
        const salaryNegotiation=negotiateCoachPlayerSalary(
          candidate,
          70,
          teamStrength,
          roster,
          season,
          salary=>canCPUAffordTransfer(cpuFinancesByTeam,teamId,0,salary,roster),
        );

        if(!salaryNegotiation.accepted)continue;

        const salary=salaryNegotiation.salary;
        const seasons=getCPUContractLength(candidate,season);

        playerPool=movePlayer(playerPool,candidate.id,teamId,salary,seasons);
        cpuFinancesByTeam=refreshCPUFinancePayroll(cpuFinancesByTeam,playerPool,teamId);

        transfers.push({
          playerId:candidate.id,
          playerName:candidate.ign,
          fromTeamId:"free-agent",
          toTeamId:teamId,
          salary,
          transferFee:0,
        });

        signed=true;
        break;
      }

      if(signed)continue;

      const emergencySalary=getEmergencyReplacementSalary(cpuFinancesByTeam,teamId,roster,teamStrength);
      cpuFinancesByTeam=ensureCPUFinanceSalaryRoom(cpuFinancesByTeam,teamId,roster,emergencySalary);

      const emergency=createEmergencyReplacement(
        teamId,
        desiredRole,
        teamStrength,
        season,
        window,
        roster.length,
        emergencySalary,
      );

      playerPool=[...playerPool,emergency];
      cpuFinancesByTeam=refreshCPUFinancePayroll(cpuFinancesByTeam,playerPool,teamId);

      transfers.push({
        playerId:emergency.id,
        playerName:emergency.ign,
        fromTeamId:"free-agent",
        toTeamId:teamId,
        salary:emergency.salary,
        transferFee:0,
      });
    }
  }

  return {playerPool,cpuFinancesByTeam};
}

function createEmergencyReplacement(teamId:string,role:CoachPlayer["role"],teamStrength:number,season:number,window:"offseason"|"midseason",slot:number,salary:number):CoachPlayer {
  const seed=deterministicNumber(`${teamId}-${season}-${window}-${role}-${slot}-emergency`);
  const age=18+(seed%7);
  const baseOverall=clamp(Math.round(66+(teamStrength-70)*.28+(seed%5)),64,78);
  const potential=clamp(baseOverall+4+(seed%7),baseOverall,88);
  const peakAge=24+(seed%5);

  const player:CoachPlayer={
    id:`emergency-${season}-${window}-${teamId}-${slot}-${seed.toString(36)}`,
    ign:`Academy${seed%1000}`,
    teamId,
    role,
    stats:{
      aim:clamp(baseOverall+(seed%3)-1,40,99),
      gameSense:clamp(baseOverall+((seed>>2)%3)-1,40,99),
      communication:clamp(baseOverall+(role==="IGL"?3:((seed>>4)%3)-1),40,99),
      clutch:clamp(baseOverall+((seed>>6)%3)-1,40,99),
      consistency:clamp(baseOverall+((seed>>8)%3)-1,40,99),
      mental:clamp(baseOverall+((seed>>10)%3)-1,40,99),
    },
    overall:baseOverall,
    salary,
    age,
    starter:false,
    contractSeasonsRemaining:1,
    potential,
    peakAge,
    marketValue:0,
  };

  return refreshCoachPlayerMarketValue(player);
}

function getEmergencyReplacementSalary(cpuFinancesByTeam:CoachCareerState["cpuFinancesByTeam"],teamId:string,roster:CoachPlayer[],teamStrength:number) {
  const finances=getCPUFinances(cpuFinancesByTeam,teamId);
  const currentPayroll=roster.reduce((total,player)=>total+player.salary,0);
  const available=Math.max(0,(finances?.monthlyBudget??currentPayroll+1000)-currentPayroll);
  const targetSalary=
    teamStrength>=92?12000:
    teamStrength>=88?10000:
    teamStrength>=84?8500:
    teamStrength>=80?7000:
    5500;

  if(available>=1000)return Math.max(1000,Math.min(targetSalary,Math.floor(available/500)*500));
  return 1000;
}

function ensureCPUFinanceSalaryRoom(cpuFinancesByTeam:CoachCareerState["cpuFinancesByTeam"],teamId:string,roster:CoachPlayer[],salary:number) {
  const finances=getCPUFinances(cpuFinancesByTeam,teamId);
  if(!finances)return cpuFinancesByTeam;

  const currentPayroll=roster.reduce((total,player)=>total+player.salary,0);
  const requiredBudget=currentPayroll+salary;

  if(finances.monthlyBudget>=requiredBudget)return cpuFinancesByTeam;

  return {
    ...cpuFinancesByTeam,
    [teamId]:{
      ...finances,
      monthlyBudget:requiredBudget,
    },
  };
}

function fillPriorityReplacements(
  playerTeamId:string,
  replacementPriorityTeams:Map<string,CoachPlayer["role"]>,
  season:number,
  currentPool:CoachPlayer[],
  currentFinances:CoachCareerState["cpuFinancesByTeam"],
  transfers:CoachOffseasonState["transfers"],
  setPool:(pool:CoachPlayer[])=>void,
  setFinances:(finances:CoachCareerState["cpuFinancesByTeam"])=>void,
  playerRoster:CoachPlayer[],
) {
  let playerPool=currentPool;
  let cpuFinancesByTeam=currentFinances;

  for(const [teamId,lostRole] of replacementPriorityTeams){
    if(teamId===playerTeamId)continue;

    const roster=getCPURoster(playerPool,teamId);

    if(roster.length>=5)continue;

    const team=getTeamById(teamId);
    const teamStrength=team?.strength??80;

    const freeAgents=playerPool.filter(player=>
      player.teamId==="free-agent"&&
      !playerRoster.some(current=>current.id===player.id)
    );

    if(!freeAgents.length)continue;

    const roleCandidates=freeAgents.filter(player=>player.role===lostRole);
    const candidatePool=roleCandidates.length?roleCandidates:freeAgents;

    const candidates=[...candidatePool].sort((a,b)=>{
      const scoreA=getCoachTransferTargetScore(roster,a,teamStrength);
      const scoreB=getCoachTransferTargetScore(roster,b,teamStrength);

      if(scoreB!==scoreA)return scoreB-scoreA;

      return b.overall-a.overall;
    });

    for(const candidate of candidates){
      const salaryNegotiation=negotiateCoachPlayerSalary(
        candidate,
        70,
        teamStrength,
        roster,
        season,
        salary=>canCPUAffordTransfer(
          cpuFinancesByTeam,
          teamId,
          0,
          salary,
          roster,
        ),
      );

      if(!salaryNegotiation.accepted)continue;

      const salary=salaryNegotiation.salary;
      const seasons=getCPUContractLength(candidate,season);

      playerPool=movePlayer(
        playerPool,
        candidate.id,
        teamId,
        salary,
        seasons,
      );

      cpuFinancesByTeam=refreshCPUFinancePayroll(
        cpuFinancesByTeam,
        playerPool,
        teamId,
      );

      transfers.push({
        playerId:candidate.id,
        playerName:candidate.ign,
        fromTeamId:"free-agent",
        toTeamId:teamId,
        salary,
        transferFee:0,
      });

      break;
    }
  }

  setPool(playerPool);
  setFinances(cpuFinancesByTeam);
}

function refreshCPUStarters(playerPool:CoachPlayer[],cpuTeamIds:string[]) {
  let updatedPool=playerPool;

  for(const teamId of cpuTeamIds){
    const roster=getCPURoster(updatedPool,teamId).sort((a,b)=>b.overall-a.overall);
    const starterIds=new Set(roster.slice(0,5).map(player=>player.id));

    updatedPool=updatedPool.map(player=>
      player.teamId===teamId
        ?{...player,starter:starterIds.has(player.id)}
        :player
    );
  }

  return updatedPool;
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
  return {...player,contractSeasonsRemaining:player.contractSeasonsRemaining??2};
}

function getCoachTier1TeamIds() {
  return TEAMS.filter(team=>team.tier===1).map(team=>team.id);
}

function getCPURoster(playerPool:CoachPlayer[],teamId:string) {
  return playerPool.filter(player=>player.teamId===teamId);
}

function getCPUFinances(cpuFinancesByTeam:CoachCareerState["cpuFinancesByTeam"],teamId:string) {
  return cpuFinancesByTeam[teamId]??null;
}

function canCPUAffordTransfer(cpuFinancesByTeam:CoachCareerState["cpuFinancesByTeam"],teamId:string,transferFee:number,newSalary:number,currentRoster:CoachPlayer[]) {
  const finances=getCPUFinances(cpuFinancesByTeam,teamId);
  if(!finances)return false;

  const currentPayroll=currentRoster.reduce((total,player)=>total+player.salary,0);
  const projectedPayroll=currentPayroll+newSalary;

  return transferFee<=finances.transferBudget&&projectedPayroll<=finances.monthlyBudget;
}

function refreshCPUFinancePayroll(cpuFinancesByTeam:CoachCareerState["cpuFinancesByTeam"],playerPool:CoachPlayer[],teamId:string) {
  const finances=cpuFinancesByTeam[teamId];
  if(!finances)return cpuFinancesByTeam;

  const payroll=getCPURoster(playerPool,teamId).reduce((total,player)=>total+player.salary,0);

  return {
    ...cpuFinancesByTeam,
    [teamId]:{
      ...finances,
      currentMonthlyPayroll:payroll,
    },
  };
}

function applyCPUTransferFee(cpuFinancesByTeam:CoachCareerState["cpuFinancesByTeam"],buyerTeamId:string,sellerTeamId:string,transferFee:number) {
  const buyer=cpuFinancesByTeam[buyerTeamId];
  const seller=cpuFinancesByTeam[sellerTeamId];

  if(!buyer)return cpuFinancesByTeam;

  return {
    ...cpuFinancesByTeam,
    [buyerTeamId]:{
      ...buyer,
      transferBudget:Math.max(0,buyer.transferBudget-transferFee),
    },
    ...(seller?{
      [sellerTeamId]:{
        ...seller,
        transferBudget:seller.transferBudget+transferFee,
      },
    }:{})
  };
}

function movePlayer(playerPool:CoachPlayer[],playerId:string,teamId:string,salary:number,contractSeasonsRemaining?:number) {
  return playerPool.map(player=>{
    if(player.id!==playerId)return player;

    const movedPlayer:CoachPlayer={
      ...player,
      teamId,
      salary:teamId==="free-agent"?player.salary:salary,
      starter:false,
      contractSeasonsRemaining:teamId==="free-agent"?0:contractSeasonsRemaining??player.contractSeasonsRemaining??2,
    };

    return refreshCoachPlayerMarketValue(movedPlayer);
  });
}

function getCPUContractLength(player:CoachPlayer,season:number) {
  return 1+(deterministicNumber(`${player.id}-${season}-contract`)%3);
}

function getCPUTransferOfferFee(minimumFee:number,teamId:string,playerId:string,season:number,window:"offseason"|"midseason") {
  if(minimumFee<=0)return 0;

  const maxPremium=window==="offseason"?10:6;

  const premiumRoll=
    deterministicNumber(`${teamId}-${playerId}-${season}-${window}-transfer-offer`)%
    (maxPremium+1);

  return Math.ceil(
    minimumFee*(1+premiumRoll/100)/50000,
  )*50000;
}

function getCoachRetirementChance(player:CoachPlayer) {
  if(player.age<31)return 0;
  if(player.age===31)return .02;
  if(player.age===32)return .05;
  if(player.age===33)return .15;
  if(player.age===34)return .40;
  if(player.age===35)return .80;

  return 1;
}

function shouldRetireCoachPlayer(player:CoachPlayer,season:number) {
  const chance=getCoachRetirementChance(player);

  if(chance<=0)return false;
  if(chance>=1)return true;

  const roll=deterministicNumber(`${player.id}-${season}-retirement`)%10000/10000;

  return roll<chance;
}

function progressCoachPlayer(player:CoachPlayer):CoachPlayer {
  const gapToPotential=Math.max(0,player.potential-player.overall);

  let baseChange=0;

  if(player.age<player.peakAge){
    const yearsToPeak=player.peakAge-player.age;

    if(gapToPotential>0){
      baseChange=
        yearsToPeak>=4?2:
        yearsToPeak>=2?1:
        gapToPotential>=3?1:
        0;
    }
  }else if(player.age===player.peakAge){
    baseChange=gapToPotential>=2?1:0;
  }else{
    const yearsPastPeak=player.age-player.peakAge;

    baseChange=
      yearsPastPeak<=1?0:
      yearsPastPeak<=3?-1:
      -2;
  }

  const variance=deterministicNumber(`${player.id}-${player.age}-development`)%3-1;

  let change=baseChange+variance;

  if(change>0)change=Math.min(change,gapToPotential);
  change=Math.max(-2,Math.min(2,change));

  if(change===0)return player;
  if(change>0)return progressDevelopingPlayer(player,change);

  return regressVeteranPlayer(player,Math.abs(change));
}

function progressDevelopingPlayer(player:CoachPlayer,change:number):CoachPlayer {
  const nextStats={
    ...player.stats,
    aim:clamp(player.stats.aim+change,40,99),
    gameSense:clamp(player.stats.gameSense+1,40,99),
    communication:clamp(player.stats.communication+1,40,99),
    clutch:clamp(player.stats.clutch+change,40,99),
    consistency:clamp(player.stats.consistency+1,40,99),
    mental:clamp(player.stats.mental+(change>=2?1:0),40,99),
  };

  return {
    ...player,
    stats:nextStats,
    overall:Math.min(player.potential,getStatsOverall(nextStats)),
  };
}

function regressVeteranPlayer(player:CoachPlayer,severity:number):CoachPlayer {
  const yearsPastPeak=Math.max(0,player.age-player.peakAge);
  const aimLoss=yearsPastPeak>=5?severity+1:severity;
  const clutchLoss=yearsPastPeak>=4?severity:Math.max(0,severity-1);
  const consistencyLoss=yearsPastPeak>=3?severity:Math.max(0,severity-1);
  const mentalLoss=yearsPastPeak>=5?1:0;
  const gameSenseChange=yearsPastPeak<=2?1:yearsPastPeak<=5?0:-1;
  const communicationChange=player.role==="IGL"&&yearsPastPeak<=4?1:0;

  const nextStats={
    ...player.stats,
    aim:clamp(player.stats.aim-aimLoss,40,99),
    gameSense:clamp(player.stats.gameSense+gameSenseChange,40,99),
    communication:clamp(player.stats.communication+communicationChange,40,99),
    clutch:clamp(player.stats.clutch-clutchLoss,40,99),
    consistency:clamp(player.stats.consistency-consistencyLoss,40,99),
    mental:clamp(player.stats.mental-mentalLoss,40,99),
  };

  return {
    ...player,
    stats:nextStats,
    overall:getStatsOverall(nextStats),
  };
}

function getStatsOverall(stats:CoachPlayer["stats"]) {
  return Math.round((stats.aim+stats.gameSense+stats.communication+stats.clutch+stats.consistency+stats.mental)/6);
}

function refreshCoachPlayerMarketValue(player:CoachPlayer):CoachPlayer {
  return {...player,marketValue:getCoachPlayerMarketValue(player)};
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

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}
function renewCoachCPUFinances(currentFinances:CoachCareerState["cpuFinancesByTeam"],playerPool:CoachPlayer[]) {
  const renewed={...currentFinances};

  for(const [teamId,finances] of Object.entries(currentFinances)){
    const team=getTeamById(teamId);
    if(!team)continue;

    const payroll=getCPURoster(playerPool,teamId).reduce((total,player)=>total+player.salary,0);

    renewed[teamId]=renewCoachTeamFinances(
      team,
      finances,
      payroll,
    );
  }

  return renewed;
}