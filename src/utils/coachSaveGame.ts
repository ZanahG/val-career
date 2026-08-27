import type {CoachCareerState} from "../types/coach";
import type {GameScreen} from "../types/navigation";
import {getTeamById} from "../data/teams";
import {createInitialCoachBoardState,getCoachJobSecurity} from "../logic/coachBoard";

const COACH_SAVE_KEY="tu-carrera-valorant-coach-career";
const COACH_SAVE_VERSION=2;

export interface CoachCareerSave {
  version:number;
  savedAt:string;
  screen:GameScreen;
  career:CoachCareerState;
}

export function saveCoachCareer(career:CoachCareerState,screen:GameScreen) {
  const save:CoachCareerSave={
    version:COACH_SAVE_VERSION,
    savedAt:new Date().toISOString(),
    screen,
    career,
  };

  localStorage.setItem(COACH_SAVE_KEY,JSON.stringify(save));
}

export function loadCoachCareer():CoachCareerSave|null {
  const raw=localStorage.getItem(COACH_SAVE_KEY);
  if(!raw)return null;

  try{
    const parsed=JSON.parse(raw) as Partial<CoachCareerSave>;

    if(parsed.version===COACH_SAVE_VERSION&&parsed.career&&parsed.screen){
      const normalized=normalizeCoachSave(parsed as CoachCareerSave);

      localStorage.setItem(
        COACH_SAVE_KEY,
        JSON.stringify(normalized),
      );

      return normalized;
    }

    if(parsed.version===1){
      const migrated=migrateCoachSaveV1(parsed);
      if(!migrated)return null;

      localStorage.setItem(
        COACH_SAVE_KEY,
        JSON.stringify(migrated),
      );

      return migrated;
    }

    return null;
  }catch{
    return null;
  }
}

export function hasCoachCareerSave() {
  return Boolean(localStorage.getItem(COACH_SAVE_KEY));
}

export function clearCoachCareerSave() {
  localStorage.removeItem(COACH_SAVE_KEY);
}

function migrateCoachSaveV1(save:Partial<CoachCareerSave>):CoachCareerSave|null {
  if(!save.career||!save.screen)return null;

  const team=getTeamById(save.career.team.teamId);
  if(!team)return null;

  const fallbackBoard=createInitialCoachBoardState(team);
  const existingBoard=(save.career as Partial<CoachCareerState>).board;

  const career:CoachCareerState={
    ...save.career,
    board:{
      ...fallbackBoard,
      ...(existingBoard??{}),
      confidence:existingBoard?.confidence??fallbackBoard.confidence,
      seasonStartConfidence:existingBoard?.seasonStartConfidence??existingBoard?.confidence??fallbackBoard.seasonStartConfidence,
      objectives:existingBoard?.objectives??fallbackBoard.objectives,
      lastEvaluation:existingBoard?.lastEvaluation??null,
      jobSecurity:getCoachJobSecurity(existingBoard?.confidence??fallbackBoard.confidence),
      employmentStatus:existingBoard?.employmentStatus??"Employed",
      dismissal:existingBoard?.dismissal??{
        dismissed:false,
        season:null,
        reason:null,
      },
      history:existingBoard?.history??[],
    },
    jobMarket:(save.career as Partial<CoachCareerState>).jobMarket??null,
  };

  return {
    version:COACH_SAVE_VERSION,
    savedAt:save.savedAt??new Date().toISOString(),
    screen:normalizeCoachSaveScreen(save.screen),
    career,
  };
}

function normalizeCoachSave(save:CoachCareerSave):CoachCareerSave {
  const team=getTeamById(save.career.team.teamId);
  if(!team)return save;

  const fallbackBoard=createInitialCoachBoardState(team);
  const board=save.career.board??fallbackBoard;
  const confidence=board.confidence??fallbackBoard.confidence;

  return {
    ...save,
    version:COACH_SAVE_VERSION,
    screen:normalizeCoachSaveScreen(save.screen),
    career:{
      ...save.career,
      board:{
        ...fallbackBoard,
        ...board,
        confidence,
        seasonStartConfidence:board.seasonStartConfidence??confidence,
        objectives:board.objectives??fallbackBoard.objectives,
        lastEvaluation:board.lastEvaluation??null,
        jobSecurity:getCoachJobSecurity(confidence),
        employmentStatus:board.employmentStatus??"Employed",
        dismissal:board.dismissal??{
          dismissed:false,
          season:null,
          reason:null,
        },
        history:board.history??[],
      },
      jobMarket:save.career.jobMarket??null,
    },
  };
}

function normalizeCoachSaveScreen(screen:GameScreen):GameScreen {
  if(screen==="coachTransferNegotiation")return "coachMarket";

  return screen;
}