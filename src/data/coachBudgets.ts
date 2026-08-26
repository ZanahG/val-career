import type {TeamDefinition} from "../types/career";
import type {CoachTeamFinances} from "../types/coach";

const TRANSFER_BUDGET_CARRYOVER=.25;

export function createCoachTeamFinances(team:TeamDefinition):CoachTeamFinances {
  if(team.tier===1){
    const prestigeProgress=Math.max(0,Math.min(1,(team.prestige-60)/40));

    return {
      monthlyBudget:Math.round(65000+prestigeProgress*85000),
      currentMonthlyPayroll:0,
      transferBudget:Math.round(1500000+prestigeProgress*5500000),
    };
  }

  const prestigeProgress=Math.max(0,Math.min(1,(team.prestige-30)/40));

  return {
    monthlyBudget:Math.round(12000+prestigeProgress*28000),
    currentMonthlyPayroll:0,
    transferBudget:Math.round(250000+prestigeProgress*1000000),
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