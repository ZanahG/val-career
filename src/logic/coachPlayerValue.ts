import type {CoachPlayer} from "../types/coach";

export function getCoachPlayerMarketValue(player:CoachPlayer) {
  const overallValue=getOverallValue(player.overall);
  const potentialBonus=getPotentialBonus(player);
  const ageMultiplier=getAgeMultiplier(player.age);
  const contractMultiplier=getContractMultiplier(player.contractSeasonsRemaining??0);
  const roleMultiplier=getRoleMultiplier(player.role);

  const value=(overallValue+potentialBonus)*ageMultiplier*contractMultiplier*roleMultiplier;

  return Math.max(50000,roundMarketValue(value));
}

function getOverallValue(overall:number) {
  if(overall>=95)return 3500000+(overall-95)*650000;
  if(overall>=90)return 1800000+(overall-90)*340000;
  if(overall>=85)return 900000+(overall-85)*180000;
  if(overall>=80)return 450000+(overall-80)*90000;
  if(overall>=75)return 220000+(overall-75)*46000;
  if(overall>=70)return 100000+(overall-70)*24000;
  return 50000+(overall-60)*5000;
}

function getPotentialBonus(player:CoachPlayer) {
  const gap=Math.max(0,player.potential-player.overall);

  if(player.age>=29)return gap*15000;
  if(player.age>=25)return gap*35000;
  if(player.age>=22)return gap*65000;
  if(player.age>=20)return gap*90000;

  return gap*120000;
}

function getAgeMultiplier(age:number) {
  if(age<=18)return 1.25;
  if(age<=20)return 1.20;
  if(age<=22)return 1.15;
  if(age<=25)return 1.08;
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
  if(seasons>=3)return 1.25;
  if(seasons===2)return 1.15;
  if(seasons===1)return 1;
  return .75;
}

function getRoleMultiplier(role:CoachPlayer["role"]) {
  if(role==="Duelist")return 1.08;
  if(role==="IGL")return 1.05;
  if(role==="Flex")return 1.03;
  return 1;
}

function roundMarketValue(value:number) {
  if(value>=1000000)return Math.round(value/50000)*50000;
  if(value>=500000)return Math.round(value/25000)*25000;
  return Math.round(value/10000)*10000;
}