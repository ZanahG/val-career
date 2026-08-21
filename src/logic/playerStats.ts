import type {CareerPlayer} from "../types/career";
import type {PlayerStatEffect,PlayerStatKey} from "../types/playerStats";

export const PLAYER_STAT_MIN = 0;
export const PLAYER_STAT_MAX = 100;

export function clampPlayerStat(value: number) {
  return Math.max(PLAYER_STAT_MIN,Math.min(PLAYER_STAT_MAX,value));
}

export function applyPlayerStatEffects(player: CareerPlayer,effects: PlayerStatEffect[]): CareerPlayer {
  if (effects.length === 0) return player;

  const stats = {...player.stats};

  effects.forEach((effect) => {
    stats[effect.stat] = clampPlayerStat(stats[effect.stat] + effect.amount);
  });

  return {...player,stats};
}

export function getPlayerStatLabel(stat: PlayerStatKey,language: "es"|"en") {
  const labels: Record<PlayerStatKey,{es:string;en:string}> = {
    aim: {es:"AIM",en:"AIM"},
    gameSense: {es:"GAME SENSE",en:"GAME SENSE"},
    communication: {es:"COMUNICACIÓN",en:"COMMUNICATION"},
    clutch: {es:"CLUTCH",en:"CLUTCH"},
    consistency: {es:"CONSISTENCIA",en:"CONSISTENCY"},
    mental: {es:"MENTAL",en:"MENTAL"},
  };

  return labels[stat][language];
}

export function getPlayerStatEffectsSummary(effects: PlayerStatEffect[],language: "es"|"en") {
  return effects.map((effect) => ({...effect,label:getPlayerStatLabel(effect.stat,language),direction:effect.amount >= 0 ? "up" as const : "down" as const}));
}