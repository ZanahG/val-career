import type {CoachPlayer} from "../types/coach";
import {getCoachMostNeededRosterRole,getCoachRosterNeedForPlayer,getCoachRosterRoleNeedScore} from "./coachRosterNeeds";

export interface CoachContractOffer {
  teamId:string;
  teamStrength:number;
  salary:number;
  seasons:number;
}
export interface CoachTransferOffer {
  buyerTeamId:string;
  buyerTeamStrength:number;
  transferFee:number;
  salary:number;
  seasons:number;
}

export function getCoachRoleNeedScore(roster:CoachPlayer[],role:CoachPlayer["role"]) {
  return getCoachRosterRoleNeedScore(roster,role);
}

export function getCoachMostNeededRole(roster:CoachPlayer[]):CoachPlayer["role"] {
  return getCoachMostNeededRosterRole(roster);
}

export function getCoachPlayerRoleFitScore(roster:CoachPlayer[],player:CoachPlayer) {
  return getCoachRosterNeedForPlayer(roster,player);
}

export function getCoachTransferTargetScore(roster:CoachPlayer[],player:CoachPlayer,teamStrength:number) {
  const roleFit=getCoachPlayerRoleFitScore(roster,player);
  const overallScore=getOverallScore(player.overall);
  const potentialScore=getPotentialScore(player);
  const ageScore=getAgeScore(player.age);
  const salaryScore=getSalaryScore(player.salary);
  const contractScore=getContractScore(player.contractSeasonsRemaining??0);
  const marketValueScore=getMarketValueScore(player.marketValue);
  const levelFitScore=getTeamLevelFitScore(player,teamStrength);
  const upgradeScore=getUpgradeScore(roster,player);

  return (
    roleFit*1.5+
    upgradeScore*1.4+
    overallScore*1.2+
    potentialScore+
    ageScore+
    salaryScore+
    contractScore+
    marketValueScore+
    levelFitScore
  );
}

function getOverallScore(overall:number) {
  if(overall>=92)return 100;
  if(overall>=88)return 85;
  if(overall>=84)return 70;
  if(overall>=80)return 55;
  if(overall>=76)return 40;
  if(overall>=72)return 25;

  return 10;
}

function getPotentialScore(player:CoachPlayer) {
  const gap=Math.max(0,player.potential-player.overall);

  if(player.age<=20)return gap*5;
  if(player.age<=23)return gap*4;
  if(player.age<=26)return gap*2.5;
  if(player.age<=29)return gap;

  return 0;
}

function getAgeScore(age:number) {
  if(age<=19)return 30;
  if(age<=21)return 25;
  if(age<=24)return 18;
  if(age<=27)return 10;
  if(age<=29)return 4;
  if(age===30)return 0;
  if(age===31)return -8;
  if(age===32)return -16;
  if(age===33)return -25;

  return -35;
}

function getSalaryScore(salary:number) {
  if(salary<=3000)return 20;
  if(salary<=6000)return 12;
  if(salary<=10000)return 5;
  if(salary<=15000)return 0;
  if(salary<=20000)return -8;

  return -15;
}

function getContractScore(seasons:number) {
  if(seasons===0)return 20;
  if(seasons===1)return 8;
  if(seasons===2)return 0;
  if(seasons===3)return -6;

  return -10;
}

function getMarketValueScore(marketValue:number) {
  if(marketValue<=300000)return 15;
  if(marketValue<=700000)return 10;
  if(marketValue<=1200000)return 5;
  if(marketValue<=2000000)return 0;
  if(marketValue<=3000000)return -8;

  return -15;
}

function getTeamLevelFitScore(player:CoachPlayer,teamStrength:number) {
  const difference=player.overall-teamStrength;

  if(difference>=8)return 20;
  if(difference>=4)return 14;
  if(difference>=0)return 8;
  if(difference>=-3)return 2;
  if(difference>=-6)return -8;

  return -20;
}

export function willCoachPlayerAcceptClub(player:CoachPlayer,currentTeamStrength:number,newTeamStrength:number,newSalary:number,newRoster:CoachPlayer[],season:number) {
  const salaryScore=getPlayerSalaryAcceptanceScore(player,newSalary);
  const strengthScore=getPlayerTeamStrengthAcceptanceScore(currentTeamStrength,newTeamStrength);
  const roleScore=getPlayerRoleAcceptanceScore(player,newRoster);
  const ageScore=getPlayerAgeAcceptanceScore(player,newTeamStrength,currentTeamStrength);

  const acceptanceScore=salaryScore+strengthScore+roleScore+ageScore;
  const roll=deterministicNumber(`${player.id}-${season}-${newTeamStrength}-${newSalary}-acceptance`)%100;

  return acceptanceScore>=roll;
}

