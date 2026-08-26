import type {TeamDefinition} from "../types/career";
import type {CoachTeamFinances} from "../types/coach";

const TRANSFER_BUDGET_CARRYOVER=.25;

export function createCoachTeamFinances(team:TeamDefinition):CoachTeamFinances {
  if(team.tier===1){
    const prestigeProgress=Math.max(0,Math.min(1,(team.prestige-60)/40));

    return {
      monthlyBudget:Math.round(35000+prestigeProgress*110000),
      currentMonthlyPayroll:0,
      transferBudget:Math.round(100000+prestigeProgress*250000),
    };
  }

  const prestigeProgress=Math.max(0,Math.min(1,(team.prestige-30)/40));

  return {
    monthlyBudget:Math.round(8000+prestigeProgress*24000),
    currentMonthlyPayroll:0,
    transferBudget:Math.round(20000+prestigeProgress*60000),
  };
}

export function renewCoachTeamFinances(team:TeamDefinition,current:CoachTeamFinances,currentMonthlyPayroll:number):CoachTeamFinances {
  const base=createCoachTeamFinances(team);
  const maxCarryover=Math.round(base.transferBudget*TRANSFER_BUDGET_CARRYOVER);
  const carryover=Math.max(0,Math.min(current.transferBudget,maxCarryover));

  return {
    monthlyBudget:base.monthlyBudget,
    currentMonthlyPayroll,
    transferBudget:base.transferBudget+carryover,
  };
}