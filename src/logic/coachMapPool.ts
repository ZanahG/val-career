import type {CoachMapName,CoachMapPool,CoachMapProfile} from "../types/coach";
import type {TeamDefinition} from "../types/career";

const MAPS:CoachMapName[]=["Abyss","Ascent","Bind","Breeze","Corrode","Haven","Icebox","Lotus","Pearl"];

export function createInitialCoachMapPool(team:TeamDefinition):CoachMapPool {
  const maps=MAPS.map((map,index)=>{
    const variation=getMapVariation(team.id,index);
    const strength=clamp(team.strength+variation,45,95);

    return {
      map,
      strength,
      attack:clamp(strength+random(-5,5),40,98),
      defense:clamp(strength+random(-5,5),40,98),
      preparation:random(55,78),
    };
  });

  return {maps};
}

export function trainCoachMap(pool:CoachMapPool,mapName:CoachMapName):CoachMapPool {
  return {
    maps:pool.maps.map(map=>{
      if(map.map!==mapName)return map;

      return {
        ...map,
        strength:clamp(map.strength+1,40,100),
        preparation:clamp(map.preparation+4,0,100),
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
  return Math.floor(Math.random()*(max-min+1))+min;
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}

export function getCoachMapProfile(pool:CoachMapPool,mapName:CoachMapName) {
  return pool.maps.find(map=>map.map===mapName);
}