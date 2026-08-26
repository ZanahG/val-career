import type {CoachCareerState} from "../types/coach";
import {getNextPlayerChampionsMatch} from "./championsBracket";
import {getNextPlayerKickoffMatch} from "./kickoffBracket";
import {getNextPlayerMastersMatch} from "./mastersBracket";
import {getNextPlayerStageMatch} from "./coachStage";

export const COACH_TRAINING_SESSIONS_PER_PERIOD=3;

export function refreshCoachTrainingPeriod(career:CoachCareerState):CoachCareerState {
  const period=getCoachTrainingPeriod(career);

  if(!period||career.team.trainingPeriod===period)return career;

  const previousPeriod=career.team.trainingPeriod;
  const trainedMaps=career.team.trainedMapsThisPeriod??[];

  const mapPool=!previousPeriod
    ?career.team.mapPool
    :{
      ...career.team.mapPool,
      maps:career.team.mapPool.maps.map(map=>({
        ...map,
        preparation:Math.max(
          45,
          map.preparation-(trainedMaps.includes(map.map)?1:3),
        ),
      })),
    };

  return {
    ...career,
    team:{
      ...career.team,
      mapPool,
      trainingSessions:COACH_TRAINING_SESSIONS_PER_PERIOD,
      trainingPeriod:period,
      trainedMapsThisPeriod:[],
    },
  };
}

export function getCoachTrainingPeriod(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season||season.phase==="Complete")return null;

  if(season.phase==="Kickoff"){
    const match=season.kickoffBracket?getNextPlayerKickoffMatch(season.kickoffBracket):undefined;
    return match?`Kickoff:${match.round}`:null;
  }

  if(season.phase==="Masters 1"||season.phase==="Masters 2"){
    const masters=season.phase==="Masters 1"?season.masters1:season.masters2;
    const match=masters?getNextPlayerMastersMatch(masters):undefined;
    return match?`${season.phase}:${match.round}`:null;
  }

  if(
    season.phase==="Stage 1"||
    season.phase==="Stage 1 Playoffs"||
    season.phase==="Stage 2"||
    season.phase==="Stage 2 Playoffs"
  ){
    const stage=
      season.phase==="Stage 1"||season.phase==="Stage 1 Playoffs"
        ?season.stage1
        :season.stage2;

    const match=stage?getNextPlayerStageMatch(stage):undefined;

    return match?`${season.phase}:${match.round}`:null;
  }

  if(season.phase==="Champions"){
    const match=season.champions?getNextPlayerChampionsMatch(season.champions):undefined;
    return match?`Champions:${match.round}`:null;
  }

  return null;
}