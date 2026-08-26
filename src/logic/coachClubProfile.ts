import type {TeamDefinition} from "../types/career";
import {createCoachTeamFinances} from "../data/coachBudgets";

export type CoachClubExpectation="DEVELOP"|"COMPETE"|"PLAYOFFS"|"INTERNATIONAL"|"TITLES";
export type CoachClubLevel="LOW"|"MEDIUM"|"HIGH"|"CRUCIAL";

export interface CoachClubProfile {
  founded:number|null;
  clubValue:number;
  transferBudget:number;
  stars:number;
  expectation:CoachClubExpectation;
  fanSupport:CoachClubLevel;
  stability:CoachClubLevel;
}

const FOUNDED_BY_TEAM:Record<string,number>={
  "kru-esports":2020,
  kru:2020,
  "sentinels":2016,
  sen:2016,
  "g2-esports":2014,
  g2:2014,
  "cloud9":2013,
  c9:2013,
  "100-thieves":2017,
  "100t":2017,
  loud:2019,
  leviatan:2016,
  lev:2016,
  mibr:2003,
  fnatic:2004,
  fnc:2004,
  vitality:2013,
  "team-vitality":2013,
  liquid:2000,
  "team-liquid":2000,
  navi:2009,
  "natus-vincere":2009,
  "team-heretics":2016,
  heretics:2016,
  "paper-rex":2020,
  prx:2020,
  "t1":2003,
  "gen-g":2017,
  geng:2017,
  drx:2012,
  "rex-regum-qeon":2013,
  rrq:2013,
  "edward-gaming":2013,
  edg:2013,
};

export function getCoachClubProfile(team:TeamDefinition):CoachClubProfile {
  const finances=createCoachTeamFinances(team);

  return {
    founded:getCoachClubFounded(team),
    clubValue:getCoachClubValue(team),
    transferBudget:finances.transferBudget,
    stars:getCoachClubStars(team),
    expectation:getCoachClubExpectation(team),
    fanSupport:getCoachClubFanSupport(team),
    stability:getCoachClubStability(team),
  };
}

export function getCoachClubFounded(team:TeamDefinition) {
  return FOUNDED_BY_TEAM[team.id]??null;
}

export function getCoachClubValue(team:TeamDefinition) {
  const tierMultiplier=team.tier===1?1:0.28;
  const prestigeValue=Math.pow(Math.max(20,team.prestige),2)*18000;
  const strengthValue=Math.pow(Math.max(50,team.strength),2)*12000;

  return roundClubValue((prestigeValue+strengthValue)*tierMultiplier);
}

export function getCoachClubStars(team:TeamDefinition) {
  const score=team.prestige*.55+team.strength*.45;

  if(score>=92)return 5;
  if(score>=86)return 4.5;
  if(score>=80)return 4;
  if(score>=74)return 3.5;
  if(score>=68)return 3;
  if(score>=60)return 2.5;

  return 2;
}

export function getCoachClubExpectation(team:TeamDefinition):CoachClubExpectation {
  const score=team.prestige*.45+team.strength*.55;

  if(team.tier===2){
    if(score>=78)return "TITLES";
    if(score>=70)return "PLAYOFFS";
    return "DEVELOP";
  }

  if(score>=91)return "TITLES";
  if(score>=86)return "INTERNATIONAL";
  if(score>=80)return "PLAYOFFS";
  if(score>=73)return "COMPETE";

  return "DEVELOP";
}

export function getCoachClubFanSupport(team:TeamDefinition):CoachClubLevel {
  if(team.prestige>=90)return "CRUCIAL";
  if(team.prestige>=80)return "HIGH";
  if(team.prestige>=68)return "MEDIUM";

  return "LOW";
}

export function getCoachClubStability(team:TeamDefinition):CoachClubLevel {
  const pressure=team.prestige*.55+team.strength*.45;

  if(pressure>=91)return "LOW";
  if(pressure>=84)return "MEDIUM";
  if(pressure>=74)return "HIGH";

  return "CRUCIAL";
}

function roundClubValue(value:number) {
  if(value>=100000000)return Math.round(value/5000000)*5000000;
  if(value>=10000000)return Math.round(value/1000000)*1000000;

  return Math.round(value/500000)*500000;
}