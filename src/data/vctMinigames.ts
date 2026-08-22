import type {PlayableVCTPhase} from "../types/vct";

export type VCTMinigameType = "clutch-defuse"|"aim-trainer"|"economy-decision"|"comms-filter"|"warmup-sequence"|"tilt-control"|"plant-timing";

type MinigameWeights = Record<VCTMinigameType,number>;

const MINIGAME_CHANCE = .35;

const DEFAULT_WEIGHTS:MinigameWeights = {
  "aim-trainer":15,
  "economy-decision":15,
  "comms-filter":15,
  "clutch-defuse":15,
  "warmup-sequence":14,
  "tilt-control":13,
  "plant-timing":13,
};

const VCT_MINIGAME_WEIGHTS:Record<PlayableVCTPhase,MinigameWeights> = {
  Kickoff:{
    "aim-trainer":20,
    "economy-decision":16,
    "comms-filter":13,
    "clutch-defuse":13,
    "warmup-sequence":18,
    "tilt-control":9,
    "plant-timing":11,
  },

  "Masters 1":{
    "aim-trainer":13,
    "economy-decision":17,
    "comms-filter":13,
    "clutch-defuse":17,
    "warmup-sequence":9,
    "tilt-control":17,
    "plant-timing":14,
  },

  "Stage 1":{
    "aim-trainer":13,
    "economy-decision":13,
    "comms-filter":17,
    "clutch-defuse":13,
    "warmup-sequence":22,
    "tilt-control":9,
    "plant-timing":13,
  },

  "Stage 1 Playoffs":{
    "aim-trainer":9,
    "economy-decision":13,
    "comms-filter":17,
    "clutch-defuse":22,
    "warmup-sequence":9,
    "tilt-control":17,
    "plant-timing":13,
  },

  "Masters 2":{
    "aim-trainer":13,
    "economy-decision":17,
    "comms-filter":13,
    "clutch-defuse":17,
    "warmup-sequence":9,
    "tilt-control":17,
    "plant-timing":14,
  },

  "Stage 2":{
    "aim-trainer":13,
    "economy-decision":13,
    "comms-filter":17,
    "clutch-defuse":13,
    "warmup-sequence":17,
    "tilt-control":13,
    "plant-timing":14,
  },

  "Stage 2 Playoffs":{
    "aim-trainer":9,
    "economy-decision":13,
    "comms-filter":13,
    "clutch-defuse":22,
    "warmup-sequence":9,
    "tilt-control":22,
    "plant-timing":12,
  },

  Champions:{
    "aim-trainer":9,
    "economy-decision":13,
    "comms-filter":13,
    "clutch-defuse":22,
    "warmup-sequence":9,
    "tilt-control":22,
    "plant-timing":12,
  },
};

export function rollVCTMinigame(phase:PlayableVCTPhase,lastMinigame?:VCTMinigameType):VCTMinigameType|null {
  if (Math.random() >= MINIGAME_CHANCE) return null;

  const weights = VCT_MINIGAME_WEIGHTS[phase] ?? DEFAULT_WEIGHTS;
  const entries = Object.entries(weights).filter(([type]) => type !== lastMinigame) as [VCTMinigameType,number][];
  const total = entries.reduce((sum,[,weight]) => sum + weight,0);

  let roll = Math.random() * total;

  for (const [type,weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }

  return entries.at(-1)?.[0] ?? null;
}