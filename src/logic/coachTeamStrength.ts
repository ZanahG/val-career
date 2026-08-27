import type {CoachCareerState,CoachPlayer} from "../types/coach";
import {TEAMS,getTeamById} from "../data/teams";

export function getCoachTeamCompetitiveStrength(career:CoachCareerState,teamId:string) {
  const team=getTeamById(teamId);
  const roster=getCoachCompetitiveRoster(career,teamId);

  if(roster.length<5)return team?.strength??70;

  const rosterQuality=getRosterQuality(roster);
  const starPower=getStarPower(roster);
  const roleBalance=getRoleBalance(roster);

  return clamp(
    rosterQuality*.65+
    starPower*.15+
    roleBalance*.10+
    (team?.strength??70)*.10,
    50,
    99,
  );
}

export function getCoachCompetitiveStrengthTable(career:CoachCareerState) {
  return Object.fromEntries(
    TEAMS
      .filter(team=>team.tier===1)
      .map(team=>[
        team.id,
        getCoachTeamCompetitiveStrength(career,team.id),
      ]),
  ) as Record<string,number>;
}

export function getStoredCompetitiveStrength(table:Record<string,number>|undefined,teamId:string) {
  const team=getTeamById(teamId);
  return table?.[teamId]??team?.strength??70;
}

function getCoachCompetitiveRoster(career:CoachCareerState,teamId:string) {
  const players=
    teamId===career.team.teamId
      ?career.team.roster
      :career.playerPool.filter(player=>player.teamId===teamId);

  return [...players]
    .sort((a,b)=>{
      if(a.starter!==b.starter)return a.starter?-1:1;
      if(b.overall!==a.overall)return b.overall-a.overall;
      return a.id.localeCompare(b.id);
    })
    .slice(0,5);
}

function getRosterQuality(roster:CoachPlayer[]) {
  return average(
    roster.map(player=>
      player.overall*.60+
      player.stats.gameSense*.12+
      player.stats.communication*.10+
      player.stats.consistency*.10+
      player.stats.mental*.08
    ),
  );
}

function getStarPower(roster:CoachPlayer[]) {
  return average(
    [...roster]
      .sort((a,b)=>b.overall-a.overall)
      .slice(0,2)
      .map(player=>player.overall),
  );
}

function getRoleBalance(roster:CoachPlayer[]) {
  type NonIGLRole=Exclude<CoachPlayer["role"],"IGL">;

  const roles:NonIGLRole[]=roster.map(player=>player.role);
  const required:NonIGLRole[]=["Duelist","Initiator","Controller","Sentinel"];

  let score=65;

  required.forEach(role=>{
    if(roles.includes(role))score+=7;
  });

  if(new Set(roles).size>=4)score+=7;

  return clamp(score,50,100);
}

function average(values:number[]) {
  return values.length?values.reduce((total,value)=>total+value,0)/values.length:0;
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}