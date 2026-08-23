import type {CareerEffects,CareerPlayer} from "../../types/career";
import type {VCTMinigameType} from "../../data/vctMinigames";

import {AimTrainerMinigame} from "./AimTrainerMinigame";
import {ClutchDefuseMinigame} from "./ClutchDefuseMinigame";
import {CommsFilterMinigame} from "./CommsFilterMinigame";
import {EconomyDecisionMinigame} from "./EconomyDecisionMinigame";
import {PlantTimingMinigame} from "./PlantTimingMinigame";
import {PrefireTrainingMinigame} from "./PrefireTrainingMinigame";
import {TiltControlMinigame} from "./TiltControlMinigame";
import {WarmupSequenceMinigame} from "./WarmupSequenceMinigame";

interface MinigameRendererProps {
  type:VCTMinigameType|null;
  onComplete:(effects:CareerEffects) => void;
  onSkip:() => void;
  player:CareerPlayer;
}

export function MinigameRenderer({type,player,onComplete,onSkip}:MinigameRendererProps) {
  if (!type) return null;

  switch (type) {
    case "aim-trainer":
      return <AimTrainerMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "clutch-defuse":
      return <ClutchDefuseMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "comms-filter":
      return <CommsFilterMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "economy-decision":
      return <EconomyDecisionMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "plant-timing":
      return <PlantTimingMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "prefire-training":
      return <PrefireTrainingMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "tilt-control":
      return <TiltControlMinigame onComplete={onComplete} onSkip={onSkip} />;

    case "warmup-sequence":
      return <WarmupSequenceMinigame onComplete={onComplete} onSkip={onSkip} />;

    default:
      return null;
  }
}