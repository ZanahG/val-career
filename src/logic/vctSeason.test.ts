import {describe,expect,it} from "vitest";
import {createTestPlayer} from "../test/helpers";
import {withSeed} from "../utils/rng";
import {continueVCTAfterNarrativeEvent,createVCTSeason,playNextVCTMatch,resumeVCTAfterMidseasonMarket} from "./vctSeason";
import {TEAMS,getTeamById} from "../data/teams";
import type {VCTSeasonState} from "../types/vct";
import type {CareerPlayer} from "../types/career";

function playUntilMidseasonMarket(player:CareerPlayer):VCTSeasonState {
  let season=createVCTSeason(player);

  for(let step=0;step<400;step++){
    if(season.marketWindowPending==="midseason")return season;
    if(season.phase==="Complete")break;

    season=season.pendingEvent?continueVCTAfterNarrativeEvent(season):playNextVCTMatch(player,season);
  }

  throw new Error("No se llegó al mercado de mitad de temporada");
}

function playToEnd(player:CareerPlayer,initial:VCTSeasonState):VCTSeasonState {
  let season=initial;

  for(let step=0;step<400&&season.phase!=="Complete";step++){
    season=season.pendingEvent?continueVCTAfterNarrativeEvent(season):playNextVCTMatch(player,season);
  }

  return season;
}

describe("cambio de circuito a mitad de temporada",()=>{
  for(const seed of [1,2,3,4,5]){
    it(`la tabla de puntos pasa al nuevo circuito (semilla ${seed})`,()=>withSeed(seed,()=>{
      const americasPlayer=createTestPlayer();
      const midseason=playUntilMidseasonMarket(americasPlayer);

      const emeaTeam=getTeamById("fnatic")!;
      const emeaPlayer:CareerPlayer={...americasPlayer,currentTeamId:emeaTeam.id,currentTeam:emeaTeam.name};

      const resumed=resumeVCTAfterMidseasonMarket(emeaPlayer,midseason);
      const emeaIds=TEAMS.filter(team=>team.tier===1&&team.circuit==="EMEA").map(team=>team.id).sort();

      expect(resumed.circuit).toBe("EMEA");
      expect(Object.keys(resumed.championshipPointsByTeam).sort()).toEqual(emeaIds);

      const finished=playToEnd(emeaPlayer,resumed);
      expect(finished.phase).toBe("Complete");
      expect(Object.keys(finished.championshipPointsByTeam).sort()).toEqual(emeaIds);
    }));
  }

  it("quedarse en el mismo equipo no cambia la tabla",()=>withSeed(7,()=>{
    const player=createTestPlayer();
    const midseason=playUntilMidseasonMarket(player);
    const resumed=resumeVCTAfterMidseasonMarket(player,midseason);

    expect(resumed.championshipPointsByTeam).toEqual(midseason.championshipPointsByTeam);
  }));

  it("cambiar de equipo dentro del mismo circuito conserva la tabla",()=>withSeed(8,()=>{
    const player=createTestPlayer();
    const midseason=playUntilMidseasonMarket(player);
    const sentinels=getTeamById("sentinels")!;
    const resumed=resumeVCTAfterMidseasonMarket({...player,currentTeamId:sentinels.id,currentTeam:sentinels.name},midseason);

    expect(resumed.championshipPointsByTeam).toEqual(midseason.championshipPointsByTeam);
  }));
});
