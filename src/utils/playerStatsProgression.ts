import {randomFloat} from "./rng";
import {OFFSEASON_REGRESSION_BALANCE,STAT_GROWTH_BALANCE} from "../config/balance";

const GROWTH = STAT_GROWTH_BALANCE;
const REGRESSION = OFFSEASON_REGRESSION_BALANCE;
export function clampPlayerStat(value:number) {
  return Math.max(GROWTH.minStat,Math.min(GROWTH.maxStat,value));
}

export function applyPlayerStatChange(current:number,change:number) {
  if (change === 0) return current;

  if (change < 0) {
    return clampPlayerStat(current + change);
  }

  if (current >= 99) {
    return randomFloat() < GROWTH.at99Chance ? GROWTH.maxStat : current;
  }

  if (current >= 97) {
    return randomFloat() < GROWTH.from97Chance ? clampPlayerStat(current + 1) : current;
  }

  if (current >= 94) {
    return randomFloat() < GROWTH.from94Chance ? clampPlayerStat(current + 1) : current;
  }

  if (current >= GROWTH.capOneFrom) {
    return clampPlayerStat(current + Math.min(1,change));
  }

  if (current >= GROWTH.halfGainFrom) {
    return clampPlayerStat(current + Math.max(1,Math.round(change * .5)));
  }

  return clampPlayerStat(current + change);
}

interface PlayerPerformanceStats {
  aim:number;
  gameSense:number;
  communication:number;
  clutch:number;
  consistency:number;
  mental:number;
}

export function applyOffseasonRegression(stats:PlayerPerformanceStats):PlayerPerformanceStats {
  return {
    aim:clampPlayerStat(stats.aim - getRegression(stats.aim,REGRESSION.aim)),
    gameSense:clampPlayerStat(stats.gameSense - getRegression(stats.gameSense,REGRESSION.gameSense)),
    communication:clampPlayerStat(stats.communication - getRegression(stats.communication,REGRESSION.communication)),
    clutch:clampPlayerStat(stats.clutch - getRegression(stats.clutch,REGRESSION.clutch)),
    consistency:clampPlayerStat(stats.consistency - getRegression(stats.consistency,REGRESSION.consistency)),
    mental:clampPlayerStat(stats.mental - getRegression(stats.mental,REGRESSION.mental)),
  };
}

function getRegression(stat:number,[min,max]:readonly [number,number]) {
  if (stat < REGRESSION.threshold) return 0;

  return Math.floor(randomFloat() * (max - min + 1)) + min;
}
