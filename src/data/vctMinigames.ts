import type {PlayableVCTPhase} from "../types/vct";

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

const MINIGAME_CHANCE = .35;

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
  if (Math.random() >= MINIGAME_CHANCE) return null;

  const available = MINIGAMES.filter((type) => type !== lastMinigame);

  return available[Math.floor(Math.random() * available.length)] ?? null;
}