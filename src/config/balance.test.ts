import {describe,expect,it} from "vitest";
import {getCoachJobSecurity} from "../logic/coachBoard";
import {COACH_TRAINING_SESSIONS_PER_PERIOD} from "../logic/coachTraining";
import {MINIGAME_BALANCE,INTRO_STAT_MULTIPLIER} from "./balance";
import {scaleIntroCareerEffects} from "../logic/careerPlayer";

/* Comportamientos que dependen de config/balance.ts y que no cubren las
   pruebas de caracterización. Reflejan los valores históricos. */
describe("valores de balance",()=>{
  it("seguridad laboral del entrenador",()=>{
    expect([100,75,74,50,49,25,24,0].map(getCoachJobSecurity)).toEqual(["Secure","Secure","Stable","Stable","Under Pressure","Under Pressure","Critical","Critical"]);
  });

  it("sesiones de entrenamiento, minijuegos y eventos iniciales",()=>{
    expect(COACH_TRAINING_SESSIONS_PER_PERIOD).toBe(3);
    expect(MINIGAME_BALANCE).toEqual({chance:.35,cooldownMatches:5});
    expect(INTRO_STAT_MULTIPLIER).toBe(2);
    expect(scaleIntroCareerEffects({aim:2,mental:-1,currentStage:"Amateur"})).toMatchObject({aim:4,mental:-1,currentStage:"Amateur"});
  });
});
