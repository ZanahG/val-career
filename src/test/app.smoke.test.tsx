// @vitest-environment jsdom
/*
  Prueba de humo de integración: monta la aplicación real, carga partidas
  guardadas desde el menú y recorre el flujo de retiro.
*/
import {act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import App from "../App";
import {GameSettingsProvider} from "../context/GameSettingsContext";
import {createTestPlayer,playFullVCTSeason} from "./helpers";
import {withSeed} from "../utils/rng";
import {createVCTSeason} from "../logic/vctSeason";
import {createInitialVCTRosterState} from "../data/vctPlayers";
import {CAREER_SAVE_KEY} from "../utils/saveGame";
import {COACH_SAVE_KEY,saveCoachCareer} from "../utils/coachSaveGame";
import {createCoachCareer} from "../logic/coachCareer";
import {getTeamById} from "../data/teams";

(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;

let container:HTMLDivElement;
let root:Root;

beforeEach(()=>{
  localStorage.clear();
  localStorage.setItem("tcv-language","es");
  container=document.createElement("div");
  document.body.appendChild(container);
  root=createRoot(container);
});

afterEach(()=>{
  act(()=>root.unmount());
  container.remove();
});

function render() {
  act(()=>{
    root.render(<GameSettingsProvider><App/></GameSettingsProvider>);
  });
}

function click(element:Element|null|undefined) {
  if(!element)throw new Error("Elemento no encontrado");
  act(()=>{(element as HTMLElement).click();});
}

function buttonWithText(text:string) {
  return [...container.querySelectorAll("button")].find(button=>button.textContent?.includes(text));
}

async function flush() {
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,0));});
}

/* Espera a que aparezca un texto (las pantallas diferidas cargan su módulo de forma asíncrona). */
async function waitForText(text:string,timeout=5000) {
  const start=Date.now();

  while(!container.textContent?.includes(text)){
    if(Date.now()-start>timeout)throw new Error(`No apareció "${text}". Contenido: ${container.textContent?.slice(0,200)}`);
    await flush();
  }
}

describe("App",()=>{
  it("continúa una partida v1 antigua sin perderla",async()=>{
    const player=createTestPlayer();
    const vctSeason=withSeed(3,()=>playFullVCTSeason(player));
    /* Guardado temprano: sin marketOffers, renewalOffer ni vctRosters. */
    localStorage.setItem(CAREER_SAVE_KEY,JSON.stringify({version:1,player,screen:"vctRecap",currentEventId:"",season:null,vctSeason,savedAt:1}));

    render();
    click(container.querySelector(".game-mode-feature__play"));
    await waitForText("Tester");

    const stored=JSON.parse(localStorage.getItem(CAREER_SAVE_KEY)!);
    expect(stored.version).toBe(1);
    expect(stored.player.nickname).toBe("Tester");
    expect(stored.vctSeason.phase).toBe("Complete");
  });

  it("el retiro marca la carrera como terminada y se guarda",async()=>{
    const player=createTestPlayer();
    const vctSeason=createVCTSeason(player);
    localStorage.setItem(CAREER_SAVE_KEY,JSON.stringify({version:1,player,screen:"vct",currentEventId:"",season:null,vctSeason,marketWindow:null,marketOffers:[],renewalOffer:null,vctRosters:createInitialVCTRosterState(2026),savedAt:1}));

    render();
    click(container.querySelector(".game-mode-feature__play"));
    await flush();

    click(buttonWithText("RETIRARSE"));
    click(buttonWithText("CONFIRMAR RETIRO"));
    await flush();

    expect(container.textContent?.toUpperCase()).toContain("RETIRED");

    const stored=JSON.parse(localStorage.getItem(CAREER_SAVE_KEY)!);
    expect(stored.player.currentStage).toBe("Retired");
    expect(stored.player.history).toHaveLength(1);
    expect(stored.screen).toBe("profile");
  });

  it("continúa una carrera de entrenador guardada",async()=>{
    const career=withSeed(4,()=>createCoachCareer(getTeamById("leviatan")!,"Mister Test","Chile",30));
    saveCoachCareer(career,"coachDashboard");
    vi.spyOn(console,"warn").mockImplementation(()=>undefined);

    render();
    click(buttonWithText("ENTRENADOR")??[...container.querySelectorAll(".game-mode-nav__item")][1]);
    click(container.querySelector(".game-mode-feature__play"));
    await flush();

    expect(container.textContent).toContain("LEVIATÁN");
    expect(JSON.parse(localStorage.getItem(COACH_SAVE_KEY)!).career.coach.name).toBe("Mister Test");
  });
});
