import type {CareerPlayer,ContractOffer} from "./career";
import type {SeasonState} from "./season";
import type {VCTSeasonState} from "./vct";

export interface CareerSave {
  version:1;
  player:CareerPlayer;
  screen:"career"|"offers"|"season"|"vct"|"recap"|"vctRecap"|"market";
  currentEventId:string;
  season:SeasonState|null;
  vctSeason:VCTSeasonState|null;
  marketWindow?:"midseason"|"offseason"|null;
  marketOffers?:ContractOffer[];
  savedAt:number;
  renewalOffer?:ContractOffer|null;
}