import type {CoachCareerState,CoachMapName} from "../types/coach";
import {simulateCoachSeries} from "./coachMatchSimulation";
import {getTeamById} from "../data/teams";

export interface CoachBalanceScenario {
  id:string;
  label:string;
  career:CoachCareerState;
  opponentTeamId:string;
  maps:CoachMapName[];
  iterations:number;
}

export interface CoachBalanceResult {
  id:string;
  label:string;
  iterations:number;
  seriesWins:number;
  seriesLosses:number;
  winRate:number;
  averageMapsWon:number;
  averageMapsLost:number;
}

export function runCoachBalanceScenario(scenario:CoachBalanceScenario):CoachBalanceResult {
  let seriesWins=0;
  let seriesLosses=0;
  let mapsWon=0;
  let mapsLost=0;

  for(let index=0;index<scenario.iterations;index++){
    const simulation=simulateCoachSeries(scenario.career,scenario.opponentTeamId,scenario.maps);
    if(!simulation)continue;

    if(simulation.result.won)seriesWins++;
    else seriesLosses++;

    mapsWon+=simulation.result.mapsWon;
    mapsLost+=simulation.result.mapsLost;
  }

  const completed=seriesWins+seriesLosses;

  return {
    id:scenario.id,
    label:scenario.label,
    iterations:completed,
    seriesWins,
    seriesLosses,
    winRate:completed?Number(((seriesWins/completed)*100).toFixed(2)):0,
    averageMapsWon:completed?Number((mapsWon/completed).toFixed(2)):0,
    averageMapsLost:completed?Number((mapsLost/completed).toFixed(2)):0,
  };
}

export function runCoachBalanceSuite(scenarios:CoachBalanceScenario[]) {
  return scenarios.map(runCoachBalanceScenario);
}

export function cloneCoachBalanceCareer(career:CoachCareerState):CoachCareerState {
  return structuredClone(career);
}

export function createCoachBalanceVariant(
  career:CoachCareerState,
  changes:Partial<CoachCareerState["team"]["tactics"]>&{tacticalStyle?:CoachCareerState["team"]["tacticalStyle"]},
) {
  const variant=cloneCoachBalanceCareer(career);
  const {tacticalStyle,...tactics}=changes;

  variant.team={
    ...variant.team,
    tacticalStyle:tacticalStyle??variant.team.tacticalStyle,
    tactics:{...variant.team.tactics,...tactics},
  };

  return variant;
}
export function createDefaultCoachBalanceSuite(
  career:CoachCareerState,
  opponentTeamId:string,
  maps:CoachMapName[],
  iterations=5000,
):CoachBalanceScenario[] {
  return [
    {
      id:"balanced",
      label:"Balanced baseline",
      career:createCoachBalanceVariant(career,{
        tacticalStyle:"Balanced",
        pace:"Balanced",
        risk:"Medium",
        attackStyle:"Defaults",
        defenseStyle:"Standard",
        operatorUsage:"Situational",
      }),
      opponentTeamId,
      maps,
      iterations,
    },
    {
      id:"aggressive",
      label:"Aggressive optimal",
      career:createCoachBalanceVariant(career,{
        tacticalStyle:"Aggressive",
        pace:"Fast",
        risk:"High",
        attackStyle:"Explosive",
        defenseStyle:"Aggressive",
        operatorUsage:"Rare",
      }),
      opponentTeamId,
      maps,
      iterations,
    },
    {
      id:"controlled",
      label:"Controlled optimal",
      career:createCoachBalanceVariant(career,{
        tacticalStyle:"Controlled",
        pace:"Slow",
        risk:"Low",
        attackStyle:"Map Control",
        defenseStyle:"Standard",
        operatorUsage:"Situational",
      }),
      opponentTeamId,
      maps,
      iterations,
    },
    {
      id:"reactive",
      label:"Reactive optimal",
      career:createCoachBalanceVariant(career,{
        tacticalStyle:"Reactive",
        pace:"Balanced",
        risk:"Medium",
        attackStyle:"Defaults",
        defenseStyle:"Retake",
        operatorUsage:"Situational",
      }),
      opponentTeamId,
      maps,
      iterations,
    },
    {
      id:"anti-strat",
      label:"Anti-Strat optimal",
      career:createCoachBalanceVariant(career,{
        tacticalStyle:"Anti-Strat",
        pace:"Balanced",
        risk:"Medium",
        attackStyle:"Defaults",
        defenseStyle:"Retake",
        operatorUsage:"Situational",
      }),
      opponentTeamId,
      maps,
      iterations,
    },
  ];
}

