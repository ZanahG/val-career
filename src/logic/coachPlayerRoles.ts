import type {CoachPlayer,CoachPlayerAssignment,CoachPlayerTacticalRole} from "../types/coach";

export function getCoachPlayerTacticalRole(player:CoachPlayer,assignments:CoachPlayerAssignment[]) {
  return assignments.find(item=>item.playerId===player.id)?.tacticalRole??getDefaultCoachPlayerTacticalRole(player);
}

export function assignCoachPlayerTacticalRole(assignments:CoachPlayerAssignment[],playerId:string,tacticalRole:CoachPlayerTacticalRole) {
  const filtered=assignments.filter(item=>item.playerId!==playerId);
  return [...filtered,{playerId,tacticalRole}];
}

export function cleanCoachPlayerAssignments(assignments:CoachPlayerAssignment[],roster:CoachPlayer[]) {
  const ids=new Set(roster.map(player=>player.id));
  return assignments.filter(item=>ids.has(item.playerId));
}

export function getDefaultCoachPlayerTacticalRole(player:CoachPlayer):CoachPlayerTacticalRole {
  if(player.role==="IGL")return "IGL";

  if(player.role==="Duelist"){
    if(player.stats.aim>=88)return "Main Operator";
    return "Entry";
  }

  if(player.role==="Sentinel"){
    if(player.stats.gameSense>=85)return "Lurker";
    return "Anchor";
  }

  if(player.role==="Controller"){
    if(player.stats.communication>=86&&player.stats.gameSense>=84)return "IGL";
    return "Anchor";
  }

  if(player.role==="Initiator"){
    if(player.stats.communication>=84)return "Secondary Entry";
    return "Flex";
  }

  return "Flex";
}

export function getCoachRoleAssignmentFit(player:CoachPlayer,tacticalRole:CoachPlayerTacticalRole) {
  const aim=player.stats.aim;
  const gameSense=player.stats.gameSense;
  const communication=player.stats.communication;
  const clutch=player.stats.clutch;
  const consistency=player.stats.consistency;
  const mental=player.stats.mental;

  let score=70;

  if(tacticalRole==="Entry"){
    score=aim*.45+mental*.20+consistency*.15+clutch*.10+gameSense*.10;
    if(player.role==="Duelist")score+=5;
  }

  if(tacticalRole==="Secondary Entry"){
    score=aim*.30+gameSense*.25+communication*.20+mental*.15+consistency*.10;
    if(player.role==="Initiator"||player.role==="Duelist")score+=4;
  }

  if(tacticalRole==="Main Operator"){
    score=aim*.50+consistency*.20+gameSense*.15+mental*.10+clutch*.05;
    if(player.role==="Duelist")score+=4;
  }

  if(tacticalRole==="IGL"){
    score=gameSense*.35+communication*.35+mental*.15+consistency*.10+clutch*.05;
    if(player.role==="IGL")score+=6;
  }

  if(tacticalRole==="Lurker"){
    score=gameSense*.35+clutch*.25+consistency*.20+aim*.15+mental*.05;
    if(player.role==="Sentinel"||player.role==="Controller")score+=4;
  }

  if(tacticalRole==="Anchor"){
    score=gameSense*.25+consistency*.25+clutch*.20+mental*.15+aim*.15;
    if(player.role==="Sentinel"||player.role==="Controller")score+=4;
  }

  if(tacticalRole==="Flex"){
    score=(aim+gameSense+communication+clutch+consistency+mental)/6;
    if(player.role==="Flex")score+=4;
  }

  return clamp(Math.round(score),50,100);
}

export function getCoachRoleStructureScore(roster:CoachPlayer[],assignments:CoachPlayerAssignment[]) {
  if(roster.length<5)return 50;

  const starters=roster.filter(player=>player.starter).slice(0,5);
  const active=starters.length===5?starters:roster.slice(0,5);

  const roles=active.map(player=>getCoachPlayerTacticalRole(player,assignments));
  const fits=active.map(player=>getCoachRoleAssignmentFit(player,getCoachPlayerTacticalRole(player,assignments)));

  let structure=average(fits);

  const entryCount=roles.filter(role=>role==="Entry").length;
  const secondaryEntryCount=roles.filter(role=>role==="Secondary Entry").length;
  const iglCount=roles.filter(role=>role==="IGL").length;
  const operatorCount=roles.filter(role=>role==="Main Operator").length;
  const lurkerCount=roles.filter(role=>role==="Lurker").length;
  const anchorCount=roles.filter(role=>role==="Anchor").length;

  if(iglCount===1)structure+=4;
  if(entryCount>=1)structure+=3;

  if(secondaryEntryCount>=1)structure+=1;
  if(lurkerCount>=1)structure+=1;
  if(anchorCount>=1)structure+=1;
  if(operatorCount===1)structure+=1;

  if(iglCount===0)structure-=7;
  if(iglCount>1)structure-=(iglCount-1)*5;

  if(entryCount===0)structure-=5;
  if(entryCount>2)structure-=(entryCount-2)*2;

  if(operatorCount>1)structure-=(operatorCount-1)*3;
  if(lurkerCount>2)structure-=(lurkerCount-2)*1.5;
  if(anchorCount>2)structure-=(anchorCount-2)*1.5;

  return clamp(Math.round(structure),50,100);
}

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function average(values:number[]){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;}