import type {PlayerRole,PlayerStats,TeamDefinition} from "../types/career";
import type {CoachPlayer} from "../types/coach";
import {TEAMS} from "../data/teams";
import {getEffectiveVCTRoster} from "../data/vctPlayers";

const TIER2_ROLES:PlayerRole[]=["Duelist","Initiator","Controller","Sentinel","Flex"];

export function createInitialCoachRoster(team:TeamDefinition):CoachPlayer[] {
  if(team.tier===1) {
    const realRoster=getEffectiveVCTRoster(team.name);

    if(realRoster.length>=5) {
      return realRoster.slice(0,5).map((player,index)=>{
        const role=normalizeRole(player.role);
        const stats={...player.stats};
        const overall=getStatsOverall(stats);

        return {
          id:`coach-${team.id}-${player.ign.toLowerCase().replace(/\s+/g,"-")}`,
          ign:player.ign,
          teamId:team.id,
          role,
          stats,
          overall,
          salary:getInitialCoachPlayerSalary(overall,team.tier),
          age:20+index,
          starter:true,
        };
      });
    }
  }

  return createGeneratedTier2Roster(team);
}

function createGeneratedTier2Roster(team:TeamDefinition):CoachPlayer[] {
  return TIER2_ROLES.map((role,index)=>{
    const base=team.strength+random(-4,4);
    const stats=createStatsForRole(role,base);
    const overall=getStatsOverall(stats);

    return {
      id:`coach-${team.id}-${index}`,
      ign:getGeneratedPlayerName(team.shortName,index),
      teamId:team.id,
      role,
      stats,
      overall,
      salary:getInitialCoachPlayerSalary(overall,2),
      age:random(18,27),
      starter:true,
    };
  });
}

function createStatsForRole(role:PlayerRole,base:number):PlayerStats {
  const stat=()=>clamp(base+random(-5,5),50,92);

  if(role==="Duelist") {
    return {aim:clamp(base+6,50,94),gameSense:stat(),communication:clamp(base-5,50,90),clutch:clamp(base+3,50,93),consistency:stat(),mental:stat()};
  }

  if(role==="Initiator") {
    return {aim:stat(),gameSense:clamp(base+4,50,94),communication:clamp(base+5,50,94),clutch:stat(),consistency:stat(),mental:stat()};
  }

  if(role==="Controller") {
    return {aim:stat(),gameSense:clamp(base+5,50,94),communication:clamp(base+4,50,94),clutch:stat(),consistency:clamp(base+4,50,94),mental:stat()};
  }

  if(role==="Sentinel") {
    return {aim:stat(),gameSense:clamp(base+4,50,94),communication:stat(),clutch:clamp(base+2,50,94),consistency:clamp(base+5,50,94),mental:stat()};
  }

  return {aim:stat(),gameSense:stat(),communication:stat(),clutch:stat(),consistency:stat(),mental:stat()};
}

function normalizeRole(role:string):PlayerRole|"IGL" {
  const normalized=role.trim().toLowerCase();

  if(normalized==="igl")return "IGL";
  if(normalized.includes("duel"))return "Duelist";
  if(normalized.includes("inici")||normalized.includes("init"))return "Initiator";
  if(normalized.includes("control"))return "Controller";
  if(normalized.includes("cent")||normalized.includes("sent"))return "Sentinel";

  return "Flex";
}

function getStatsOverall(stats:PlayerStats) {
  return Math.round((stats.aim+stats.gameSense+stats.communication+stats.clutch+stats.consistency+stats.mental)/6);
}

function getInitialCoachPlayerSalary(overall:number,tier:1|2) {
  if(tier===1) {
    if(overall>=94)return random(22000,30000);
    if(overall>=90)return random(15000,22000);
    if(overall>=85)return random(11000,18000);
    if(overall>=80)return random(7500,14000);
    return random(5000,9000);
  }

  if(overall>=80)return random(1800,3200);
  if(overall>=75)return random(1200,2400);
  if(overall>=70)return random(800,1800);

  return random(500,1300);
}

function getGeneratedPlayerName(shortName:string,index:number) {
  return `${shortName} Player ${index+1}`;
}

function random(min:number,max:number) {
  return Math.floor(Math.random()*(max-min+1))+min;
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}

export function createCoachPlayerPool():CoachPlayer[] {
  return TEAMS.flatMap(team=>createInitialCoachRoster(team));
}