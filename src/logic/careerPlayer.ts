import type {CareerEffects,CareerPlayer} from "../types/career";
import {applyPlayerStatChange} from "../utils/playerStatsProgression";

const clamp = (value:number) => Math.max(0,Math.min(100,value));

export function applyCareerEffects(player:CareerPlayer,effects:CareerEffects):CareerPlayer {
  return {
    ...player,
    stats:{
      aim:applyPlayerStatChange(player.stats.aim,effects.aim ?? 0),
      gameSense:applyPlayerStatChange(player.stats.gameSense,effects.gameSense ?? 0),
      communication:applyPlayerStatChange(player.stats.communication,effects.communication ?? 0),
      clutch:applyPlayerStatChange(player.stats.clutch,effects.clutch ?? 0),
      consistency:applyPlayerStatChange(player.stats.consistency,effects.consistency ?? 0),
      mental:applyPlayerStatChange(player.stats.mental,effects.mental ?? 0),
    },
    reputationStats:{
      reputation:clamp(player.reputationStats.reputation + (effects.reputation ?? 0)),
      popularity:clamp(player.reputationStats.popularity + (effects.popularity ?? 0)),
      professionalism:clamp(player.reputationStats.professionalism + (effects.professionalism ?? 0)),
      teamwork:clamp(player.reputationStats.teamwork + (effects.teamwork ?? 0)),
      toxicity:clamp(player.reputationStats.toxicity + (effects.toxicity ?? 0)),
    },
    followers:Math.max(0,player.followers + (effects.followers ?? 0)),
    earnings:Math.max(0,player.earnings + (effects.earnings ?? 0)),
    careerPoints:Math.max(0,player.careerPoints + (effects.careerPoints ?? 0)),
    currentTeam:effects.currentTeam ?? player.currentTeam,
    currentStage:effects.currentStage ?? player.currentStage,
  };
}

export function normalizePlayerCosmetics(player:CareerPlayer):CareerPlayer {
  return {
    ...player,
    equippedBannerId:player.equippedBannerId ?? "rookie",
    equippedTitleId:player.equippedTitleId ?? "unknown-prospect",
    unlockedBannerIds:player.unlockedBannerIds?.length ? player.unlockedBannerIds : ["rookie"],
    unlockedTitleIds:player.unlockedTitleIds?.length ? player.unlockedTitleIds : ["unknown-prospect"],
  };
}