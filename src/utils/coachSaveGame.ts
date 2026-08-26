import type {CoachCareerState} from "../types/coach";
import type {GameScreen} from "../types/navigation";

const COACH_SAVE_KEY="tu-carrera-valorant-coach-career";
const COACH_SAVE_VERSION=1;

export type CoachSaveScreen=
  |"coachDashboard"
  |"coachRoster"
  |"coachMarket"
  |"coachTactics"
  |"coachMapPool"
  |"coachSeason"
  |"coachEventRecap"
  |"coachOffseasonRecap";

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

    if(
      parsed.version!==COACH_SAVE_VERSION||
      !parsed.career||
      !parsed.screen
    ){
      return null;
    }

    return parsed as CoachCareerSave;
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