/*
  Utilidades comunes de guardado para ambos modos de juego.

  - Lectura/escritura en localStorage sin lanzar errores (modo privado,
    cuota llena, almacenamiento bloqueado).
  - Copia de seguridad del último guardado válido ("<clave>:backup"), que se
    usa automáticamente si el guardado principal está corrupto.
  - Cadena de migraciones por versión: cada migración transforma la versión
    N en la N+1. Un guardado de una versión futura (creado por una versión
    más nueva del juego) nunca se sobrescribe ni se modifica.
*/

export type SaveWriteResult=
  |{ok:true}
  |{ok:false;reason:"quota"|"unavailable"};

export function getBackupKey(key:string) {
  return `${key}:backup`;
}

function getStorage():Storage|null {
  try{
    return typeof localStorage==="undefined"?null:localStorage;
  }catch{
    return null;
  }
}

export function readStorage(key:string):string|null {
  try{
    return getStorage()?.getItem(key)??null;
  }catch{
    return null;
  }
}

export function writeStorage(key:string,value:string):SaveWriteResult {
  const storage=getStorage();
  if(!storage)return {ok:false,reason:"unavailable"};

  try{
    storage.setItem(key,value);
    return {ok:true};
  }catch(error){
    return {ok:false,reason:isQuotaError(error)?"quota":"unavailable"};
  }
}

export function removeStorage(key:string) {
  try{
    getStorage()?.removeItem(key);
  }catch{
    /* sin almacenamiento disponible: nada que borrar */
  }
}

function isQuotaError(error:unknown) {
  if(!(error instanceof Error)&&typeof error!=="object")return false;

  const candidate=error as {name?:string;code?:number};

  return (
    candidate.name==="QuotaExceededError"||
    candidate.name==="NS_ERROR_DOM_QUOTA_REACHED"||
    candidate.code===22||
    candidate.code===1014
  );
}

export function parseJSON(raw:string|null):unknown {
  if(raw===null)return null;

  try{
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

/* =========================
   MIGRACIONES
========================= */

export type SaveMigration=(save:Record<string,unknown>)=>Record<string,unknown>|null;

export type MigrationOutcome<T>=
  |{status:"ok";save:T;migratedFrom:number|null}
  |{status:"future";version:number}
  |{status:"invalid"};

/*
  Aplica las migraciones necesarias hasta `currentVersion`.
  `migrations[n]` convierte un guardado de versión n en versión n+1.
  `getVersion` permite interpretar guardados antiguos sin campo `version`.
*/
export function migrateSave<T>(
  data:unknown,
  currentVersion:number,
  migrations:Record<number,SaveMigration>,
  getVersion:(save:Record<string,unknown>)=>number|null,
  normalize:(save:Record<string,unknown>)=>T|null,
):MigrationOutcome<T> {
  if(!data||typeof data!=="object"||Array.isArray(data))return {status:"invalid"};

  let save=data as Record<string,unknown>;
  let version=getVersion(save);

  if(version===null)return {status:"invalid"};
  if(version>currentVersion)return {status:"future",version};

  const originalVersion=version;

  while(version<currentVersion){
    const migration=migrations[version];
    if(!migration)return {status:"invalid"};

    const migrated=migration(save);
    if(!migrated)return {status:"invalid"};

    save=migrated;
    version++;
  }

  const normalized=normalize(save);
  if(!normalized)return {status:"invalid"};

  return {status:"ok",save:normalized,migratedFrom:originalVersion===currentVersion?null:originalVersion};
}

export function isRecord(value:unknown):value is Record<string,unknown> {
  return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
}
