import type {CoachPlayer,CoachTeamFinances} from "../types/coach";

export type CoachCPUContractDecisionType="Renew"|"Sell"|"LetExpire";

export interface CoachCPUContractDecision {
  playerId:string;
  decision:CoachCPUContractDecisionType;
  score:number;
  renewalSalary:number;
  renewalYears:number;
  reason:string;
}

export function getCoachCPUContractDecision(player:CoachPlayer,roster:CoachPlayer[],finances:CoachTeamFinances,season:number):CoachCPUContractDecision {
  const score=getCoachContractRenewalScore(player,roster,finances);
  const renewalSalary=getCoachRenewalSalary(player);
  const renewalYears=getCoachRenewalLength(player,season);

  if(score>=62&&canAffordCoachRenewal(player,roster,finances,renewalSalary)){
    return {
      playerId:player.id,
      decision:"Renew",
      score,
      renewalSalary,
      renewalYears,
      reason:getRenewReason(player,roster),
    };
  }

  if(shouldSellExpiringCoachPlayer(player,roster,score)){
    return {
      playerId:player.id,
      decision:"Sell",
      score,
      renewalSalary,
      renewalYears,
      reason:getSellReason(player,roster),
    };
  }

  return {
    playerId:player.id,
    decision:"LetExpire",
    score,
    renewalSalary,
    renewalYears,
    reason:getExpireReason(player),
  };
}

export function getCoachContractRenewalScore(player:CoachPlayer,roster:CoachPlayer[],finances:CoachTeamFinances) {
  let score=0;

  score+=getOverallScore(player);
  score+=getPotentialScore(player);
  score+=getAgeScore(player);
  score+=getRoleNeedScore(player,roster);
  score+=getRosterImportanceScore(player,roster);
  score+=getSalaryScore(player,roster,finances);
  score+=getContractValueScore(player);

  return clamp(Math.round(score),0,100);
}

export function getCoachRenewalSalary(player:CoachPlayer) {
  const developmentValue=Math.max(0,player.potential-player.overall);

  let multiplier=1;

  if(player.overall>=92)multiplier+=.24;
  else if(player.overall>=88)multiplier+=.18;
  else if(player.overall>=84)multiplier+=.13;
  else if(player.overall>=80)multiplier+=.08;
  else if(player.overall<72)multiplier-=.08;

  if(player.age<=21&&developmentValue>=7)multiplier+=.12;
  else if(player.age<=24&&developmentValue>=4)multiplier+=.07;

  if(player.starter)multiplier+=.06;

  if(player.age>=31)multiplier-=.08;
  if(player.age>=34)multiplier-=.12;

  return roundSalary(Math.max(500,player.salary*multiplier));
}

export function getCoachRenewalLength(player:CoachPlayer,season:number) {
  const variance=deterministicNumber(`${player.id}-${season}-renewal-length`)%2;

  if(player.age<=20)return 3+variance;
  if(player.age<=24)return 2+variance;
  if(player.age<=28)return 2+variance;
  if(player.age<=31)return 1+variance;

  return 1;
}

export function shouldSellExpiringCoachPlayer(player:CoachPlayer,roster:CoachPlayer[],renewalScore?:number) {
  const score=renewalScore??50;

  if(player.contractStatus!=="Expiring"&&player.contractSeasonsRemaining!==1)return false;
  if(player.marketValue<250000)return false;

  const roleCompetition=roster.filter(item=>item.id!==player.id&&item.role===player.role);
  const betterSameRole=roleCompetition.some(item=>item.overall>=player.overall);
  const youngReplacement=roleCompetition.some(item=>item.age<=23&&item.potential>=player.overall+3);

  if(score<35)return true;
  if(score<50&&betterSameRole)return true;
  if(score<55&&youngReplacement)return true;
  if(player.age>=31&&score<60)return true;

  return false;
}

function getOverallScore(player:CoachPlayer) {
  if(player.overall>=92)return 28;
  if(player.overall>=88)return 25;
  if(player.overall>=84)return 22;
  if(player.overall>=80)return 18;
  if(player.overall>=76)return 14;
  if(player.overall>=72)return 9;

  return 4;
}

