import type {CoachPlayer,CoachTeamFinances} from "../types/coach";
import {TEAMS} from "../data/teams";
import {createCoachTeamFinances} from "../data/coachBudgets";

export function createInitialCoachCPUFinances(playerPool:CoachPlayer[],playerTeamId:string):Record<string,CoachTeamFinances> {
  return Object.fromEntries(
    TEAMS
      .filter(team=>team.tier===1&&team.id!==playerTeamId)
      .map(team=>{
        const roster=playerPool.filter(player=>player.teamId===team.id);
        const currentMonthlyPayroll=roster.reduce((total,player)=>total+player.salary,0);
        const finances=createCoachTeamFinances(team);

        return [
          team.id,
          {
            ...finances,
            currentMonthlyPayroll,
          },
        ];
      }),
  );
}