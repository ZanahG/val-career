import type {VCTRealPlayer} from "../data/vctPlayers";
import {getVCTPlayerOverallExact} from "../utils/vctPlayerOverall";

const random = (min:number,max:number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));

export function progressVCTPlayers(players:VCTRealPlayer[]):VCTRealPlayer[] {
  return players.map((player) => progressVCTPlayer(player));
}

function progressVCTPlayer(player:VCTRealPlayer):VCTRealPlayer {
  const overall = getVCTPlayerOverallExact(player);
  const baseDelta = getDevelopmentDelta(overall);

  return {
    ...player,
    stats:{
      aim:progressStat(player.stats.aim,baseDelta),
      clutch:progressStat(player.stats.clutch,baseDelta),
      gameSense:progressStat(player.stats.gameSense,baseDelta),
      communication:progressStat(player.stats.communication,baseDelta),
      consistency:progressStat(player.stats.consistency,baseDelta),
      mental:progressStat(player.stats.mental,baseDelta),
    },
  };
}

function getDevelopmentDelta(overall:number) {
  const roll = Math.random();

  if (overall >= 92) {
    if (roll < .20) return -2;
    if (roll < .55) return -1;
    if (roll < .90) return 0;
    return 1;
  }

  if (overall >= 87) {
    if (roll < .12) return -1;
    if (roll < .50) return 0;
    if (roll < .88) return 1;
    return 2;
  }

  if (overall >= 82) {
    if (roll < .08) return -1;
    if (roll < .35) return 0;
    if (roll < .78) return 1;
    return 2;
  }

  if (overall >= 76) {
    if (roll < .05) return -1;
    if (roll < .25) return 0;
    if (roll < .68) return 1;
    if (roll < .92) return 2;
    return 3;
  }

  if (roll < .15) return 0;
  if (roll < .55) return 1;
  if (roll < .88) return 2;
  return 3;
}

function progressStat(stat:number,baseDelta:number) {
  const individualVariation = random(-1,1);
  return clamp(stat + baseDelta + individualVariation,55,99);
}