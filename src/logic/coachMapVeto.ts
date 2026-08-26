import type {CoachMapName,CoachMapPool,CoachMapVetoState,CoachVetoSelection,CoachVetoStep} from "../types/coach";
import {getMapScore} from "./coachMapPool";

const BO3_VETO_STEPS:CoachVetoStep[]=[
  {team:"player",action:"ban"},
  {team:"opponent",action:"ban"},
  {team:"player",action:"pick"},
  {team:"opponent",action:"pick"},
  {team:"player",action:"ban"},
  {team:"opponent",action:"ban"},
  {team:"player",action:"ban"},
  {team:"opponent",action:"ban"},
];

const BO5_VETO_STEPS:CoachVetoStep[]=[
  {team:"player",action:"ban"},
  {team:"opponent",action:"ban"},
  {team:"player",action:"pick"},
  {team:"opponent",action:"pick"},
  {team:"player",action:"pick"},
  {team:"opponent",action:"pick"},
  {team:"player",action:"ban"},
  {team:"opponent",action:"ban"},
];

export function createCoachMapVeto(opponentTeamId:string,maps:CoachMapName[],bestOf:3|5=3):CoachMapVetoState {
  return {
    opponentTeamId,
    bestOf,
    availableMaps:[...maps],
    selections:[],
    currentStep:0,
    completed:false,
    seriesMaps:[],
  };
}

export function getCoachVetoSteps(bestOf:3|5):CoachVetoStep[] {
  return bestOf===5?BO5_VETO_STEPS:BO3_VETO_STEPS;
}

export function getCurrentVetoStep(state:CoachMapVetoState) {
  return getCoachVetoSteps(state.bestOf)[state.currentStep]??null;
}

export function applyPlayerVetoSelection(state:CoachMapVetoState,map:CoachMapName):CoachMapVetoState {
  const step=getCurrentVetoStep(state);

  if(!step||step.team!=="player"||!state.availableMaps.includes(map))return state;

  return applySelection(state,{map,team:"player",action:step.action});
}

export function applyOpponentVetoSelection(state:CoachMapVetoState,opponentPool:CoachMapPool,playerPool:CoachMapPool):CoachMapVetoState {
  const step=getCurrentVetoStep(state);

  if(!step||step.team!=="opponent")return state;

  const map=chooseOpponentMap(state.availableMaps,step.action,opponentPool,playerPool);

  if(!map)return state;

  return applySelection(state,{map,team:"opponent",action:step.action});
}

function applySelection(state:CoachMapVetoState,selection:CoachVetoSelection):CoachMapVetoState {
  const steps=getCoachVetoSteps(state.bestOf);
  const availableMaps=state.availableMaps.filter(map=>map!==selection.map);
  const selections=[...state.selections,selection];
  const nextStep=state.currentStep+1;

  if(nextStep>=steps.length){
    const decider=availableMaps[0]??null;

    const picks=selections
      .filter(item=>item.action==="pick")
      .map(item=>item.map);

    const seriesMaps=decider?[...picks,decider]:picks;

    return {
      ...state,
      availableMaps:[],
      selections,
      currentStep:nextStep,
      completed:true,
      seriesMaps,
    };
  }

  return {
    ...state,
    availableMaps,
    selections,
    currentStep:nextStep,
  };
}

function chooseOpponentMap(maps:CoachMapName[],action:"ban"|"pick",opponentPool:CoachMapPool,playerPool:CoachMapPool) {
  const scored=maps.map(map=>{
    const opponent=getPoolScore(opponentPool,map);
    const player=getPoolScore(playerPool,map);

    return {
      map,
      difference:opponent-player,
      opponent,
      player,
    };
  });

  if(action==="pick"){
    return scored
      .sort((a,b)=>
        b.difference-a.difference||
        b.opponent-a.opponent||
        a.player-b.player
      )[0]?.map;
  }

  return scored
    .sort((a,b)=>
      a.difference-b.difference||
      b.player-a.player||
      a.opponent-b.opponent
    )[0]?.map;
}

function getPoolScore(pool:CoachMapPool,map:CoachMapName) {
  const profile=pool.maps.find(item=>item.map===map);

  return profile?getMapScore(profile):50;
}