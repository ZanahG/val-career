// @vitest-environment jsdom
import {beforeEach,describe,expect,it,vi} from "vitest";
import {createTestPlayer,playFullVCTSeason} from "../test/helpers";
import {withSeed} from "./rng";
import {CAREER_SAVE_KEY,deleteCareerSave,hasCareerSave,loadCareer,loadCareerSave,saveCareer} from "./saveGame";
import {COACH_SAVE_KEY,COACH_SAVE_VERSION,loadCoachCareer,loadCoachCareerSave,saveCoachCareer} from "./coachSaveGame";
import {getBackupKey} from "./saveStorage";
import {loadIntroEventCount,saveIntroEventCount} from "./careerStorage";
import {restoreCareerSave} from "../logic/restoreCareerSave";
import {createInitialVCTRosterState} from "../data/vctPlayers";
import {createCoachCareer} from "../logic/coachCareer";
import {getTeamById} from "../data/teams";
import type {CareerSave} from "../types/save";

beforeEach(()=>{
  localStorage.clear();
});

function createFullSave():CareerSave {
  const player=createTestPlayer({photo:"data:image/png;base64,AAAA"});
  const vctSeason=withSeed(1,()=>playFullVCTSeason(player));

  return {
    version:1,
    player,
    screen:"vctRecap",
    currentEventId:"",
    season:null,
    vctSeason,
    marketWindow:null,
    marketOffers:[],
    savedAt:1760000000000,
    renewalOffer:null,
    vctRosters:createInitialVCTRosterState(2026),
  };
}

/* Formato mínimo de los primeros guardados v1 (sin los campos añadidos después). */
function createEarlyV1Save() {
  const {marketWindow:_a,marketOffers:_b,renewalOffer:_c,vctRosters:_d,...early}=createFullSave();
  const {unlockedBannerIds:_e,unlockedTitleIds:_f,...player}=early.player;
  return {...early,player,screen:"vct"};
}

const quotaError=()=>new DOMException("lleno","QuotaExceededError");

describe("guardado del modo jugador",()=>{
  it("un guardado v1 completo se carga sin perder ni alterar datos",()=>{
    const original=createFullSave();
    localStorage.setItem(CAREER_SAVE_KEY,JSON.stringify(original));

    const result=loadCareerSave();

    expect(result.status).toBe("ok");
    expect(result.migratedFrom).toBeNull();
    expect(result.save).toEqual(original);
    expect(JSON.parse(localStorage.getItem(CAREER_SAVE_KEY)!)).toEqual(original);
  });

  it("un guardado v1 antiguo sin campos opcionales se completa y se puede restaurar",()=>{
    const early=createEarlyV1Save();
    localStorage.setItem(CAREER_SAVE_KEY,JSON.stringify(early));

    const save=loadCareer()!;

    expect(save.player.nickname).toBe("Tester");
    expect(save.player.unlockedBannerIds).toEqual(["rookie"]);
    expect(save.marketOffers).toEqual([]);
    expect(save.marketWindow).toBeNull();
    expect(save.vctSeason).toEqual(early.vctSeason);

    const restored=restoreCareerSave(save);
    expect(restored.vctRosters?.players.length).toBeGreaterThan(0);
  });

  it("un guardado sin versión se migra y se conserva una copia del original",()=>{
    const {version:_version,...unversioned}=createFullSave();
    const raw=JSON.stringify(unversioned);
    localStorage.setItem(CAREER_SAVE_KEY,raw);

    const result=loadCareerSave();

    expect(result.status).toBe("ok");
    expect(result.migratedFrom).toBe(0);
    expect(result.save?.version).toBe(1);
    expect(localStorage.getItem(`${getBackupKey(CAREER_SAVE_KEY)}-v0`)).toBe(raw);
    expect(JSON.parse(localStorage.getItem(CAREER_SAVE_KEY)!).version).toBe(1);
  });

  it("un guardado de una versión futura no se carga ni se toca",()=>{
    const raw=JSON.stringify({...createFullSave(),version:99});
    localStorage.setItem(CAREER_SAVE_KEY,raw);

    expect(loadCareerSave().status).toBe("future");
    expect(localStorage.getItem(CAREER_SAVE_KEY)).toBe(raw);
  });

  it("si el guardado está corrupto se recupera la copia de seguridad",()=>{
    const original=createFullSave();
    localStorage.setItem(CAREER_SAVE_KEY,JSON.stringify(original));
    loadCareerSave();

    localStorage.setItem(CAREER_SAVE_KEY,"{corrupto");

    const result=loadCareerSave();
    expect(result.recoveredFromBackup).toBe(true);
    expect(result.save).toEqual(original);
  });

  it("los datos inválidos no rompen la carga",()=>{
    for(const raw of ["null","[]","42","{}",JSON.stringify({version:1,player:{}})]){
      localStorage.clear();
      localStorage.setItem(CAREER_SAVE_KEY,raw);
      expect(loadCareerSave().save).toBeNull();
    }
  });

  it("con la cuota llena guarda la partida sin la foto en lugar de fallar",()=>{
    const save=createFullSave();
    const realSetItem=Storage.prototype.setItem;

    vi.spyOn(Storage.prototype,"setItem").mockImplementation(function(this:Storage,key:string,value:string){
      if(value.includes("data:image/png"))throw quotaError();
      return realSetItem.call(this,key,value);
    });
    vi.spyOn(console,"warn").mockImplementation(()=>undefined);

    const result=saveCareer(save);

    expect(result).toEqual({ok:true,droppedPhoto:true});
    expect(loadCareer()?.player.photo).toBeUndefined();
    expect(loadCareer()?.player.nickname).toBe("Tester");
  });

  it("si el almacenamiento no está disponible no lanza errores",()=>{
    vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("bloqueado");});
    vi.spyOn(Storage.prototype,"getItem").mockImplementation(()=>{throw new Error("bloqueado");});
    vi.spyOn(console,"warn").mockImplementation(()=>undefined);

    expect(()=>saveCareer(createFullSave())).not.toThrow();
    expect(saveCareer(createFullSave()).ok).toBe(false);
    expect(loadCareerSave().status).toBe("empty");
    expect(hasCareerSave()).toBe(false);
    expect(()=>saveIntroEventCount(3)).not.toThrow();
    expect(loadIntroEventCount()).toBe(0);
  });

  it("el formato escrito sigue siendo legible por la versión anterior del juego",()=>{
    saveCareer(createFullSave());
    const parsed=JSON.parse(localStorage.getItem(CAREER_SAVE_KEY)!);

    /* El cargador anterior solo aceptaba version === 1. */
    expect(parsed.version).toBe(1);
  });

  it("borrar la partida conserva la copia de seguridad",()=>{
    localStorage.setItem(CAREER_SAVE_KEY,JSON.stringify(createFullSave()));
    loadCareerSave();
    deleteCareerSave();

    expect(hasCareerSave()).toBe(false);
    expect(localStorage.getItem(getBackupKey(CAREER_SAVE_KEY))).not.toBeNull();
  });
});