export function createExtremeCoachBalanceSuite(
  career:CoachCareerState,
  opponentTeamId:string,
  maps:CoachMapName[],
  iterations=1000,
):CoachBalanceScenario[] {
  const highRisk=createCoachBalanceVariant(career,{risk:"High"});
  const mediumRisk=createCoachBalanceVariant(career,{risk:"Medium"});
  const lowRisk=createCoachBalanceVariant(career,{risk:"Low"});

  const preparedAntiStrat=createCoachBalanceVariant(career,{
    tacticalStyle:"Anti-Strat",
    pace:"Balanced",
    risk:"Medium",
    attackStyle:"Defaults",
    defenseStyle:"Retake",
    operatorUsage:"Situational",
  });

  preparedAntiStrat.team.mapPool={
    ...preparedAntiStrat.team.mapPool,
    maps:preparedAntiStrat.team.mapPool.maps.map(map=>({...map,preparation:92})),
  };

  const unpreparedAntiStrat=createCoachBalanceVariant(career,{
    tacticalStyle:"Anti-Strat",
    pace:"Balanced",
    risk:"Medium",
    attackStyle:"Defaults",
    defenseStyle:"Retake",
    operatorUsage:"Situational",
  });

  unpreparedAntiStrat.team.mapPool={
    ...unpreparedAntiStrat.team.mapPool,
    maps:unpreparedAntiStrat.team.mapPool.maps.map(map=>({...map,preparation:62})),
  };

  const priorityOperator=createCoachBalanceVariant(career,{operatorUsage:"Priority"});
  const rareOperator=createCoachBalanceVariant(career,{operatorUsage:"Rare"});
  const situationalOperator=createCoachBalanceVariant(career,{operatorUsage:"Situational"});

  const goodRoles=cloneCoachBalanceCareer(career);
  const badRoles=cloneCoachBalanceCareer(career);

  const starters=badRoles.team.roster.filter(player=>player.starter).slice(0,5);

  badRoles.team.playerAssignments=starters.map((player,index)=>({
    playerId:player.id,
    tacticalRole:index<3?"IGL":"Main Operator",
  }));

  return [
    {id:"risk-high",label:"Risk High",career:highRisk,opponentTeamId,maps,iterations},
    {id:"risk-medium",label:"Risk Medium",career:mediumRisk,opponentTeamId,maps,iterations},
    {id:"risk-low",label:"Risk Low",career:lowRisk,opponentTeamId,maps,iterations},
    {id:"anti-prepared",label:"Anti-Strat prepared",career:preparedAntiStrat,opponentTeamId,maps,iterations},
    {id:"anti-unprepared",label:"Anti-Strat unprepared",career:unpreparedAntiStrat,opponentTeamId,maps,iterations},
    {id:"operator-priority",label:"Operator Priority",career:priorityOperator,opponentTeamId,maps,iterations},
    {id:"operator-situational",label:"Operator Situational",career:situationalOperator,opponentTeamId,maps,iterations},
    {id:"operator-rare",label:"Operator Rare",career:rareOperator,opponentTeamId,maps,iterations},
    {id:"roles-good",label:"Current roles",career:goodRoles,opponentTeamId,maps,iterations},
    {id:"roles-bad",label:"Broken roles",career:badRoles,opponentTeamId,maps,iterations},
  ];
}

export function getCoachBalanceOpponents(career:CoachCareerState,maps:CoachMapName[],iterations=200) {
  const baseline=createCoachBalanceVariant(career,{
    tacticalStyle:"Balanced",
    pace:"Balanced",
    risk:"Medium",
    attackStyle:"Defaults",
    defenseStyle:"Standard",
    operatorUsage:"Situational",
  });

  const teamIds=[...new Set(
    career.playerPool
      .map(player=>player.teamId)
      .filter((teamId):teamId is string=>Boolean(teamId)&&teamId!==career.team.teamId),
  )];

  const candidates=teamIds
    .map(teamId=>{
      const result=runCoachBalanceScenario({
        id:`calibration-${teamId}`,
        label:teamId,
        career:baseline,
        opponentTeamId:teamId,
        maps,
        iterations,
      });

      return {
        teamId,
        winRate:result.winRate,
        iterations:result.iterations,
      };
    })
    .filter(result=>result.iterations>0);

  if(!candidates.length)return null;

  const closestTo=(target:number)=>{
    return [...candidates].sort((a,b)=>Math.abs(a.winRate-target)-Math.abs(b.winRate-target))[0];
  };

  return {
    favorite:closestTo(70),
    equal:closestTo(50),
    underdog:closestTo(30),
    calibration:[...candidates].sort((a,b)=>b.winRate-a.winRate),
  };
}