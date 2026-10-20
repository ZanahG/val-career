import {randomFloat,withSeed} from "../utils/rng";
import type {CoachMapName,CoachMapPool,CoachMapProfile} from "../types/coach";
import type {TeamDefinition} from "../types/career";
import {COACH_TRAINING_BALANCE} from "../config/balance";

const TRAINING=COACH_TRAINING_BALANCE;

const MAPS:CoachMapName[]=["Abyss","Ascent","Bind","Breeze","Corrode","Haven","Icebox","Lotus","Pearl"];

export function createInitialCoachMapPool(team:TeamDefinition):CoachMapPool {
  const maps=MAPS.map((map,index)=>{
    const variation=getMapVariation(team.id,index);
    const strength=clamp(team.strength+variation,45,95);

    return {
      map,
      strength,
      attack:clamp(strength+random(-TRAINING.initialSideVariance,TRAINING.initialSideVariance),40,98),
      defense:clamp(strength+random(-TRAINING.initialSideVariance,TRAINING.initialSideVariance),40,98),
      preparation:random(TRAINING.initialPreparationMin,TRAINING.initialPreparationMax),
    };
  });

  return {maps};
}

/* Pool de mapas de un rival para una temporada. Usa la misma distribución que
   createInitialCoachMapPool, pero con semilla fija por rival y temporada, de
   modo que la pantalla de veto y la simulación ven exactamente los mismos
   valores (antes cada una generaba su propio pool aleatorio). */
export function getCoachOpponentMapPool(team:TeamDefinition,season:number):CoachMapPool {
  return withSeed(`${team.id}:${season}:opponent-map-pool`,()=>createInitialCoachMapPool(team));
}

export function trainCoachMap(pool:CoachMapPool,mapName:CoachMapName):CoachMapPool {
  return {
    maps:pool.maps.map(map=>{
      if(map.map!==mapName)return map;

      const preparationGain=getPreparationTrainingGain(map.preparation);

      return {
        ...map,
        preparation:clamp(map.preparation+preparationGain,0,TRAINING.preparationCap),
      };
    }),
  };
}

export function getBestCoachMaps(pool:CoachMapPool) {
  return [...pool.maps].sort((a,b)=>getMapScore(b)-getMapScore(a));
}

export function getMapScore(map:CoachMapProfile) {
  return Math.round(
    map.strength*.55+
    map.attack*.15+
    map.defense*.15+
    map.preparation*.15
  );
}

function getMapVariation(teamId:string,index:number) {
  let hash=0;

  for(let i=0;i<teamId.length;i++) {
    hash=(hash*31+teamId.charCodeAt(i))|0;
  }

  return ((Math.abs(hash+index*7919)%17)-8);
}

function random(min:number,max:number) {
  return Math.floor(randomFloat()*(max-min+1))+min;
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}

export function getCoachMapProfile(pool:CoachMapPool,mapName:CoachMapName) {
  return pool.maps.find(map=>map.map===mapName);
}

function getPreparationTrainingGain(preparation:number) {
  for(const [below,gain] of TRAINING.preparationGainSteps){
    if(preparation<below)return gain;
  }

  return 0;
}