describe("guardado del modo entrenador",()=>{
  function createCareer() {
    return withSeed(2,()=>createCoachCareer(getTeamById("leviatan")!,"Coach","Chile",30));
  }

  it("un guardado v2 se carga sin cambios",()=>{
    const career=createCareer();
    saveCoachCareer(career,"coachDashboard");

    const result=loadCoachCareerSave();

    expect(result.status).toBe("ok");
    expect(result.save?.career).toEqual(career);
    expect(result.save?.screen).toBe("coachDashboard");
  });

  it("un guardado v1 (sin directiva) se migra a v2 y conserva una copia",()=>{
    const {board:_board,jobMarket:_jobMarket,...careerWithoutBoard}=createCareer();
    const raw=JSON.stringify({version:1,savedAt:"2026-01-01T00:00:00.000Z",screen:"coachTransferNegotiation",career:careerWithoutBoard});
    localStorage.setItem(COACH_SAVE_KEY,raw);

    const result=loadCoachCareerSave();

    expect(result.migratedFrom).toBe(1);
    expect(result.save?.version).toBe(COACH_SAVE_VERSION);
    expect(result.save?.screen).toBe("coachMarket");
    expect(result.save?.career.board.employmentStatus).toBe("Employed");
    expect(result.save?.career.playerPool).toEqual(careerWithoutBoard.playerPool);
    expect(localStorage.getItem(`${getBackupKey(COACH_SAVE_KEY)}-v1`)).toBe(raw);
  });

  it("una versión futura no se toca y uno corrupto se recupera de la copia",()=>{
    const future=JSON.stringify({version:99,screen:"coachDashboard",career:createCareer()});
    localStorage.setItem(COACH_SAVE_KEY,future);
    expect(loadCoachCareerSave().status).toBe("future");
    expect(localStorage.getItem(COACH_SAVE_KEY)).toBe(future);

    localStorage.clear();
    saveCoachCareer(createCareer(),"coachSeason");
    loadCoachCareerSave();
    localStorage.setItem(COACH_SAVE_KEY,"{roto");

    const recovered=loadCoachCareerSave();
    expect(recovered.recoveredFromBackup).toBe(true);
    expect(recovered.save?.screen).toBe("coachSeason");
  });

  it("guardar con la cuota llena no lanza errores",()=>{
    vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw quotaError();});
    vi.spyOn(console,"warn").mockImplementation(()=>undefined);

    expect(saveCoachCareer(createCareer(),"coachDashboard")).toEqual({ok:false,reason:"quota"});
    expect(loadCoachCareer()).toBeNull();
  });
});
