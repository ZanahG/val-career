import {describe,expect,it,vi} from "vitest";
import {createTestPlayer,playFullVCTSeason} from "./helpers";
import {createSeededRandom,withSeed} from "../utils/rng";
import {getTeamById} from "../data/teams";
import {getCoachOpponentMapPool,trainCoachMap,createInitialCoachMapPool} from "../logic/coachMapPool";
import {PLAYABLE_MINIGAMES,planMinigameAfterMatch,rollVCTMinigame,type VCTMinigameType} from "../data/vctMinigames";
import {retireCareerPlayer,createVCTSeasonSummary} from "../logic/careerHistory";
import {getPlayerBanner,isPlayerBannerUnlocked} from "../data/cosmetics";
import {applyPostMatchStatChanges} from "../logic/careerPlayer";
import {MINIGAME_BALANCE} from "../config/balance";
import type {VCTSeasonState} from "../types/vct";

describe("1.5a — pool de mapas del rival",()=>{
  it("veto y simulación ven el mismo pool (determinista por rival y temporada)",()=>{
    const sentinels=getTeamById("sentinels")!;
    const vetoView=getCoachOpponentMapPool(sentinels,2026);
    const simulationView=getCoachOpponentMapPool(sentinels,2026);

    expect(simulationView).toEqual(vetoView);
    expect(getCoachOpponentMapPool(sentinels,2027)).not.toEqual(vetoView);
  });

  it("no consume la secuencia aleatoria global",()=>{
    const spy=vi.spyOn(Math,"random");
    getCoachOpponentMapPool(getTeamById("fnatic")!,2026);
    expect(spy).not.toHaveBeenCalled();
  });

  it("mantiene los mismos rangos que el pool inicial",()=>{
    const team=getTeamById("fnatic")!;

    for(let season=2026;season<2060;season++){
      for(const map of getCoachOpponentMapPool(team,season).maps){
        expect(map.preparation).toBeGreaterThanOrEqual(55);
        expect(map.preparation).toBeLessThanOrEqual(78);
        expect(Math.abs(map.attack-map.strength)).toBeLessThanOrEqual(5);
        expect(Math.abs(map.defense-map.strength)).toBeLessThanOrEqual(5);
      }
    }
  });

  it("el entrenamiento conserva las ganancias históricas (4/3/2/1/0)",()=>{
    const pool=createInitialCoachMapPool(getTeamById("fnatic")!);
    const gains=[60,75,85,92,95].map(preparation=>{
      const trained=trainCoachMap({maps:[{...pool.maps[0],preparation}]},pool.maps[0].map);
      return trained.maps[0].preparation-preparation;
    });

    expect(gains).toEqual([4,3,2,1,0]);
  });
});

describe("1.5b — minijuegos",()=>{
  it("todo minijuego sorteable es jugable salvo spray-control",()=>{
    const rolled=new Set<VCTMinigameType>();
    withSeed(1,()=>{for(let index=0;index<500;index++){const type=rollVCTMinigame("Kickoff");if(type)rolled.add(type);}});

    const unplayable=[...rolled].filter(type=>!PLAYABLE_MINIGAMES.has(type));
    expect(unplayable).toEqual(["spray-control"]);
  });

  it("spray-control consume el enfriamiento como antes pero no se muestra",()=>{
    vi.spyOn(Math,"random").mockReturnValueOnce(0).mockReturnValueOnce(.99);
    const plan=planMinigameAfterMatch("Kickoff",{cooldown:0,lastMinigame:null},5);

    expect(plan).toEqual({cooldown:5,lastMinigame:"spray-control",minigame:null});
  });

  it("la frecuencia y el enfriamiento coinciden con el comportamiento histórico",()=>{
    /* Réplica literal de la lógica que estaba dentro de useVCTMinigames. */
    const legacy=(state:{cooldown:number;lastMinigame:VCTMinigameType|null})=>{
      if(state.cooldown>0)return {cooldown:Math.max(0,state.cooldown-1),lastMinigame:state.lastMinigame,shown:null};
      const minigame=rollVCTMinigame("Kickoff",state.lastMinigame??undefined);
      if(!minigame)return {...state,shown:null};
      return {cooldown:MINIGAME_BALANCE.cooldownMatches,lastMinigame:minigame,shown:minigame};
    };

    const run=(useLegacy:boolean)=>withSeed("minijuegos",()=>{
      let state={cooldown:0,lastMinigame:null as VCTMinigameType|null};
      const shown:(VCTMinigameType|null)[]=[];

      for(let match=0;match<400;match++){
        if(useLegacy){
          const next=legacy(state);
          shown.push(next.shown);
          state={cooldown:next.cooldown,lastMinigame:next.lastMinigame};
        }else{
          const next=planMinigameAfterMatch("Kickoff",state,MINIGAME_BALANCE.cooldownMatches);
          shown.push(next.minigame);
          state={cooldown:next.cooldown,lastMinigame:next.lastMinigame};
        }
      }

      return shown;
    });

    const before=run(true);
    const after=run(false);

    expect(after).toEqual(before.map(type=>type==="spray-control"?null:type));
  });
});

