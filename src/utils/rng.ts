/*
  Fuente de aleatoriedad central.

  - randomFloat(): sustituto directo de Math.random(). Mientras no se active
    otra fuente, delega en Math.random, por lo que el juego se comporta igual
    que antes (mismas distribuciones, mismos resultados posibles).
  - withSeed()/setRandomSource(): permiten reproducir una simulación completa
    a partir de una semilla (pruebas, depuración, calibración de balance).
  - hashString()/careerHash(): hash FNV-1a idéntico al `deterministicNumber`
    que ya usan los módulos del modo entrenador. Sin semilla de carrera
    devuelve exactamente el mismo valor que la implementación histórica, de
    modo que las partidas antiguas no cambian.
*/

export type RandomSource=()=>number;

let activeSource:RandomSource|null=null;

export function randomFloat():number {
  return activeSource?activeSource():Math.random();
}

export function setRandomSource(source:RandomSource|null) {
  activeSource=source;
}

export function getRandomSource():RandomSource|null {
  return activeSource;
}

export function withRandomSource<T>(source:RandomSource,run:()=>T):T {
  const previous=activeSource;
  activeSource=source;

  try{
    return run();
  }finally{
    activeSource=previous;
  }
}

export function withSeed<T>(seed:number|string,run:()=>T):T {
  return withRandomSource(createSeededRandom(seed),run);
}

/* mulberry32: rápido, determinista y suficiente para simulación de juego. */
export function createSeededRandom(seed:number|string):RandomSource {
  let state=(typeof seed==="number"?seed:hashString(seed))>>>0;

  return ()=>{
    state=(state+0x6D2B79F5)>>>0;

    let value=state;
    value=Math.imul(value^(value>>>15),value|1);
    value^=value+Math.imul(value^(value>>>7),value|61);

    return ((value^(value>>>14))>>>0)/4294967296;
  };
}

export function randomIntBetween(min:number,max:number,source:RandomSource=randomFloat) {
  return Math.floor(source()*(max-min+1))+min;
}

/* Barajado Fisher-Yates sin sesgo. Disponible para etapas futuras: los
   barajados actuales (sort con Math.random) se mantienen para no alterar el
   balance en v0.2. */
export function shuffleFisherYates<T>(items:readonly T[],source:RandomSource=randomFloat):T[] {
  const result=[...items];

  for(let index=result.length-1;index>0;index--){
    const swap=Math.floor(source()*(index+1));
    [result[index],result[swap]]=[result[swap],result[index]];
  }

  return result;
}

/* FNV-1a de 32 bits. Mismo resultado que los `deterministicNumber`/`seededNumber`
   existentes en src/logic. */
export function hashString(value:string):number {
  let hash=2166136261;

  for(let index=0;index<value.length;index++){
    hash^=value.charCodeAt(index);
    hash=Math.imul(hash,16777619);
  }

  return hash>>>0;
}

/* Valor que identifica a las partidas creadas antes de existir la semilla
   por carrera. careerHash con esta semilla reproduce el hash histórico. */
export const LEGACY_CAREER_SEED="legacy";

export function careerHash(key:string,careerSeed?:string|null):number {
  if(!careerSeed||careerSeed===LEGACY_CAREER_SEED)return hashString(key);
  return hashString(`${careerSeed}:${key}`);
}

export function createCareerSeed(source:RandomSource=randomFloat):string {
  return Math.floor(source()*0xFFFFFFFF).toString(36).padStart(7,"0");
}
