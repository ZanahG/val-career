import type {TeamDefinition} from "../types/career";
import type {CoachTeamFinances} from "../types/coach";

export function createCoachTeamFinances(team:TeamDefinition):CoachTeamFinances {
  if(team.tier===1) {
    const prestigeProgress=Math.max(0,Math.min(1,(team.prestige-60)/40));

    return {
      monthlyBudget:Math.round(45000+prestigeProgress*75000),
      currentMonthlyPayroll:0,
      transferBudget:Math.round(25000+prestigeProgress*75000),
    };
  }

  const prestigeProgress=Math.max(0,Math.min(1,(team.prestige-30)/40));

  return {
    monthlyBudget:Math.round(5000+prestigeProgress*15000),
    currentMonthlyPayroll:0,
    transferBudget:Math.round(3000+prestigeProgress*17000),
  };
}