describe("1.5d — retiro",()=>{
  function finishedSeasonWithKickoffWin():VCTSeasonState {
    const season=withSeed(11,()=>playFullVCTSeason(createTestPlayer()));
    return {...season,events:{...season.events,Kickoff:{...season.events.Kickoff,placement:1}}};
  }

  it("marca la carrera como retirada y conserva los trofeos de la temporada en curso",()=>{
    const player=createTestPlayer();
    const season=finishedSeasonWithKickoffWin();
    const retired=retireCareerPlayer(player,season);

    expect(retired.currentStage).toBe("Retired");
    expect(retired.history).toHaveLength(1);
    expect(retired.history[0].trophies).toContain("2026 VCT Americas Kickoff Champion");
    expect(retired.trophies).toContain("2026 VCT Americas Kickoff Champion");
  });

  it("el historial coincide con el de terminar la temporada",()=>{
    const player=createTestPlayer();
    const season=finishedSeasonWithKickoffWin();

    expect(retireCareerPlayer(player,season).history[0]).toEqual(createVCTSeasonSummary(player,season).historyEntry);
  });

  it("retirarse dos veces no duplica nada",()=>{
    const once=retireCareerPlayer(createTestPlayer(),finishedSeasonWithKickoffWin());
    expect(retireCareerPlayer(once,finishedSeasonWithKickoffWin())).toBe(once);
  });

  it("un retirado sin trofeos conserva el banner VCT",()=>{
    const season=withSeed(3,()=>playFullVCTSeason(createTestPlayer()));
    const noTrophies={...season,events:Object.fromEntries(Object.entries(season.events).map(([name,event])=>[name,{...event,placement:event.placement===1?2:event.placement}]))} as VCTSeasonState;
    const retired=retireCareerPlayer(createTestPlayer(),noTrophies);
    const banner=getPlayerBanner("vct")!;

    expect(retired.trophies).toEqual([]);
    expect(isPlayerBannerUnlocked(banner,retired)).toBe(true);
  });
});

describe("ajuste de atributos tras partido",()=>{
  it("usa los umbrales históricos por competición",()=>{
    vi.spyOn(Math,"random").mockImplementation(createSeededRandom(1));
    const player=createTestPlayer({stats:{aim:70,gameSense:70,communication:70,clutch:70,consistency:70,mental:70}});

    expect(applyPostMatchStatChanges(player,{won:true,playerRating:1.07},"Tier 2").stats).toMatchObject({mental:71,consistency:71});
    expect(applyPostMatchStatChanges(player,{won:true,playerRating:1.07},"VCT").stats).toMatchObject({mental:71,consistency:70});
    expect(applyPostMatchStatChanges(player,{won:false,playerRating:.7},"VCT").stats).toMatchObject({mental:69,consistency:69});
  });
});

