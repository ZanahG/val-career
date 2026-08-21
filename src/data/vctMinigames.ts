import type {PlayableVCTPhase} from "../types/vct";

export type VCTMinigameType = "clutch-defuse"|"aim-trainer"|"economy-decision"|"comms-filter"|"warmup-sequence"|"tilt-control";

type MinigameWeights = Record<VCTMinigameType,number>;

const MINIGAME_CHANCE = .35;

const DEFAULT_WEIGHTS:MinigameWeights = {"aim-trainer":17,"economy-decision":17,"comms-filter":17,"clutch-defuse":17,"warmup-sequence":16,"tilt-control":16};

const VCT_MINIGAME_WEIGHTS:Record<PlayableVCTPhase,MinigameWeights> = {
  Kickoff:{"aim-trainer":22,"economy-decision":18,"comms-filter":15,"clutch-defuse":15,"warmup-sequence":20,"tilt-control":10},
  "Masters 1":{"aim-trainer":15,"economy-decision":20,"comms-filter":15,"clutch-defuse":20,"warmup-sequence":10,"tilt-control":20},
  "Stage 1":{"aim-trainer":15,"economy-decision":15,"comms-filter":20,"clutch-defuse":15,"warmup-sequence":25,"tilt-control":10},
  "Stage 1 Playoffs":{"aim-trainer":10,"economy-decision":15,"comms-filter":20,"clutch-defuse":25,"warmup-sequence":10,"tilt-control":20},
  "Masters 2":{"aim-trainer":15,"economy-decision":20,"comms-filter":15,"clutch-defuse":20,"warmup-sequence":10,"tilt-control":20},
  "Stage 2":{"aim-trainer":15,"economy-decision":15,"comms-filter":20,"clutch-defuse":15,"warmup-sequence":20,"tilt-control":15},
  "Stage 2 Playoffs":{"aim-trainer":10,"economy-decision":15,"comms-filter":15,"clutch-defuse":25,"warmup-sequence":10,"tilt-control":25},
  Champions:{"aim-trainer":10,"economy-decision":15,"comms-filter":15,"clutch-defuse":25,"warmup-sequence":10,"tilt-control":25},
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