
import type {CoachCareerState,CoachPlayer} from "../types/coach";
import type {PlayerRole} from "../types/career";

export type CoachMarketRoleFilter = "ALL"|PlayerRole|"IGL";

export interface CoachTransferResult {
  career:CoachCareerState;
  signedPlayer:CoachPlayer;
  releasedPlayer:CoachPlayer;
}

export function getCoachMarketPlayers(allPlayers:CoachPlayer[],career:CoachCareerState,role:CoachMarketRoleFilter) {
  const currentTeamId=career.team.teamId;
  const currentIds=new Set(career.team.roster.map(player=>player.id));

  return allPlayers
    .filter(player=>player.teamId!==currentTeamId&&!currentIds.has(player.id))
    .filter(player=>role==="ALL"||player.role===role)
    .sort((a,b)=>b.overall-a.overall);
}

export function canAffordCoachTransfer(career:CoachCareerState,newPlayer:CoachPlayer,replacedPlayer:CoachPlayer) {
  const payrollAfterTransfer=career.team.finances.currentMonthlyPayroll-replacedPlayer.salary+newPlayer.salary;
  return payrollAfterTransfer<=career.team.finances.monthlyBudget;
}

export function signCoachPlayer(career:CoachCareerState,newPlayer:CoachPlayer,replacedPlayerId:string):CoachTransferResult|null {
  const releasedPlayer=career.team.roster.find(player=>player.id===replacedPlayerId);
  if(!releasedPlayer)return null;
  if(!canAffordCoachTransfer(career,newPlayer,releasedPlayer))return null;

  const signedPlayer:CoachPlayer={...newPlayer,teamId:career.team.teamId,starter:true};

  const roster=career.team.roster.map(player=>player.id===releasedPlayer.id?signedPlayer:player);
  const currentMonthlyPayroll=roster.reduce((total,player)=>total+player.salary,0);

  return {
    career:{
      ...career,
      team:{
        ...career.team,
        roster,
        finances:{...career.team.finances,currentMonthlyPayroll},
        chemistry:Math.max(45,career.team.chemistry-4),
      },
    },
    signedPlayer,
    releasedPlayer,
  };
}