function getPlayerSalaryAcceptanceScore(player:CoachPlayer,newSalary:number) {
  const currentSalary=Math.max(1,player.salary);
  const ratio=newSalary/currentSalary;

  if(ratio>=1.5)return 45;
  if(ratio>=1.3)return 38;
  if(ratio>=1.15)return 30;
  if(ratio>=1)return 22;
  if(ratio>=.9)return 12;

  return 2;
}

function getPlayerTeamStrengthAcceptanceScore(currentStrength:number,newStrength:number) {
  const difference=newStrength-currentStrength;

  if(difference>=8)return 30;
  if(difference>=4)return 24;
  if(difference>=1)return 18;
  if(difference===0)return 12;
  if(difference>=-3)return 6;

  return 0;
}

function getPlayerRoleAcceptanceScore(player:CoachPlayer,newRoster:CoachPlayer[]) {
  const sameRole=newRoster.filter(item=>item.role===player.role);
  const betterPlayers=sameRole.filter(item=>item.overall>player.overall);

  if(!sameRole.length)return 20;
  if(!betterPlayers.length)return 16;
  if(betterPlayers.length===1)return 8;

  return 2;
}

function getPlayerAgeAcceptanceScore(player:CoachPlayer,newStrength:number,currentStrength:number) {
  if(player.age<=21&&newStrength>currentStrength)return 12;
  if(player.age<=24&&newStrength>=currentStrength)return 8;
  if(player.age>=30&&newStrength>=currentStrength)return 10;

  return 5;
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}

export function getCoachPlayerExpectedSalary(player:CoachPlayer) {
  const base=
    player.overall>=92?26000:
    player.overall>=89?22000:
    player.overall>=86?18000:
    player.overall>=83?14500:
    player.overall>=80?11500:
    player.overall>=76?8500:
    player.overall>=72?6000:
    4000;

  const potentialBonus=
    player.age<=21&&player.potential>=92?5000:
    player.age<=23&&player.potential>=88?3000:
    player.potential-player.overall>=7?1500:
    0;

  const ageAdjustment=
    player.age>=32?-2500:
    player.age>=30?-1500:
    0;

  return Math.max(2000,roundSalary(base+potentialBonus+ageAdjustment));
}

export function getCoachInitialSalaryOffer(player:CoachPlayer,teamStrength:number) {
  const expected=getCoachPlayerExpectedSalary(player);

  const multiplier=
    teamStrength>=90?.96:
    teamStrength>=85?.93:
    teamStrength>=80?.90:
    .88;

  return roundSalary(expected*multiplier);
}

export function getCoachNegotiatedSalaryOffer(initialOffer:number,round:1|2) {
  const multiplier=round===1?1.08:1.16;

  return roundSalary(initialOffer*multiplier);
}

export function negotiateCoachPlayerSalary(
  player:CoachPlayer,
  currentTeamStrength:number,
  newTeamStrength:number,
  roster:CoachPlayer[],
  season:number,
  canAfford:(salary:number)=>boolean,
) {
  const initialOffer=getCoachInitialSalaryOffer(player,newTeamStrength);
  const offers=[
    initialOffer,
    getCoachNegotiatedSalaryOffer(initialOffer,1),
    getCoachNegotiatedSalaryOffer(initialOffer,2),
  ];

  for(let round=0;round<offers.length;round++){
    const salary=offers[round];

    if(!canAfford(salary))continue;

    const accepted=willCoachPlayerAcceptClub(
      player,
      currentTeamStrength,
      newTeamStrength,
      salary,
      roster,
      season+round,
    );

    if(accepted){
      return {
        accepted:true,
        salary,
        rounds:round,
      };
    }
  }

  return {
    accepted:false,
    salary:0,
    rounds:offers.length,
  };
}

function roundSalary(value:number) {
  return Math.round(value/100)*100;
}

