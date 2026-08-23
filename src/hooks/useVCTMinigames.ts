import {useEffect,useState} from "react";
import {rollVCTMinigame,type VCTMinigameType} from "../data/vctMinigames";
import type {PlayableVCTPhase} from "../types/vct";

const MINIGAME_COOLDOWN = 5;

export function useVCTMinigames() {
  const [activeMinigame,setActiveMinigame] = useState<VCTMinigameType|null>(null);
  const [queuedMinigame,setQueuedMinigame] = useState<VCTMinigameType|null>(null);
  const [lastMinigame,setLastMinigame] = useState<VCTMinigameType|null>(null);
  const [cooldown,setCooldown] = useState(0);

  useEffect(() => {
    const debugWindow = window as typeof window & {spawnMinigame?:(type:VCTMinigameType) => void};

    debugWindow.spawnMinigame = (type) => {
      setQueuedMinigame(null);
      setActiveMinigame(type);
    };

    return () => {
      delete debugWindow.spawnMinigame;
    };
  },[]);

  const resetMinigameState = () => {
    setActiveMinigame(null);
    setQueuedMinigame(null);
    setLastMinigame(null);
    setCooldown(0);
  };

  const skipMinigame = () => {
    setActiveMinigame(null);
    setQueuedMinigame(null);
  };

  const completeMinigame = () => {
    setActiveMinigame(null);
  };

  const queueMinigameAfterMatch = (phase:PlayableVCTPhase,waitForBoxScore:boolean) => {
    if (cooldown > 0) {
      setCooldown((value) => Math.max(0,value - 1));
      return;
    }

    const minigame = rollVCTMinigame(phase,lastMinigame ?? undefined);
    if (!minigame) return;

    setLastMinigame(minigame);
    setCooldown(MINIGAME_COOLDOWN);

    if (waitForBoxScore) {
      setQueuedMinigame(minigame);
      return;
    }

    setActiveMinigame(minigame);
  };

  const openQueuedMinigame = () => {
    if (!queuedMinigame) return;

    setActiveMinigame(queuedMinigame);
    setQueuedMinigame(null);
  };

  return {
    activeMinigame,
    resetMinigameState,
    skipMinigame,
    completeMinigame,
    queueMinigameAfterMatch,
    openQueuedMinigame,
  };
}