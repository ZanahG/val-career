import type {CareerHistoryEntry,CareerPlayer} from "../types/career";
import type {VCTSeasonState} from "../types/vct";
import {getVCTSeasonStats} from "./vctSeason";

export interface VCTSeasonSummary {
  historyEntry:CareerHistoryEntry;
  trophies:string[];
}

/* Trofeos ganados hasta el momento en una temporada VCT (completa o en curso). */
export function getVCTSeasonTrophies(player:CareerPlayer,season:VCTSeasonState) {
  const trophies:string[]=[];

  if(season.events.Kickoff.placement===1)trophies.push(`${player.season} VCT ${season.circuit} Kickoff Champion`);
  if(season.events["Stage 1 Playoffs"].placement===1)trophies.push(`${player.season} VCT ${season.circuit} Stage 1 Champion`);
  if(season.events["Masters 1"].placement===1)trophies.push(`${player.season} Masters 1 Champion`);
  if(season.events["Masters 2"].placement===1)trophies.push(`${player.season} Masters 2 Champion`);
  if(season.events["Stage 2 Playoffs"].placement===1)trophies.push(`${player.season} VCT ${season.circuit} Stage 2 Champion`);
  if(season.events.Champions.placement===1)trophies.push(`${player.season} Valorant World Champion`);

  return trophies;
}

export function createVCTSeasonSummary(player:CareerPlayer,season:VCTSeasonState):VCTSeasonSummary {
  const stats=getVCTSeasonStats(season);
  const trophies=getVCTSeasonTrophies(player,season);

  const vctEvents=Object.entries(season.events).map(([name,event])=>({
    name,
    wins:event.matches.filter(match=>match.won).length,
    losses:event.matches.filter(match=>!match.won).length,
    placement:event.placement,
    status:event.status,
  }));

  const championshipPoints=player.currentTeamId?(season.championshipPointsByTeam[player.currentTeamId]??0):0;

  return {
    trophies,
    historyEntry:{
      season:player.season,
      teamId:player.currentTeamId??"free-agent",
      teamName:player.currentTeam,
      rosterRole:player.rosterRole,
      salary:player.salary,
      wins:stats.wins,
      losses:stats.losses,
      placement:season.events.Champions.placement??0,
      trophies,
      stage:"VCT",
      vctCircuit:season.circuit,
      championshipPoints,
      vctEvents,
    },
  };
}

/* Retiro voluntario. Conserva la temporada en curso (incluidos sus trofeos)
   y marca la carrera como terminada. */
export function retireCareerPlayer(player:CareerPlayer,season:VCTSeasonState|null):CareerPlayer {
  if(player.currentStage==="Retired")return player;

  const summary=season?createVCTSeasonSummary(player,season):null;

  return {
    ...player,
    currentStage:"Retired",
    history:summary?[...player.history,summary.historyEntry]:player.history,
    trophies:summary?[...player.trophies,...summary.trophies.filter(trophy=>!player.trophies.includes(trophy))]:player.trophies,
  };
}
