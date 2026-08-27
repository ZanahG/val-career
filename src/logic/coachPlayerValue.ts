import type {CoachPlayer} from "../types/coach";

const MAX_MARKET_VALUE=110000;

export function getCoachPlayerMarketValue(player:CoachPlayer) {
  const overallValue=getOverallValue(player.overall);
  const potentialBonus=getPotentialBonus(player);
  const ageMultiplier=getAgeMultiplier(player.age);
  const contractMultiplier=getContractMultiplier(player.contractSeasonsRemaining??0);
  const roleMultiplier=getRoleMultiplier(player.role);
  const iglMultiplier=getIGLMultiplier(player);

  const value=(overallValue+potentialBonus)*ageMultiplier*contractMultiplier*roleMultiplier*iglMultiplier;

  return Math.min(MAX_MARKET_VALUE,Math.max(2500,roundMarketValue(value)));
}

function getOverallValue(overall:number) {
  if(overall>=95)return 82000+(overall-95)*3500;
  if(overall>=90)return 60000+(overall-90)*4400;
  if(overall>=85)return 42000+(overall-85)*3600;
  if(overall>=80)return 27000+(overall-80)*3000;
  if(overall>=75)return 16000+(overall-75)*2200;
  if(overall>=70)return 9000+(overall-70)*1400;
  if(overall>=65)return 5000+(overall-65)*800;

  return 2500+Math.max(0,overall-60)*500;
}

function getPotentialBonus(player:CoachPlayer) {
  const gap=Math.max(0,player.potential-player.overall);

  if(player.age>=29)return gap*250;
  if(player.age>=25)return gap*500;
  if(player.age>=22)return gap*850;
  if(player.age>=20)return gap*1200;

  return gap*1600;
}

function getAgeMultiplier(age:number) {
  if(age<=18)return 1.20;
  if(age<=20)return 1.16;
  if(age<=22)return 1.12;
  if(age<=25)return 1.07;
  if(age<=28)return 1;
  if(age===29)return .92;
  if(age===30)return .84;
  if(age===31)return .76;
  if(age===32)return .68;
  if(age===33)return .60;
  if(age===34)return .52;
  return .45;
}

function getContractMultiplier(seasons:number) {
  if(seasons>=3)return 1.18;
  if(seasons===2)return 1.10;
  if(seasons===1)return 1;
  return .75;
}

function getRoleMultiplier(role:CoachPlayer["role"]) {
  if(role==="Duelist")return 1.05;
  if(role==="Controller")return 1.03;
  if(role==="Initiator")return 1.02;
  if(role==="Sentinel")return 1;
  return .98;
}

function getIGLMultiplier(player:CoachPlayer) {
  return player.isIGL?1.05:1;
}

function roundMarketValue(value:number) {
  if(value>=75000)return Math.round(value/5000)*5000;
  if(value>=25000)return Math.round(value/2500)*2500;
  if(value>=10000)return Math.round(value/1000)*1000;
  return Math.round(value/500)*500;
}