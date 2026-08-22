import type {CareerPlayer,ContractOffer} from "./career";
import type {SeasonState} from "./season";
import type {VCTSeasonState} from "./vct";
import type {VCTRosterState} from "./vctRosters";

export interface CareerSave {
  version:1;
  player:CareerPlayer;
  screen:"career"|"offers"|"season"|"vct"|"recap"|"vctRecap"|"market"|"vctOffseason";
  currentEventId:string;
  season:SeasonState|null;
  vctSeason:VCTSeasonState|null;
  marketWindow?:"midseason"|"offseason"|null;
  marketOffers?:ContractOffer[];
  savedAt:number;
  renewalOffer?:ContractOffer|null;
  vctRosters?:VCTRosterState;
}