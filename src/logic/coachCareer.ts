import type {TeamDefinition} from "../types/career";
import type {CoachCareerState} from "../types/coach";
import {createCoachTeamFinances} from "../data/coachBudgets";
import {createCoachPlayerPool} from "./coachRoster";
import {createInitialCoachCPUFinances} from "./coachCPUFinances";
import {createInitialCoachMapPool} from "./coachMapPool";

export function createCoachCareer(team:TeamDefinition,name:string,nationality:string,age:number):CoachCareerState {
  const playerPool=createCoachPlayerPool();
  const roster=playerPool.filter(player=>player.teamId===team.id).slice(0,5);
  const finances=createCoachTeamFinances(team);
  const currentMonthlyPayroll=roster.reduce((total,player)=>total+player.salary,0);
  const cpuFinancesByTeam=createInitialCoachCPUFinances(playerPool,team.id);

  return {
    coach:{
      name,
      age,
      nationality,
      reputation:team.tier===1?45:20,
      season:2026,
      teamId:team.id,
      stage:team.tier===1?"VCT":"Tier 2",
      circuit:team.circuit,
      region:team.marketRegion,
      trophies:[],
      careerHistory:[],
    },

    team:{
      teamId:team.id,
      roster,
      finances:{
        ...finances,
        currentMonthlyPayroll,
      },
      chemistry:70,
      form:50,
      tacticalStyle:"Balanced",
      tactics:{
        pace:"Balanced",
        risk:"Medium",
        attackStyle:"Defaults",
        defenseStyle:"Standard",
        operatorUsage:"Situational",
      },
      mapPool:createInitialCoachMapPool(team),
      playerAssignments:[],
      trainingSessions:3,
      trainingPeriod:null,
      trainedMapsThisPeriod:[],
    },

    playerPool,
    cpuFinancesByTeam,
    seasonState:null,
    offseason:null,
    midseasonMarket:null,
  };
}