export function getCoachContractOfferScore(player:CoachPlayer,offer:CoachContractOffer,roster:CoachPlayer[]) {
  const salaryScore=getContractOfferSalaryScore(player,offer.salary);
  const strengthScore=getContractOfferStrengthScore(offer.teamStrength);
  const contractScore=getContractLengthScore(player,offer.seasons);
  const roleScore=getPlayerRoleAcceptanceScore(player,roster);

  return salaryScore+strengthScore+contractScore+roleScore;
}

export function chooseBestCoachContractOffer(player:CoachPlayer,offers:CoachContractOffer[],rostersByTeam:Record<string,CoachPlayer[]>) {
  if(!offers.length)return null;

  return [...offers]
    .sort((a,b)=>{
      const scoreA=getCoachContractOfferScore(player,a,rostersByTeam[a.teamId]??[]);
      const scoreB=getCoachContractOfferScore(player,b,rostersByTeam[b.teamId]??[]);

      if(scoreB!==scoreA)return scoreB-scoreA;
      if(b.salary!==a.salary)return b.salary-a.salary;

      return b.teamStrength-a.teamStrength;
    })[0]??null;
}

function getContractOfferSalaryScore(player:CoachPlayer,salary:number) {
  const expected=getCoachPlayerExpectedSalary(player);
  const ratio=salary/Math.max(1,expected);

  if(ratio>=1.25)return 45;
  if(ratio>=1.15)return 38;
  if(ratio>=1.05)return 30;
  if(ratio>=.95)return 22;
  if(ratio>=.85)return 12;

  return 4;
}

function getContractOfferStrengthScore(teamStrength:number) {
  if(teamStrength>=92)return 30;
  if(teamStrength>=88)return 25;
  if(teamStrength>=84)return 20;
  if(teamStrength>=80)return 15;
  if(teamStrength>=76)return 10;

  return 5;
}

function getContractLengthScore(player:CoachPlayer,seasons:number) {
  if(player.age<=21){
    if(seasons===3)return 18;
    if(seasons===2)return 14;
    return 8;
  }

  if(player.age>=30){
    if(seasons===2)return 16;
    if(seasons===1)return 12;
    return 8;
  }

  if(seasons===3)return 14;
  if(seasons===2)return 16;

  return 10;
}
export function chooseBestCoachTransferOffer(player:CoachPlayer,offers:CoachTransferOffer[],rostersByTeam:Record<string,CoachPlayer[]>) {
  if(!offers.length)return null;

  return [...offers]
    .sort((a,b)=>{
      const contractA=getCoachContractOfferScore(player,{
        teamId:a.buyerTeamId,
        teamStrength:a.buyerTeamStrength,
        salary:a.salary,
        seasons:a.seasons,
      },rostersByTeam[a.buyerTeamId]??[]);

      const contractB=getCoachContractOfferScore(player,{
        teamId:b.buyerTeamId,
        teamStrength:b.buyerTeamStrength,
        salary:b.salary,
        seasons:b.seasons,
      },rostersByTeam[b.buyerTeamId]??[]);

      if(contractB!==contractA)return contractB-contractA;
      if(b.salary!==a.salary)return b.salary-a.salary;

      return b.buyerTeamStrength-a.buyerTeamStrength;
    })[0]??null;
}

function getCurrentRoleReferencePlayer(roster:CoachPlayer[],player:CoachPlayer) {
  const sameRole=roster
    .filter(item=>item.role===player.role)
    .sort((a,b)=>b.overall-a.overall);

  if(!sameRole.length)return null;

  return sameRole[0];
}

function getUpgradeScore(roster:CoachPlayer[],player:CoachPlayer) {
  const current=getCurrentRoleReferencePlayer(roster,player);

  if(!current)return 35;

  const overallDiff=player.overall-current.overall;
  const potentialDiff=player.potential-current.potential;
  const ageDiff=current.age-player.age;

  let score=0;

  if(overallDiff>=6)score+=35;
  else if(overallDiff>=4)score+=28;
  else if(overallDiff>=2)score+=18;
  else if(overallDiff===1)score+=8;
  else if(overallDiff===0)score+=0;
  else if(overallDiff>=-2)score-=10;
  else score-=25;

  if(potentialDiff>=8)score+=18;
  else if(potentialDiff>=4)score+=10;
  else if(potentialDiff>=2)score+=5;

  if(ageDiff>=6)score+=12;
  else if(ageDiff>=3)score+=7;

  if(player.salary<current.salary*.8)score+=8;
  else if(player.salary>current.salary*1.35)score-=8;

  return score;
}