import {useEffect,useState} from "react";
import type {CareerPlayer,ContractOffer} from "../types/career";
import type {GameScreen,MarketWindow} from "../types/navigation";
import type {SeasonState} from "../types/season";
import type {VCTSeasonState} from "../types/vct";
import type {VCTRosterState} from "../types/vctRosters";
import {deleteCareerSave,hasCareerSave,saveCareer} from "../utils/saveGame";

interface UseCareerSaveParams {
  player:CareerPlayer|null;
  screen:GameScreen;
  currentEventId:string;
  season:SeasonState|null;
  vctSeason:VCTSeasonState|null;
  marketWindow:MarketWindow;
  marketOffers:ContractOffer[];
  renewalOffer:ContractOffer|null;
  vctRosters:VCTRosterState|undefined;
}

export function useCareerSave({player,screen,currentEventId,season,vctSeason,marketWindow,marketOffers,renewalOffer,vctRosters}:UseCareerSaveParams) {
  const [saveAvailable,setSaveAvailable] = useState(() => hasCareerSave());

  useEffect(() => {
    if (!player || screen === "create" || screen === "profile") return;

    saveCareer({
      version:1,
      player,
      screen,
      currentEventId,
      season,
      vctSeason,
      marketWindow,
      marketOffers,
      savedAt:Date.now(),
      renewalOffer,
      vctRosters,
    });

    setSaveAvailable(true);
  },[player,screen,currentEventId,season,vctSeason,marketWindow,marketOffers,renewalOffer,vctRosters]);

  const clearCareerSave = () => {
    deleteCareerSave();
    setSaveAvailable(false);
  };

  return {saveAvailable,clearCareerSave};
}