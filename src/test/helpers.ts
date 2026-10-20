import {vi} from "vitest";
import type {CareerPlayer} from "../types/career";
import {createSeededRandom} from "../utils/rng";
import type {VCTSeasonState} from "../types/vct";
import {continueVCTAfterNarrativeEvent,createVCTSeason,playNextVCTMatch,resumeVCTAfterMidseasonMarket} from "../logic/vctSeason";

/* Sustituye Math.random por un generador con semilla. Funciona tanto con el
   código que llama a Math.random directamente como con randomFloat(). */
export function seedMathRandom(seed:number|string) {
  const source=createSeededRandom(seed);
  return vi.spyOn(Math,"random").mockImplementation(source);
}

export function freezeTime(iso="2026-10-20T12:00:00.000Z") {
  vi.useFakeTimers({toFake:["Date"]});
  vi.setSystemTime(new Date(iso));
}

export function createTestPlayer(overrides:Partial<CareerPlayer>={}):CareerPlayer {
  return {
    nickname:"Tester",
    country:"Chile",
    region:"LATAM",
    age:19,
    role:"Duelist",
    mainAgent:"Jett",
    stats:{aim:82,gameSense:74,communication:68,clutch:76,consistency:72,mental:73},
    reputationStats:{reputation:8,popularity:4,professionalism:55,teamwork:55,toxicity:5},
    followers:123,
    earnings:0,
    currentTeamId:"leviatan",
    currentTeam:"LEVIATÁN",
    currentStage:"VCT",
    rosterRole:"Starter",
    salary:8000,
    contractSeasonsRemaining:2,
    season:2026,
    careerPoints:0,
    history:[],
    trophies:[],
    vctEligible:true,
    equippedBannerId:"rookie",
    equippedTitleId:"unknown-prospect",
    unlockedBannerIds:["rookie"],
    unlockedTitleIds:["unknown-prospect"],
    ...overrides,
  };
}

/* Juega una temporada VCT completa como lo haría App.tsx, quedándose en el
   equipo durante el mercado de mitad de temporada. */
export function playFullVCTSeason(player:CareerPlayer):VCTSeasonState {
  let season=createVCTSeason(player);

  for(let step=0;step<600&&season.phase!=="Complete";step++){
    if(season.marketWindowPending==="midseason"){
      season=resumeVCTAfterMidseasonMarket(player,season);
      continue;
    }

    if(season.pendingEvent){
      season=continueVCTAfterNarrativeEvent(season);
      continue;
    }

    season=playNextVCTMatch(player,season);
  }

  return season;
}
