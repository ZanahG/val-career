import type {CareerPlayer} from "../types/career";
import type {CareerSave} from "../types/save";
import {normalizePlayerCosmetics} from "../logic/careerPlayer";
import {getBackupKey,isRecord,migrateSave,parseJSON,readStorage,removeStorage,writeStorage,type SaveMigration,type SaveWriteResult} from "./saveStorage";

export const CAREER_SAVE_KEY = "tu-carrera-valorant-save";

/*
  Versión actual del formato. Se mantiene en 1 porque v0.2 solo añade campos
  opcionales: así una versión anterior del juego sigue pudiendo abrir el
  guardado. Al introducir un cambio incompatible, subir la versión y añadir la
  migración correspondiente en CAREER_SAVE_MIGRATIONS.
*/
export const CAREER_SAVE_VERSION = 1;

/* migrations[n] convierte la versión n en la n+1. La versión 0 representa un
   guardado sin campo `version` (formato anterior al versionado). */
export const CAREER_SAVE_MIGRATIONS:Record<number,SaveMigration> = {
  0:(save) => ({...save,version:1}),
};

const CAREER_SAVE_SCREENS:readonly CareerSave["screen"][] = ["career","profile","offers","season","vct","recap","vctRecap","market","vctOffseason","leaderboard"];

export interface CareerSaveWriteResult {
  ok:boolean;
  /* La foto se omitió porque el guardado completo no cabía en el almacenamiento. */
  droppedPhoto:boolean;
}

export interface CareerLoadResult {
  save:CareerSave|null;
  status:"ok"|"empty"|"future"|"invalid";
  migratedFrom:number|null;
  recoveredFromBackup:boolean;
}

export function saveCareer(save:CareerSave):CareerSaveWriteResult {
  const result = writeStorage(CAREER_SAVE_KEY,JSON.stringify(save));
  if (result.ok) return {ok:true,droppedPhoto:false};

  if (result.reason === "quota" && save.player.photo) {
    const {photo:_photo,...playerWithoutPhoto} = save.player;
    const retry = writeStorage(CAREER_SAVE_KEY,JSON.stringify({...save,player:playerWithoutPhoto}));

    if (retry.ok) {
      console.warn("ValCareer: la foto del jugador no cabe en el almacenamiento y no se ha guardado.");
      return {ok:true,droppedPhoto:true};
    }
  }

  console.warn("ValCareer: no se pudo guardar la partida.",result.reason);
  return {ok:false,droppedPhoto:false};
}

export function loadCareerSave():CareerLoadResult {
  const raw = readStorage(CAREER_SAVE_KEY);
  if (raw === null) return {save:null,status:"empty",migratedFrom:null,recoveredFromBackup:false};

  const outcome = migrateCareerSaveData(parseJSON(raw));

  if (outcome.status === "future") {
    return {save:null,status:"future",migratedFrom:null,recoveredFromBackup:false};
  }

  if (outcome.status === "ok") {
    storeBackups(raw,outcome.migratedFrom);
    if (outcome.migratedFrom !== null) writeStorage(CAREER_SAVE_KEY,JSON.stringify(outcome.save));

    return {save:outcome.save,status:"ok",migratedFrom:outcome.migratedFrom,recoveredFromBackup:false};
  }

  const backup = migrateCareerSaveData(parseJSON(readStorage(getBackupKey(CAREER_SAVE_KEY))));

  if (backup.status === "ok") {
    return {save:backup.save,status:"ok",migratedFrom:backup.migratedFrom,recoveredFromBackup:true};
  }

  return {save:null,status:"invalid",migratedFrom:null,recoveredFromBackup:false};
}

export function loadCareer():CareerSave|null {
  return loadCareerSave().save;
}

export function hasCareerSave() {
  return readStorage(CAREER_SAVE_KEY) !== null;
}

/* Borra el guardado activo. Las copias de seguridad se conservan para poder
   recuperar una partida eliminada por error. */
export function deleteCareerSave() {
  removeStorage(CAREER_SAVE_KEY);
}

export function migrateCareerSaveData(data:unknown) {
  return migrateSave<CareerSave>(
    data,
    CAREER_SAVE_VERSION,
    CAREER_SAVE_MIGRATIONS,
    (save) => typeof save.version === "number" ? save.version : isRecord(save.player) ? 0 : null,
    normalizeCareerSave,
  );
}

function storeBackups(raw:string,migratedFrom:number|null):SaveWriteResult {
  if (migratedFrom !== null) writeStorage(`${getBackupKey(CAREER_SAVE_KEY)}-v${migratedFrom}`,raw);
  return writeStorage(getBackupKey(CAREER_SAVE_KEY),raw);
}

/* Completa los campos que pueden faltar en guardados antiguos o parciales.
   Nunca descarta información existente. */
export function normalizeCareerSave(save:Record<string,unknown>):CareerSave|null {
  if (!isRecord(save.player)) return null;

  const player = normalizeCareerPlayer(save.player);
  if (!player) return null;

  const screen = CAREER_SAVE_SCREENS.includes(save.screen as CareerSave["screen"]) ? save.screen as CareerSave["screen"] : "career";
  const marketWindow = save.marketWindow === "midseason" || save.marketWindow === "offseason" ? save.marketWindow : null;

  return {
    ...(save as unknown as CareerSave),
    version:CAREER_SAVE_VERSION,
    player,
    screen,
    currentEventId:typeof save.currentEventId === "string" ? save.currentEventId : "",
    season:isRecord(save.season) ? save.season as unknown as CareerSave["season"] : null,
    vctSeason:isRecord(save.vctSeason) ? save.vctSeason as unknown as CareerSave["vctSeason"] : null,
    marketWindow,
    marketOffers:Array.isArray(save.marketOffers) ? save.marketOffers as CareerSave["marketOffers"] : [],
    renewalOffer:isRecord(save.renewalOffer) ? save.renewalOffer as unknown as CareerSave["renewalOffer"] : null,
    vctRosters:isRecord(save.vctRosters) ? save.vctRosters as unknown as CareerSave["vctRosters"] : undefined,
    savedAt:typeof save.savedAt === "number" ? save.savedAt : Date.now(),
  };
}

const DEFAULT_REPUTATION:CareerPlayer["reputationStats"] = {reputation:8,popularity:4,professionalism:55,teamwork:55,toxicity:5};

function normalizeCareerPlayer(raw:Record<string,unknown>):CareerPlayer|null {
  if (typeof raw.nickname !== "string" || !isRecord(raw.stats)) return null;

  const player = raw as unknown as CareerPlayer;

  return normalizePlayerCosmetics({
    ...player,
    reputationStats:{...DEFAULT_REPUTATION,...(isRecord(raw.reputationStats) ? raw.reputationStats : {})},
    followers:typeof raw.followers === "number" ? raw.followers : 0,
    earnings:typeof raw.earnings === "number" ? raw.earnings : 0,
    careerPoints:typeof raw.careerPoints === "number" ? raw.careerPoints : 0,
    currentTeam:typeof raw.currentTeam === "string" ? raw.currentTeam : "Free Agent",
    rosterRole:raw.rosterRole === "Substitute" ? "Substitute" : "Starter",
    salary:typeof raw.salary === "number" ? raw.salary : 0,
    contractSeasonsRemaining:typeof raw.contractSeasonsRemaining === "number" ? raw.contractSeasonsRemaining : 0,
    history:Array.isArray(raw.history) ? player.history : [],
    trophies:Array.isArray(raw.trophies) ? player.trophies : [],
  });
}
