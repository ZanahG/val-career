import type {CoachPlayer,CoachTeamFinances} from "../types/coach";
import {analyzeCoachRoster,getCoachBestRosterCutCandidate,getCoachRosterPlayerRedundancyScore,getCoachRosterRoleNeedScore} from "./coachRosterNeeds";

export type CoachRosterPlanReason=
  |"Missing Role"
  |"Role Imbalance"
  |"Weak Starter"
  |"Age Replacement"
  |"Contract Risk"
  |"Salary Pressure"
  |"Balanced";

export interface CoachRosterPlan {
  needsAction:boolean;
  targetRole:CoachPlayer["role"]|null;
  outgoingPlayerId:string|null;
  reason:CoachRosterPlanReason;
  urgency:number;
}

export function createCoachRosterPlan(roster:CoachPlayer[],finances:CoachTeamFinances):CoachRosterPlan {
  const analysis=analyzeCoachRoster(roster);

  if(roster.length<5){
    return {
      needsAction:true,
      targetRole:analysis.weakestRole,
      outgoingPlayerId:null,
      reason:"Missing Role",
      urgency:100,
    };
  }

  const missingRole=getCriticalMissingRole(roster);

  if(missingRole){
    const outgoing=getBestRoleImbalanceCut(roster,missingRole);

    return {
      needsAction:true,
      targetRole:missingRole,
      outgoingPlayerId:outgoing?.id??null,
      reason:"Missing Role",
      urgency:95,
    };
  }

  const redundantPlayer=getMostRedundantPlayer(roster);

  if(redundantPlayer){
    const targetRole=getBestReplacementRole(roster,redundantPlayer);

    return {
      needsAction:true,
      targetRole,
      outgoingPlayerId:redundantPlayer.id,
      reason:"Role Imbalance",
      urgency:80,
    };
  }

  const contractRisk=getContractRiskPlayer(roster);

  if(contractRisk){
    return {
      needsAction:true,
      targetRole:contractRisk.role,
      outgoingPlayerId:contractRisk.id,
      reason:"Contract Risk",
      urgency:65,
    };
  }

  const agingPlayer=getAgingReplacementPlayer(roster);

  if(agingPlayer){
    return {
      needsAction:true,
      targetRole:agingPlayer.role,
      outgoingPlayerId:agingPlayer.id,
      reason:"Age Replacement",
      urgency:55,
    };
  }

  const salaryProblem=getSalaryPressurePlayer(roster,finances);

  if(salaryProblem){
    return {
      needsAction:true,
      targetRole:salaryProblem.role,
      outgoingPlayerId:salaryProblem.id,
      reason:"Salary Pressure",
      urgency:50,
    };
  }

  const weakStarter=getWeakStarter(roster);

  if(weakStarter){
    return {
      needsAction:true,
      targetRole:weakStarter.role,
      outgoingPlayerId:weakStarter.id,
      reason:"Weak Starter",
      urgency:45,
    };
  }

  return {
    needsAction:false,
    targetRole:null,
    outgoingPlayerId:null,
    reason:"Balanced",
    urgency:0,
  };
}

function getCriticalMissingRole(roster:CoachPlayer[]) {
  const coreRoles:CoachPlayer["role"][]=["Duelist","Initiator","Controller","Sentinel"];

  const missing=coreRoles
    .filter(role=>!roster.some(player=>player.role===role))
    .sort((a,b)=>getCoachRosterRoleNeedScore(roster,b)-getCoachRosterRoleNeedScore(roster,a));

  return missing[0]??null;
}

function getMostRedundantPlayer(roster:CoachPlayer[]) {
  const candidates=roster
    .map(player=>({
      player,
      redundancy:getCoachRosterPlayerRedundancyScore(roster,player),
    }))
    .filter(item=>item.redundancy>=35)
    .sort((a,b)=>{
      if(b.redundancy!==a.redundancy)return b.redundancy-a.redundancy;

      return a.player.overall-b.player.overall;
    });

  return candidates[0]?.player??null;
}

function getBestRoleImbalanceCut(roster:CoachPlayer[],missingRole:CoachPlayer["role"]) {
  const candidates=roster.filter(player=>player.role!==missingRole);

  if(!candidates.length)return getCoachBestRosterCutCandidate(roster);

  return [...candidates]
    .sort((a,b)=>{
      const redundancyA=getCoachRosterPlayerRedundancyScore(roster,a);
      const redundancyB=getCoachRosterPlayerRedundancyScore(roster,b);

      if(redundancyB!==redundancyA)return redundancyB-redundancyA;

      return a.overall-b.overall;
    })[0]??null;
}

function getBestReplacementRole(roster:CoachPlayer[],outgoing:CoachPlayer) {
  const rosterWithoutOutgoing=roster.filter(player=>player.id!==outgoing.id);

  const roles:CoachPlayer["role"][]=["Duelist","Initiator","Controller","Sentinel","Flex"];

  return [...roles].sort((a,b)=>{
    const scoreA=getCoachRosterRoleNeedScore(rosterWithoutOutgoing,a);
    const scoreB=getCoachRosterRoleNeedScore(rosterWithoutOutgoing,b);

    return scoreB-scoreA;
  })[0];
}

function getContractRiskPlayer(roster:CoachPlayer[]) {
  return [...roster]
    .filter(player=>
      player.contractStatus==="Expiring"&&
      player.transferStatus==="TransferListed"
    )
    .sort((a,b)=>{
      if(b.marketValue!==a.marketValue)return b.marketValue-a.marketValue;

      return a.overall-b.overall;
    })[0]??null;
}

function getAgingReplacementPlayer(roster:CoachPlayer[]) {
  return [...roster]
    .filter(player=>player.age>=30)
    .sort((a,b)=>{
      const ageScore=b.age-a.age;
      if(ageScore!==0)return ageScore;

      return a.overall-b.overall;
    })[0]??null;
}

function getSalaryPressurePlayer(roster:CoachPlayer[],finances:CoachTeamFinances) {
  const payroll=roster.reduce((total,player)=>total+player.salary,0);
  const payrollLimit=Math.max(1,finances.maxMonthlyPayroll);

  if(payroll/payrollLimit<.90)return null;

  return [...roster]
    .filter(player=>player.salary>0)
    .sort((a,b)=>{
      const valueA=a.overall/Math.max(1,a.salary);
      const valueB=b.overall/Math.max(1,b.salary);

      return valueA-valueB;
    })[0]??null;
}

function getWeakStarter(roster:CoachPlayer[]) {
  const averageOverall=roster.reduce((total,player)=>total+player.overall,0)/Math.max(1,roster.length);

  return [...roster]
    .filter(player=>player.overall<=averageOverall-4)
    .sort((a,b)=>a.overall-b.overall)[0]??null;
}