function getPotentialScore(player:CoachPlayer) {
  const gap=player.potential-player.overall;

  if(player.potential>=92)return 15;
  if(player.potential>=88)return 13;
  if(gap>=8)return 12;
  if(gap>=5)return 9;
  if(gap>=3)return 6;

  return 2;
}

function getAgeScore(player:CoachPlayer) {
  if(player.age<=20)return 12;
  if(player.age<=23)return 11;
  if(player.age<=26)return 9;
  if(player.age<=29)return 7;
  if(player.age<=31)return 4;
  if(player.age<=33)return 1;

  return -4;
}

function getRoleNeedScore(player:CoachPlayer,roster:CoachPlayer[]) {
  const sameRole=roster.filter(item=>item.role===player.role);

  if(sameRole.length<=1)return 13;
  if(sameRole.length===2)return 5;

  return -5;
}

function getRosterImportanceScore(player:CoachPlayer,roster:CoachPlayer[]) {
  const sorted=[...roster].sort((a,b)=>b.overall-a.overall);
  const position=sorted.findIndex(item=>item.id===player.id);

  let score=0;

  if(position===0)score+=12;
  else if(position<=2)score+=9;
  else if(position<=4)score+=6;
  else score-=3;

  if(player.starter)score+=4;

  return score;
}

function getSalaryScore(player:CoachPlayer,roster:CoachPlayer[],finances:CoachTeamFinances) {
  const payroll=roster.reduce((total,item)=>total+item.salary,0);
  const budget=Math.max(1,finances.monthlyBudget);
  const salaryShare=player.salary/budget;
  const payrollPressure=payroll/budget;

  let score=5;

  if(salaryShare<=.08)score+=5;
  else if(salaryShare<=.15)score+=2;
  else if(salaryShare>=.25)score-=7;
  else if(salaryShare>=.20)score-=4;

  if(payrollPressure>=.95)score-=6;
  else if(payrollPressure>=.85)score-=3;

  return score;
}

function getContractValueScore(player:CoachPlayer) {
  if(player.marketValue>=3000000)return 7;
  if(player.marketValue>=1500000)return 5;
  if(player.marketValue>=750000)return 3;
  if(player.marketValue<=150000)return -3;

  return 1;
}

function canAffordCoachRenewal(player:CoachPlayer,roster:CoachPlayer[],finances:CoachTeamFinances,newSalary:number) {
  const payrollWithoutPlayer=roster
    .filter(item=>item.id!==player.id)
    .reduce((total,item)=>total+item.salary,0);

  return payrollWithoutPlayer+newSalary<=finances.monthlyBudget;
}

function getRenewReason(player:CoachPlayer,roster:CoachPlayer[]) {
  const sameRole=roster.filter(item=>item.role===player.role);

  if(player.overall>=88)return "Key player";
  if(player.age<=23&&player.potential>=player.overall+5)return "High potential";
  if(sameRole.length<=1)return "Important roster role";
  if(player.starter)return "Regular starter";

  return "Good squad value";
}

function getSellReason(player:CoachPlayer,roster:CoachPlayer[]) {
  const replacement=roster
    .filter(item=>item.id!==player.id&&item.role===player.role)
    .sort((a,b)=>b.overall-a.overall)[0];

  if(replacement&&replacement.overall>=player.overall)return "Role already covered";
  if(replacement&&replacement.potential>player.potential)return "Younger replacement available";
  if(player.age>=31)return "Age and resale value";

  return "Avoid losing player for free";
}

function getExpireReason(player:CoachPlayer) {
  if(player.age>=32)return "Age profile";
  if(player.salary>=20000)return "Salary too high";
  if(player.overall<72)return "Below squad level";

  return "Not part of future plans";
}

function roundSalary(value:number) {
  if(value>=10000)return Math.round(value/500)*500;
  if(value>=5000)return Math.round(value/250)*250;

  return Math.round(value/100)*100;
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}