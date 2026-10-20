import type {CoachCareerState} from "../types/coach";
import type {GameScreen} from "../types/navigation";
import {getTeamById} from "../data/teams";
import {createInitialCoachBoardState,getCoachJobSecurity} from "../logic/coachBoard";
import {getBackupKey,isRecord,migrateSave,parseJSON,readStorage,removeStorage,writeStorage,type SaveMigration,type SaveWriteResult} from "./saveStorage";

export const COACH_SAVE_KEY="tu-carrera-valorant-coach-career";
export const COACH_SAVE_VERSION=2;

/* migrations[n] convierte la versión n en la n+1. */
export const COACH_SAVE_MIGRATIONS:Record<number,SaveMigration>={
  1:(save)=>migrateCoachSaveV1(save as Partial<CoachCareerSave>) as unknown as Record<string,unknown>|null,
};

export interface CoachCareerSave {
  version:number;
  savedAt:string;
  screen:GameScreen;
  career:CoachCareerState;
}

export interface CoachLoadResult {
  save:CoachCareerSave|null;
  status:"ok"|"empty"|"future"|"invalid";
  migratedFrom:number|null;
  recoveredFromBackup:boolean;
}

export function saveCoachCareer(career:CoachCareerState,screen:GameScreen):SaveWriteResult {
  const save:CoachCareerSave={
    version:COACH_SAVE_VERSION,
    savedAt:new Date().toISOString(),
    screen,
    career,
  };

  const result=writeStorage(COACH_SAVE_KEY,JSON.stringify(save));
  if(!result.ok)console.warn("ValCareer: no se pudo guardar la carrera de entrenador.",result.reason);

  return result;
}

export function loadCoachCareerSave():CoachLoadResult {
  const raw=readStorage(COACH_SAVE_KEY);
  if(raw===null)return {save:null,status:"empty",migratedFrom:null,recoveredFromBackup:false};

  const outcome=migrateCoachSaveData(parseJSON(raw));

  if(outcome.status==="future")return {save:null,status:"future",migratedFrom:null,recoveredFromBackup:false};

  if(outcome.status==="ok"){
    if(outcome.migratedFrom!==null)writeStorage(`${getBackupKey(COACH_SAVE_KEY)}-v${outcome.migratedFrom}`,raw);
    writeStorage(getBackupKey(COACH_SAVE_KEY),raw);
    writeStorage(COACH_SAVE_KEY,JSON.stringify(outcome.save));

    return {save:outcome.save,status:"ok",migratedFrom:outcome.migratedFrom,recoveredFromBackup:false};
  }

  const backup=migrateCoachSaveData(parseJSON(readStorage(getBackupKey(COACH_SAVE_KEY))));

  if(backup.status==="ok"){
    return {save:backup.save,status:"ok",migratedFrom:backup.migratedFrom,recoveredFromBackup:true};
  }

  return {save:null,status:"invalid",migratedFrom:null,recoveredFromBackup:false};
}

export function loadCoachCareer():CoachCareerSave|null {
  return loadCoachCareerSave().save;
}

export function hasCoachCareerSave() {
  return readStorage(COACH_SAVE_KEY)!==null;
}

/* Las copias de seguridad se conservan para poder recuperar una carrera. */
export function clearCoachCareerSave() {
  removeStorage(COACH_SAVE_KEY);
}

export function migrateCoachSaveData(data:unknown) {
  return migrateSave<CoachCareerSave>(
    data,
    COACH_SAVE_VERSION,
    COACH_SAVE_MIGRATIONS,
    save=>typeof save.version==="number"?save.version:null,
    save=>{
      const candidate=save as Partial<CoachCareerSave>;
      if(!isRecord(candidate.career)||!candidate.screen)return null;
      if(!isRecord(candidate.career.team)||typeof candidate.career.team.teamId!=="string")return null;

      return normalizeCoachSave(candidate as CoachCareerSave);
    },
  );
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