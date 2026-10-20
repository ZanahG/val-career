import {randomFloat} from "../utils/rng";
import type {PlayableVCTPhase} from "../types/vct";
import {MINIGAME_BALANCE} from "../config/balance";

export type VCTMinigameType =
  | "clutch-defuse"
  | "aim-trainer"
  | "economy-decision"
  | "comms-filter"
  | "warmup-sequence"
  | "tilt-control"
  | "plant-timing"
  | "spray-control"
  | "prefire-training";

const MINIGAME_CHANCE = MINIGAME_BALANCE.chance;

const MINIGAMES:VCTMinigameType[] = [
  "clutch-defuse",
  "aim-trainer",
  "economy-decision",
  "comms-filter",
  "warmup-sequence",
  "plant-timing",
  "spray-control",
];

export function rollVCTMinigame(_phase:PlayableVCTPhase,lastMinigame?:VCTMinigameType):VCTMinigameType|null {
  if (randomFloat() >= MINIGAME_CHANCE) return null;

  const available = MINIGAMES.filter((type) => type !== lastMinigame);

  return available[Math.floor(randomFloat() * available.length)] ?? null;
}
/* Minijuegos con pantalla implementada en MinigameRenderer. "spray-control"
   sigue en el sorteo para no alterar la frecuencia ni el enfriamiento
   históricos, pero no tiene pantalla: cuando sale, no se muestra nada (igual
   que antes) y ya no queda un minijuego invisible marcado como activo. */
export const PLAYABLE_MINIGAMES:ReadonlySet<VCTMinigameType> = new Set<VCTMinigameType>([
  "clutch-defuse",
  "aim-trainer",
  "economy-decision",
  "comms-filter",
  "warmup-sequence",
  "tilt-control",
  "plant-timing",
  "prefire-training",
]);

export function isPlayableMinigame(type:VCTMinigameType) {
  return PLAYABLE_MINIGAMES.has(type);
}

export interface MinigameScheduleState {
  cooldown:number;
  lastMinigame:VCTMinigameType|null;
}

export interface MinigameSchedulePlan extends MinigameScheduleState {
  /* Minijuego que se debe mostrar, o null si no corresponde ninguno. */
  minigame:VCTMinigameType|null;
}

/* Decide qué ocurre después de un partido VCT. Reproduce exactamente la
   lógica que vivía en useVCTMinigames. */
export function planMinigameAfterMatch(phase:PlayableVCTPhase,state:MinigameScheduleState,cooldownMatches:number):MinigameSchedulePlan {
  if (state.cooldown > 0) {
    return {...state,cooldown:Math.max(0,state.cooldown - 1),minigame:null};
  }

  const rolled = rollVCTMinigame(phase,state.lastMinigame ?? undefined);
  if (!rolled) return {...state,minigame:null};

  return {
    cooldown:cooldownMatches,
    lastMinigame:rolled,
    minigame:isPlayableMinigame(rolled) ? rolled : null,
  };
}
