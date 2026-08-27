import type {CoachCareerState,CoachMapName} from "../types/coach";
import {createDefaultCoachBalanceSuite,createExtremeCoachBalanceSuite,getCoachBalanceOpponents,runCoachBalanceSuite} from "./coachBalanceTest";

export function runCoachBalanceDebug(career:CoachCareerState,_opponentTeamId:string,maps:CoachMapName[]) {
  const opponents=getCoachBalanceOpponents(career,maps,200);

  if(!opponents){
    console.warn("No se encontraron rivales válidos para el balance test.");
    return null;
  }

  console.group("COACH BALANCE — OPPONENT CALIBRATION");
  console.table([
    {Type:"FAVORITE",TeamId:opponents.favorite.teamId,BaselineWinRate:opponents.favorite.winRate},
    {Type:"EQUAL",TeamId:opponents.equal.teamId,BaselineWinRate:opponents.equal.winRate},
    {Type:"UNDERDOG",TeamId:opponents.underdog.teamId,BaselineWinRate:opponents.underdog.winRate},
  ]);
  console.groupEnd();

  const runStyleTest=(label:string,opponentTeamId:string)=>{
    const scenarios=createDefaultCoachBalanceSuite(career,opponentTeamId,maps,1000);
    const results=runCoachBalanceSuite(scenarios);

    console.group(`COACH BALANCE — ${label}`);
    console.table(results);
    console.log(JSON.stringify(results,null,2));
    console.groupEnd();

    return results;
  };

  const favoriteResults=runStyleTest("FAVORITE",opponents.favorite.teamId);
  const equalResults=runStyleTest("EQUAL",opponents.equal.teamId);
  const underdogResults=runStyleTest("UNDERDOG",opponents.underdog.teamId);

  const extremeScenarios=createExtremeCoachBalanceSuite(career,opponents.equal.teamId,maps,1000);
  const extremeResults=runCoachBalanceSuite(extremeScenarios);

  console.group("COACH BALANCE — EXTREME TESTS / EQUAL");
  console.table(extremeResults);
  console.log(JSON.stringify(extremeResults,null,2));
  console.groupEnd();

  return {opponents,favoriteResults,equalResults,underdogResults,extremeResults};
}