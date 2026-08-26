import type {CoachPlayer} from "../types/coach";

export function getCoachPlayerTransferFee(player:CoachPlayer) {
  if(player.teamId==="free-agent")return 0;

  const contractSeasons=getEffectiveContractSeasons(player);

  if(contractSeasons<=0)return 0;

  const contractMultiplier=getContractTransferMultiplier(contractSeasons);
  const potentialMultiplier=getPotentialTransferMultiplier(player);
  const ageMultiplier=getAgeTransferMultiplier(player.age);

  const fee=player.marketValue*contractMultiplier*potentialMultiplier*ageMultiplier;

  return Math.max(2500,roundTransferValue(fee));
}

export function getCoachPlayerBuyout(player:CoachPlayer) {
  const transferFee=getCoachPlayerTransferFee(player);

  if(transferFee===0)return 0;

  const premium=
    player.age<=21&&player.potential>=90?1.40:
    player.overall>=90?1.35:
    player.potential>=88?1.30:
    1.25;

  return roundTransferValue(transferFee*premium);
}

export function getCoachTransferCost(player:CoachPlayer) {
  return player.teamId==="free-agent"?0:getCoachPlayerTransferFee(player);
}

export function getCoachMinimumAcceptedTransferFee(player:CoachPlayer,sellerRoster:CoachPlayer[],transferRequested:boolean=false) {
  const baseFee=getCoachPlayerTransferFee(player);

  if(baseFee<=0)return 0;

  const buyout=getCoachPlayerBuyout(player);
  const importanceMultiplier=getPlayerImportanceMultiplier(player,sellerRoster);
  const rosterMultiplier=getSellerRosterMultiplier(sellerRoster.length,transferRequested);
  const contractMultiplier=getEffectiveContractSeasons(player)>=3?1.12:1;
  const requestMultiplier=transferRequested?.82:1;

  return Math.min(
    buyout,
    roundTransferValue(baseFee*importanceMultiplier*rosterMultiplier*contractMultiplier*requestMultiplier),
  );
}

export function willCoachClubAcceptTransfer(player:CoachPlayer,sellerRoster:CoachPlayer[],offeredFee:number,transferRequested:boolean=false) {
  if(player.teamId==="free-agent")return true;
  if(sellerRoster.length<5)return false;

  const minimumFee=getCoachMinimumAcceptedTransferFee(
    player,
    sellerRoster,
    offeredFee>=getCoachPlayerBuyout(player)?false:transferRequested,
  );

  return offeredFee>=minimumFee;
}

function getEffectiveContractSeasons(player:CoachPlayer) {
  if(player.teamId==="free-agent")return 0;

  return player.contractSeasonsRemaining===undefined
    ?1
    :Math.max(0,player.contractSeasonsRemaining);
}

function getContractTransferMultiplier(seasons:number) {
  if(seasons>=4)return 1.40;
  if(seasons===3)return 1.25;
  if(seasons===2)return 1.10;
  if(seasons===1)return .85;
  return 0;
}

function getPotentialTransferMultiplier(player:CoachPlayer) {
  const gap=Math.max(0,player.potential-player.overall);

  if(player.age<=20&&gap>=10)return 1.20;
  if(player.age<=22&&gap>=7)return 1.15;
  if(player.age<=24&&gap>=5)return 1.10;

  return 1;
}

function getAgeTransferMultiplier(age:number) {
  if(age<=20)return 1.10;
  if(age<=23)return 1.07;
  if(age<=27)return 1;
  if(age<=30)return .92;
  if(age<=32)return .82;
  return .70;
}

function getSellerRosterMultiplier(rosterSize:number,transferRequested:boolean) {
  if(rosterSize<=4)return 1.50;
  if(rosterSize===5)return transferRequested?1.12:1.30;
  if(rosterSize===6)return transferRequested?1:1.12;
  return transferRequested?.95:1;
}

function getPlayerImportanceMultiplier(player:CoachPlayer,roster:CoachPlayer[]) {
  const sorted=[...roster].sort((a,b)=>b.overall-a.overall);
  const rank=sorted.findIndex(item=>item.id===player.id);

  if(rank===0)return 1.35;
  if(rank===1)return 1.25;
  if(rank===2)return 1.15;
  if(rank<=4)return 1.08;

  return .95;
}

function roundTransferValue(value:number) {
  if(value>=100000)return Math.round(value/5000)*5000;
  if(value>=50000)return Math.round(value/2500)*2500;
  if(value>=10000)return Math.round(value/1000)*1000;

  return Math.round(value/500)*500;
}