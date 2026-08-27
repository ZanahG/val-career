import type {CoachCareerState,CoachJobMarketState,CoachJobOffer} from "../types/coach";
import {createCoachTeamFinances} from "../data/coachBudgets";
import {createInitialCoachMapPool} from "./coachMapPool";
import {createInitialCoachBoardState} from "./coachBoard";
import {TEAMS} from "../data/teams";

export function createCoachJobMarket(career:CoachCareerState):CoachJobMarketState {
  const season=career.coach.season;
  const reputation=career.coach.reputation;

  const offers=TEAMS
    .filter(team=>team.id!==career.team.teamId)
    .map(team=>({
      team,
      score:getCoachJobInterestScore(career,team.prestige,team.strength),
    }))
    .filter(item=>item.score>=getMinimumInterestScore(item.team.prestige,reputation))
    .sort((a,b)=>{
      if(b.score!==a.score)return b.score-a.score;
      return b.team.prestige-a.team.prestige;
    })
    .slice(0,getJobOfferCount(career))
    .map(({team},index):CoachJobOffer=>({
      id:`job-${season}-${team.id}-${index}`,
      teamId:team.id,
      season,
      contractYears:getJobContractLength(career,team.id),
      reputationRequired:getReputationRequirement(team.prestige),
      prestige:team.prestige,
    }));

  return {
    active:true,
    generatedSeason:season,
    offers,
  };
}

export function acceptCoachJobOffer(career:CoachCareerState,offerId:string):CoachCareerState {
  const jobMarket=career.jobMarket;

  if(!jobMarket?.active)return career;
  if(career.board.employmentStatus!=="Dismissed")return career;

  const offer=jobMarket.offers.find(item=>item.id===offerId);
  if(!offer)return career;

  const newTeam=TEAMS.find(team=>team.id===offer.teamId);
  if(!newTeam)return career;

  const previousTeamId=career.team.teamId;
  const newTeamId=newTeam.id;

  const newRoster=career.playerPool
    .filter(player=>player.teamId===newTeamId)
    .map(player=>({...player,starter:true}))
    .slice(0,5);

  if(newRoster.length<5)return career;

  const previousTeamFinances=career.team.finances;

  const existingNewTeamFinances=career.cpuFinancesByTeam[newTeamId];
  const baseNewTeamFinances=existingNewTeamFinances??createCoachTeamFinances(newTeam);

  const newPayroll=newRoster.reduce((total,player)=>total+player.salary,0);

  const newTeamFinances={
    ...baseNewTeamFinances,
    currentMonthlyPayroll:newPayroll,
  };

  const cpuFinancesByTeam={
    ...career.cpuFinancesByTeam,
    [previousTeamId]:previousTeamFinances,
  };

  delete cpuFinancesByTeam[newTeamId];

  return {
    ...career,
    coach:{
      ...career.coach,
      teamId:newTeamId,
      stage:newTeam.tier===1?"VCT":"Tier 2",
      circuit:newTeam.circuit,
      region:newTeam.marketRegion,
    },
    team:{
      teamId:newTeamId,
      roster:newRoster,
      finances:newTeamFinances,
      chemistry:65,
      form:50,
      tacticalStyle:"Balanced",
      tactics:{
        pace:"Balanced",
        risk:"Medium",
        attackStyle:"Defaults",
        defenseStyle:"Standard",
        operatorUsage:"Situational",
      },
      mapPool:createInitialCoachMapPool(newTeam),
      playerAssignments:[],
      trainingSessions:3,
      trainingPeriod:null,
      trainedMapsThisPeriod:[],
    },
    board:createInitialCoachBoardState(newTeam),
    cpuFinancesByTeam,
    jobMarket:{
      ...jobMarket,
      active:false,
    },
    offseason:null,
    midseasonMarket:null,
  };
}
function getCoachJobInterestScore(career:CoachCareerState,teamPrestige:number,teamStrength:number) {
  let score=career.coach.reputation;

  const history=career.coach.careerHistory;
  const latest=history.at(-1);

  if(latest){
    if(latest.trophies.length>=2)score+=18;
    else if(latest.trophies.length===1)score+=10;

    if(latest.placement===1)score+=16;
    else if(latest.placement===2)score+=12;
    else if(latest.placement<=4&&latest.placement>0)score+=8;
    else if(latest.placement<=8&&latest.placement>0)score+=3;

    const matches=latest.wins+latest.losses;
    const winRate=matches?latest.wins/matches:0;

    if(winRate>=.70)score+=10;
    else if(winRate>=.60)score+=6;
    else if(winRate<.40)score-=6;
  }

  const prestigeGap=teamPrestige-career.coach.reputation;

  if(prestigeGap>=30)score-=25;
  else if(prestigeGap>=20)score-=15;
  else if(prestigeGap>=10)score-=6;
  else if(prestigeGap<=-15)score+=10;

  if(teamStrength>=90&&career.coach.reputation<70)score-=12;
  if(teamStrength>=85&&career.coach.reputation<55)score-=8;

  const variance=
    deterministicNumber(`${career.coach.name}-${career.coach.season}-${teamPrestige}-${teamStrength}-job-interest`)%11-5;

  return score+variance;
}

function getMinimumInterestScore(teamPrestige:number,reputation:number) {
  if(teamPrestige>=90)return reputation>=75?62:82;
  if(teamPrestige>=80)return reputation>=60?55:72;
  if(teamPrestige>=70)return 50;

  return 42;
}

function getReputationRequirement(prestige:number) {
  if(prestige>=95)return 80;
  if(prestige>=90)return 72;
  if(prestige>=85)return 62;
  if(prestige>=80)return 52;
  if(prestige>=70)return 40;

  return 20;
}

function getJobOfferCount(career:CoachCareerState) {
  const reputation=career.coach.reputation;

  if(reputation>=85)return 6;
  if(reputation>=70)return 5;
  if(reputation>=50)return 4;

  return 3;
}

function getJobContractLength(career:CoachCareerState,teamId:string) {
  return 1+(deterministicNumber(`${career.coach.season}-${teamId}-coach-contract`)%3);
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}
export function hasActiveCoachJobMarket(career:CoachCareerState) {
  return Boolean(
    career.board.employmentStatus==="Dismissed"&&
    career.jobMarket?.active
  );
}