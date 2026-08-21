import type {CareerPlayer} from "./career";
import type {SeasonState} from "./season";
import type {VCTSeasonState} from "./vct";

export interface CareerSave {
  version: 1;
  player: CareerPlayer;
  screen: "career" | "offers" | "season" | "vct" | "recap" | "vctRecap";
  currentEventId: string;
  season: SeasonState | null;
  vctSeason: VCTSeasonState | null;
  savedAt: number;
}