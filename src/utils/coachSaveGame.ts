import type {CoachCareerState} from "../types/coach";
import type {GameScreen} from "../types/navigation";
import {getTeamById} from "../data/teams";
import {createInitialCoachBoardState} from "../logic/coachBoard";

const COACH_SAVE_KEY="tu-carrera-valorant-coach-career";
const COACH_SAVE_VERSION=2;

export type CoachSaveScreen=
  |"coachDashboard"
  |"coachRoster"
  |"coachMarket"
  |"coachTactics"
  |"coachMapPool"
  |"coachSeason"
  |"coachEventRecap"
  |"coachOffseasonRecap"
  |"coachTransferNegotiation";

export interface CoachCareerSave {
  version:number;
  savedAt:string;
  screen:CoachSaveScreen;
  career:CoachCareerState;
}

export function saveCoachCareer(career:CoachCareerState,screen:GameScreen) {
  const save:CoachCareerSave={
    version:COACH_SAVE_VERSION,
    savedAt:new Date().toISOString(),
    screen:normalizeCoachSaveScreen(screen),
    career,
  };

  localStorage.setItem(COACH_SAVE_KEY,JSON.stringify(save));
}

export function loadCoachCareer():CoachCareerSave|null {
  const raw=localStorage.getItem(COACH_SAVE_KEY);

  if(!raw)return null;

  try{
    const parsed=JSON.parse(raw) as Partial<CoachCareerSave>;

    if(!parsed.career||!parsed.screen)return null;

    if(parsed.version===COACH_SAVE_VERSION){
      return parsed as CoachCareerSave;
    }

    if(parsed.version===1){
      const migrated=migrateCoachSaveV1(parsed);

      if(!migrated)return null;

      localStorage.setItem(COACH_SAVE_KEY,JSON.stringify(migrated));
      return migrated;
    }

    return null;
  }catch{
    return null;
  }
}

export function hasCoachCareerSave() {
  return loadCoachCareer()!==null;
}

export function clearCoachCareerSave() {
  localStorage.removeItem(COACH_SAVE_KEY);
}

function migrateCoachSaveV1(save:Partial<CoachCareerSave>):CoachCareerSave|null {
  if(!save.career||!save.screen)return null;

  const team=getTeamById(save.career.team.teamId);

  if(!team)return null;

  const career:CoachCareerState={
    ...save.career,
    board:save.career.board??createInitialCoachBoardState(team),
  };

  return {
    version:COACH_SAVE_VERSION,
    savedAt:save.savedAt??new Date().toISOString(),
    screen:normalizeCoachSaveScreen(save.screen),
    career,
  };
}

function normalizeCoachSaveScreen(screen:GameScreen):CoachSaveScreen {
  if(
    screen==="coachRoster"||
    screen==="coachMarket"||
    screen==="coachTactics"||
    screen==="coachMapPool"||
    screen==="coachSeason"||
    screen==="coachEventRecap"||
    screen==="coachOffseasonRecap"
  ){
    return screen;
  }

  if(screen==="coachMapVeto")return "coachSeason";

  return "coachDashboard";
}