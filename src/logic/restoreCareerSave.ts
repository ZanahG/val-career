import {generateMidseasonOffers,generateOffers,generateRenewalOffer} from "../data/offers";
import {createInitialVCTRosterState} from "../data/vctPlayers";
import {normalizePlayerCosmetics} from "./careerPlayer";
import type {CareerPlayer,ContractOffer} from "../types/career";
import type {MarketWindow} from "../types/navigation";
import type {CareerSave} from "../types/save";
import type {VCTRosterState} from "../types/vctRosters";

export interface RestoredCareerSave {
  player:CareerPlayer;
  marketWindow:MarketWindow;
  renewalOffer:ContractOffer|null;
  marketOffers:ContractOffer[];
  vctRosters:VCTRosterState|undefined;
}

export function restoreCareerSave(save:CareerSave):RestoredCareerSave {
  const player = normalizePlayerCosmetics(save.player);
  const marketWindow:MarketWindow = save.marketWindow ?? save.vctSeason?.marketWindowPending ?? null;
  const renewalOffer = save.renewalOffer ?? (marketWindow === "offseason" ? generateRenewalOffer(player) : null);

  let marketOffers = save.marketOffers ?? [];

  if (save.screen === "offers" && marketWindow && !marketOffers.length) {
    marketOffers = marketWindow === "midseason" ? generateMidseasonOffers(player) : generateOffers(player);
  }

  const vctRosters = save.vctRosters ?? (player.currentStage === "VCT" ? createInitialVCTRosterState(player.season) : undefined);

  return {
    player,
    marketWindow,
    renewalOffer,
    marketOffers,
    vctRosters,
  };
}