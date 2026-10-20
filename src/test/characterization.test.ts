/*
  Pruebas de caracterización (golden master).

  Fijan, con Math.random sembrado, el resultado exacto de las simulaciones
  tal como estaban antes de v0.2. Cualquier refactor que cambie el
  comportamiento del juego sin querer hará fallar estas pruebas.

  Si un cambio de balance es intencionado, se actualizan con
  `npx vitest run -u` y se documenta el motivo.
*/
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {createTestPlayer,freezeTime,playFullVCTSeason,seedMathRandom} from "./helpers";
import {simulateMatch,createSeason,playNextMatch} from "../logic/season";
import type {VCTSeasonState} from "../types/vct";
import {applyOffseasonRegression,applyPlayerStatChange} from "../utils/playerStatsProgression";
import {generateOffers,generateMidseasonOffers,generateRenewalOffer} from "../data/offers";
import {createInitialVCTRosterState} from "../data/vctPlayers";
import {simulateVCTOffseason} from "../logic/vctRosterMarket";
import {createMatchBoxScore} from "../logic/matchBoxScore";
import {createCoachCareer} from "../logic/coachCareer";
import {simulateCoachSeries} from "../logic/coachMatchSimulation";
import {createCoachVCTSeason} from "../logic/coachVCTSeason";
import {createCoachRookieClass} from "../logic/coachRoster";
import {getTeamById} from "../data/teams";
import {rollVCTMinigame} from "../data/vctMinigames";
import type {CoachMapName} from "../types/coach";

beforeEach(()=>{
  freezeTime();
});

afterEach(()=>{
  vi.useRealTimers();
});

function digestVCTSeason(season:VCTSeasonState) {
  return {
    phase:season.phase,
    events:Object.fromEntries(Object.entries(season.events).map(([name,event])=>[
      name,
      {
        status:event.status,
        placement:event.placement??null,
        points:event.championshipPointsEarned,
        results:event.matches.map(match=>`${match.won?"W":"L"}${match.scoreFor}-${match.scoreAgainst}:${match.playerRating}`).join(","),
      },
    ])),
    championshipPointsByTeam:season.championshipPointsByTeam,
  };
}

describe("modo jugador",()=>{
  it("simulateMatch produce los mismos resultados",()=>{
    seedMathRandom(1);
    const player=createTestPlayer();
    const results=Array.from({length:8},()=>simulateMatch(player,"sentinels"));
    expect(results).toMatchSnapshot();
  });

  it("temporada VCT completa",()=>{
    for(const seed of [11,22,33]){
      seedMathRandom(seed);
      const season=playFullVCTSeason(createTestPlayer());
      expect(digestVCTSeason(season)).toMatchSnapshot(`seed-${seed}`);
    }
  });

  it("temporada Tier 2 con Ascension",()=>{
    seedMathRandom(5);
    const player=createTestPlayer({currentTeamId:"shinden",currentTeam:"ShindeN",currentStage:"Tier 2"});
    let season=createSeason(player);

    for(let step=0;step<40&&season.phase!=="Complete";step++)season=playNextMatch(player,season);

    expect(season).toMatchSnapshot();
  });

  it("progresión y regresión de atributos",()=>{
    seedMathRandom(9);
    const stats={aim:96,gameSense:88,communication:81,clutch:79,consistency:91,mental:84};
    const regressed=Array.from({length:5},()=>applyOffseasonRegression(stats));
    const changes=[50,84,86,92,95,98,99].map(value=>applyPlayerStatChange(value,3));
    expect({regressed,changes}).toMatchSnapshot();
  });

  it("ofertas de contrato",()=>{
    seedMathRandom(3);
    const vct=createTestPlayer();
    const tier2=createTestPlayer({currentStage:"Tier 2",currentTeamId:"shinden",currentTeam:"ShindeN",vctEligible:false,history:[]});
    const firstJump=createTestPlayer({currentStage:"Tier 2",currentTeamId:"shinden",currentTeam:"ShindeN",vctEligible:true,history:[]});

    expect({
      vct:generateOffers(vct),
      tier2:generateOffers(tier2),
      firstJump:generateOffers(firstJump),
      midseason:generateMidseasonOffers(vct),
      renewal:generateRenewalOffer(vct),
    }).toMatchSnapshot();
  });

  it("mercado de pases de pros",()=>{
    seedMathRandom(4);
    const state=simulateVCTOffseason(createInitialVCTRosterState(2026),2027);
    expect(state.transfers).toMatchSnapshot();
  });

  it("box score",()=>{
    seedMathRandom(6);
    const player=createTestPlayer();
    const result=simulateMatch(player,"sentinels");
    expect(createMatchBoxScore(player,result,3,createInitialVCTRosterState(2026))).toMatchSnapshot();
  });

  it("sorteo de minijuegos",()=>{
    seedMathRandom(8);
    expect(Array.from({length:30},()=>rollVCTMinigame("Kickoff"))).toMatchSnapshot();
  });
});

describe("modo entrenador",()=>{
  it("creación de carrera y series",()=>{
    seedMathRandom(21);
    const team=getTeamById("leviatan")!;
    const career=createCoachCareer(team,"Coach","Chile",30);
    const maps:CoachMapName[]=["Ascent","Bind","Haven"];

    const series=Array.from({length:6},()=>simulateCoachSeries(career,"sentinels",maps)?.result);

    expect({
      roster:career.team.roster.map(player=>[player.id,player.overall,player.potential,player.peakAge,player.salary,player.contractSeasonsRemaining]),
      mapPool:career.team.mapPool,
      series,
    }).toMatchSnapshot();
  });

  it("kickoff del entrenador",()=>{
    seedMathRandom(22);
    const career=createCoachCareer(getTeamById("leviatan")!,"Coach","Chile",30);
    expect(createCoachVCTSeason(career).kickoffBracket).toMatchSnapshot();
  });

  it("clase de rookies (determinista)",()=>{
    expect(createCoachRookieClass(2027).map(player=>[player.ign,player.overall,player.potential,player.peakAge])).toMatchSnapshot();
  });
});
