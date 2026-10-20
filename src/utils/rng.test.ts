import {describe,expect,it,vi} from "vitest";
import {LEGACY_CAREER_SEED,careerHash,createSeededRandom,hashString,randomFloat,randomIntBetween,setRandomSource,shuffleFisherYates,withSeed} from "./rng";
import {createTestPlayer,playFullVCTSeason} from "../test/helpers";

/* Copia literal del `deterministicNumber` histórico (src/logic/coachBoard.ts). */
function legacyDeterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}

describe("rng",()=>{
  it("sin fuente activa delega en Math.random",()=>{
    const spy=vi.spyOn(Math,"random").mockReturnValue(.42);
    expect(randomFloat()).toBe(.42);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("la misma semilla produce la misma secuencia",()=>{
    const a=createSeededRandom("valcareer");
    const b=createSeededRandom("valcareer");
    const sequenceA=Array.from({length:50},()=>a());
    const sequenceB=Array.from({length:50},()=>b());

    expect(sequenceA).toEqual(sequenceB);
    expect(sequenceA.every(value=>value>=0&&value<1)).toBe(true);
    expect(createSeededRandom("otra")()).not.toBe(sequenceA[0]);
  });

  it("withSeed restaura la fuente anterior aunque haya error",()=>{
    expect(()=>withSeed(1,()=>{throw new Error("x");})).toThrow("x");
    const spy=vi.spyOn(Math,"random").mockReturnValue(.1);
    randomFloat();
    expect(spy).toHaveBeenCalled();
  });

  it("reproduce una temporada VCT completa sin tocar Math.random",()=>{
    const spy=vi.spyOn(Math,"random");
    const digest=()=>JSON.stringify(withSeed("temporada",()=>playFullVCTSeason(createTestPlayer())).championshipPointsByTeam);

    expect(digest()).toBe(digest());
    expect(spy).not.toHaveBeenCalled();
  });

  it("distribución uniforme aproximada",()=>{
    const source=createSeededRandom(7);
    const buckets=[0,0,0,0];

    for(let index=0;index<20000;index++)buckets[randomIntBetween(0,3,source)]++;

    buckets.forEach(count=>expect(Math.abs(count-5000)).toBeLessThan(300));
  });

  it("Fisher-Yates conserva los elementos",()=>{
    const items=[1,2,3,4,5,6];
    expect([...shuffleFisherYates(items,createSeededRandom(3))].sort()).toEqual(items);
  });

  it("hashString y careerHash legacy son idénticos al hash histórico",()=>{
    const keys=["","coach-leviatan-kiNgg-2027-retirement","rookie-quality-2027-3","stage1-uqf-1","ñandú-ü"];

    for(const key of keys){
      expect(hashString(key)).toBe(legacyDeterministicNumber(key));
      expect(careerHash(key)).toBe(legacyDeterministicNumber(key));
      expect(careerHash(key,LEGACY_CAREER_SEED)).toBe(legacyDeterministicNumber(key));
    }

    expect(careerHash("k","abc")).not.toBe(legacyDeterministicNumber("k"));
  });

  it("setRandomSource(null) vuelve a Math.random",()=>{
    setRandomSource(()=>.9);
    expect(randomFloat()).toBe(.9);
    setRandomSource(null);
    const spy=vi.spyOn(Math,"random").mockReturnValue(.3);
    expect(randomFloat()).toBe(.3);
    expect(spy).toHaveBeenCalled();
  });
});
