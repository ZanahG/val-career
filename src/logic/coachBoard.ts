import type {CoachBoardHistoryEntry,CoachBoardObjective,CoachBoardState,CoachCareerState,CoachDismissalReason,CoachJobSecurity} from "../types/coach";
import type {TeamDefinition} from "../types/career";
import {getTeamById} from "../data/teams";

type CoachClubAmbition="Elite"|"Contender"|"Competitive"|"Underdog";

export function createInitialCoachBoardState(team:TeamDefinition):CoachBoardState {
  const confidence=getInitialBoardConfidence(team);

  return {
    confidence,
    seasonStartConfidence:confidence,
    objectives:createCoachBoardObjectives(team),
    lastEvaluation:null,
    jobSecurity:getCoachJobSecurity(confidence),
    employmentStatus:"Employed",
    dismissal:{
      dismissed:false,
      season:null,
      reason:null,
    },
    history:[],
  };
}

export function getCoachJobSecurity(confidence:number):CoachJobSecurity {
  if(confidence>=75)return "Secure";
  if(confidence>=50)return "Stable";
  if(confidence>=25)return "Under Pressure";

  return "Critical";
}

export function createCoachBoardObjectives(team:TeamDefinition):CoachBoardObjective[] {
  const objectives:CoachBoardObjective[]=[];

  if(team.tier!==1){
    objectives.push(
      createObjective("Reach Stage Playoffs",15,4),
    );

    return objectives;
  }

  if(team.strength>=90){
    objectives.push(
      createObjective("Reach Champions",18,6),
      createObjective("Reach Champions Playoffs",12,5),
    );

    return objectives;
  }

  if(team.strength>=85){
    objectives.push(
      createObjective("Reach Stage Playoffs",12,4),
      createObjective("Reach Champions",16,6),
    );

    return objectives;
  }

  if(team.strength>=80){
    objectives.push(
      createObjective("Reach Stage Playoffs",14,5),
    );

    return objectives;
  }

  objectives.push(
    createObjective("Reach Stage Playoffs",10,4),
  );

  return objectives;
}

export function evaluateCoachBoardProgress(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  if(!season)return career;

  let confidence=career.board.confidence;
  let reputation=career.coach.reputation;
  let changed=false;

  const achievedNow:CoachBoardObjective[]=[];

  const objectives=career.board.objectives.map(objective=>{
    if(objective.status!=="Active")return objective;
    if(!isCoachBoardObjectiveAchieved(career,objective))return objective;

    changed=true;
    achievedNow.push(objective);
    confidence+=objective.confidenceImpact;
    reputation+=objective.reputationImpact;

    return {
      ...objective,
      status:"Achieved" as const,
    };
  });

  if(!changed)return career;

  const nextConfidence=clamp(confidence,0,100);
  const nextReputation=clamp(reputation,0,100);
  const actualConfidenceChange=nextConfidence-career.board.confidence;
  const objectiveLabel=achievedNow.map(objective=>objective.type).join(", ");

  return {
    ...career,
    coach:{
      ...career.coach,
      reputation:nextReputation,
    },
    board:{
      ...career.board,
      confidence:nextConfidence,
      objectives,
      lastEvaluation:getCoachBoardEvaluationLabel(career),
      jobSecurity:getCoachJobSecurity(nextConfidence),
      history:addCoachBoardHistory(
        career,
        "Objective",
        objectiveLabel,
        actualConfidenceChange,
        nextConfidence,
      ),
    },
  };
}

export function finalizeCoachBoardSeason(career:CoachCareerState):CoachCareerState {
  let confidence=career.board.confidence;
  let reputation=career.coach.reputation;
  let changed=false;

  const failedNow:CoachBoardObjective[]=[];

  const objectives=career.board.objectives.map(objective=>{
    if(objective.status!=="Active")return objective;

    changed=true;
    failedNow.push(objective);

    confidence-=objective.confidenceImpact;
    reputation-=Math.max(1,Math.round(objective.reputationImpact*.5));

    return {
      ...objective,
      status:"Failed" as const,
    };
  });

  if(!changed){
    const confidenceValue=clamp(career.board.confidence,0,100);

    return {
      ...career,
      board:{
        ...career.board,
        lastEvaluation:`${career.coach.season}-Season Complete`,
        jobSecurity:getCoachJobSecurity(confidenceValue),
      },
    };
  }

  const nextConfidence=clamp(confidence,0,100);
  const nextReputation=clamp(reputation,0,100);
  const actualConfidenceChange=nextConfidence-career.board.confidence;
  const failedLabel=failedNow.map(objective=>objective.type).join(", ");

  return {
    ...career,
    coach:{
      ...career.coach,
      reputation:nextReputation,
    },
    board:{
      ...career.board,
      confidence:nextConfidence,
      objectives,
      lastEvaluation:`${career.coach.season}-Season Complete`,
      jobSecurity:getCoachJobSecurity(nextConfidence),
      history:addCoachBoardHistory(
        career,
        "Season",
        `Failed objectives: ${failedLabel}`,
        actualConfidenceChange,
        nextConfidence,
      ),
    },
  };
}

export function prepareCoachBoardForNextSeason(career:CoachCareerState):CoachCareerState {
  const team=getTeamById(career.team.teamId);
  if(!team)return career;

  const confidence=clamp(career.board.confidence,0,100);

  return {
    ...career,
    board:{
      ...career.board,
      confidence,
      seasonStartConfidence:confidence,
      objectives:createCoachBoardObjectives(team),
      lastEvaluation:null,
      jobSecurity:getCoachJobSecurity(confidence),
      employmentStatus:"Employed",
      dismissal:{
        dismissed:false,
        season:null,
        reason:null,
      },
      history:career.board.history??[],
    },
  };
}

export function evaluateCoachDismissal(career:CoachCareerState):CoachCareerState {
  if(career.board.dismissal.dismissed)return career;

  const confidence=career.board.confidence;
  const reputation=career.coach.reputation;
  const objectives=career.board.objectives;
  const trophies=getCurrentCoachSeasonTrophies(career);

  const failedObjectives=objectives.filter(objective=>objective.status==="Failed").length;
  const achievedObjectives=objectives.filter(objective=>objective.status==="Achieved").length;

  const hasInternationalTitle=trophies.some(trophy=>
    trophy.includes("Masters")||
    trophy.includes("Champions")
  );

  const hasAnyTitle=trophies.length>0;

  if(hasInternationalTitle)return career;

  let dismissalChance=0;
  let reason:CoachDismissalReason|null=null;

  if(confidence<=10){
    dismissalChance=100;
    reason="Critical Confidence";
  }else if(confidence<=20){
    dismissalChance=85;
    reason="Critical Confidence";
  }else if(confidence<=30){
    dismissalChance=55;
    reason=failedObjectives>achievedObjectives?"Failed Objectives":"Poor Season";
  }else if(confidence<=40&&failedObjectives>achievedObjectives){
    dismissalChance=25;
    reason="Failed Objectives";
  }

  if(hasAnyTitle)dismissalChance-=30;

  if(reputation>=85)dismissalChance-=20;
  else if(reputation>=70)dismissalChance-=10;

  if(career.coach.careerHistory.length<=1)dismissalChance-=10;

  dismissalChance=clamp(dismissalChance,0,100);

  if(dismissalChance<=0||!reason)return career;

  const roll=deterministicNumber(
    `${career.team.teamId}-${career.coach.season}-coach-dismissal`,
  )%100;

  if(roll>=dismissalChance)return career;

  return {
    ...career,
    board:{
      ...career.board,
      employmentStatus:"Dismissed",
      dismissal:{
        dismissed:true,
        season:career.coach.season,
        reason,
      },
      history:addCoachBoardHistory(
        career,
        "Dismissal",
        `Dismissed: ${reason}`,
        0,
        career.board.confidence,
      ),
    },
  };
}

export function applyCoachBoardMatchResult(career:CoachCareerState,opponentTeamId:string,won:boolean):CoachCareerState {
  const season=career.seasonState;
  if(!season)return career;

  const team=getTeamById(career.team.teamId);
  const opponent=getTeamById(opponentTeamId);

  if(!team||!opponent)return career;

  const strengthGap=opponent.strength-team.strength;
  const phase=season.phase;

  let confidenceChange=won?2:-2;

  if(won&&strengthGap>=8)confidenceChange+=3;
  else if(won&&strengthGap>=4)confidenceChange+=2;
  else if(!won&&strengthGap<=-8)confidenceChange-=3;
  else if(!won&&strengthGap<=-4)confidenceChange-=2;

  if(phase==="Champions")confidenceChange+=won?2:-2;
  else if(phase==="Masters 1"||phase==="Masters 2")confidenceChange+=won?1:-1;
  else if(phase==="Stage 1 Playoffs"||phase==="Stage 2 Playoffs")confidenceChange+=won?1:-1;
  else if(phase==="Kickoff")confidenceChange+=won?1:-1;

  confidenceChange=clamp(confidenceChange,-6,6);

  const confidence=clamp(career.board.confidence+confidenceChange,0,100);
  const actualConfidenceChange=confidence-career.board.confidence;

  return {
    ...career,
    board:{
      ...career.board,
      confidence,
      jobSecurity:getCoachJobSecurity(confidence),
      lastEvaluation:`${career.coach.season}-${phase}-${won?"Win":"Loss"}`,
      history:addCoachBoardHistory(
        career,
        "Match",
        `${won?"Win":"Loss"} vs ${opponent.name}`,
        actualConfidenceChange,
        confidence,
      ),
    },
  };
}

export function applyCoachBoardStreakPressure(career:CoachCareerState):CoachCareerState {
  const season=career.seasonState;
  if(!season)return career;

  const results=getCoachSeasonResults(career);
  if(results.length<3)return career;

  const latestWon=results.at(-1);
  if(latestWon===undefined)return career;

  const streak=getCurrentResultStreak(results);
  let confidenceChange=0;

  if(latestWon){
    if(streak===3)confidenceChange=2;
    else if(streak===4)confidenceChange=1;
    else if(streak>=5)confidenceChange=2;
  }else{
    if(streak===3)confidenceChange=-2;
    else if(streak===4)confidenceChange=-2;
    else if(streak>=5)confidenceChange=-3;
  }

  if(confidenceChange===0)return career;

  const confidence=clamp(career.board.confidence+confidenceChange,0,100);
  const actualConfidenceChange=confidence-career.board.confidence;

  return {
    ...career,
    board:{
      ...career.board,
      confidence,
      jobSecurity:getCoachJobSecurity(confidence),
      lastEvaluation:`${career.coach.season}-${latestWon?"Win":"Loss"} Streak x${streak}`,
      history:addCoachBoardHistory(
        career,
        "Streak",
        `${latestWon?"Win":"Loss"} streak x${streak}`,
        actualConfidenceChange,
        confidence,
      ),
    },
  };
}

export function applyCoachBoardEventEvaluation(career:CoachCareerState,phase:string):CoachCareerState {
  const season=career.seasonState;
  if(!season)return career;

  const team=getTeamById(career.team.teamId);
  if(!team)return career;

  const event=season.events[phase as keyof typeof season.events];
  if(!event||event.status!=="Complete")return career;

  const ambition=getCoachClubAmbition(team.strength,team.prestige);
  let confidenceChange=0;

  if(phase==="Kickoff"){
    if(event.placement===1){
      confidenceChange=
        ambition==="Underdog"?10:
        ambition==="Competitive"?8:
        ambition==="Contender"?6:
        5;
    }else if(event.placement!==undefined&&event.placement<=3){
      confidenceChange=
        ambition==="Underdog"?6:
        ambition==="Competitive"?4:
        ambition==="Contender"?3:
        2;
    }else if(!season.events["Masters 1"].qualified){
      confidenceChange=
        ambition==="Elite"?-6:
        ambition==="Contender"?-4:
        ambition==="Competitive"?-2:
        0;
    }
  }

  if(phase==="Masters 1"||phase==="Masters 2"){
    if(event.placement===1){
      confidenceChange=
        ambition==="Underdog"?12:
        ambition==="Competitive"?10:
        ambition==="Contender"?9:
        8;
    }else if(event.placement===2){
      confidenceChange=
        ambition==="Underdog"?9:
        ambition==="Competitive"?7:
        ambition==="Contender"?6:
        5;
    }else if(event.placement!==undefined&&event.placement<=4){
      confidenceChange=
        ambition==="Underdog"?7:
        ambition==="Competitive"?5:
        ambition==="Contender"?4:
        3;
    }else if(event.placement!==undefined&&event.placement<=8){
      confidenceChange=
        ambition==="Underdog"?4:
        ambition==="Competitive"?2:
        ambition==="Contender"?1:
        0;
    }else if(event.placement!==undefined){
      confidenceChange=
        ambition==="Elite"?-4:
        ambition==="Contender"?-2:
        ambition==="Competitive"?0:
        2;
    }
  }

  if(phase==="Stage 1 Playoffs"||phase==="Stage 2 Playoffs"){
    if(event.placement===1){
      confidenceChange=
        ambition==="Underdog"?10:
        ambition==="Competitive"?8:
        ambition==="Contender"?7:
        6;
    }else if(event.placement===2){
      confidenceChange=
        ambition==="Underdog"?7:
        ambition==="Competitive"?6:
        ambition==="Contender"?5:
        4;
    }else if(event.placement!==undefined&&event.placement<=4){
      confidenceChange=
        ambition==="Underdog"?5:
        ambition==="Competitive"?4:
        ambition==="Contender"?3:
        2;
    }else{
      confidenceChange=
        ambition==="Elite"?-3:
        ambition==="Contender"?-1:
        0;
    }
  }

  if(phase==="Champions"){
    if(event.placement===1){
      confidenceChange=12;
    }else if(event.placement===2){
      confidenceChange=
        ambition==="Underdog"?12:
        ambition==="Competitive"?10:
        ambition==="Contender"?9:
        8;
    }else if(event.placement!==undefined&&event.placement<=4){
      confidenceChange=
        ambition==="Underdog"?9:
        ambition==="Competitive"?7:
        ambition==="Contender"?6:
        5;
    }else if(event.placement!==undefined&&event.placement<=8){
      confidenceChange=
        ambition==="Underdog"?6:
        ambition==="Competitive"?4:
        ambition==="Contender"?2:
        1;
    }else{
      confidenceChange=
        ambition==="Elite"?-6:
        ambition==="Contender"?-4:
        ambition==="Competitive"?-2:
        -1;
    }
  }

  if(phase==="Stage 2 Playoffs"&&!season.events.Champions.qualified){
    confidenceChange+=
      ambition==="Elite"?-7:
      ambition==="Contender"?-5:
      ambition==="Competitive"?-2:
      0;
  }

  if(confidenceChange===0)return career;

  const confidence=clamp(career.board.confidence+confidenceChange,0,100);
  const actualConfidenceChange=confidence-career.board.confidence;

  return {
    ...career,
    board:{
      ...career.board,
      confidence,
      jobSecurity:getCoachJobSecurity(confidence),
      lastEvaluation:`${career.coach.season}-${phase}-${ambition}-Event Evaluation`,
      history:addCoachBoardHistory(
        career,
        "Event",
        `${phase} evaluation`,
        actualConfidenceChange,
        confidence,
      ),
    },
  };
}

function isCoachBoardObjectiveAchieved(career:CoachCareerState,objective:CoachBoardObjective) {
  const season=career.seasonState;
  if(!season)return false;

  const teamId=career.team.teamId;

  if(objective.type==="Reach Stage Playoffs"){
    const stage1Qualified=Boolean(
      season.stage1?.playoffSeeds.includes(teamId),
    );

    const stage2Qualified=Boolean(
      season.stage2?.playoffSeeds.includes(teamId),
    );

    return stage1Qualified||stage2Qualified;
  }

  if(objective.type==="Reach Masters"){
    return (
      season.events["Masters 1"].qualified||
      season.events["Masters 2"].qualified
    );
  }

  if(objective.type==="Reach Champions"){
    return season.events.Champions.qualified;
  }

  if(objective.type==="Reach Champions Playoffs"){
    return Boolean(
      season.champions?.playoffQualifiedIds.includes(teamId),
    );
  }

  if(objective.type==="Win Regional Event"){
    return (
      season.events.Kickoff.placement===1||
      season.events["Stage 1 Playoffs"].placement===1||
      season.events["Stage 2 Playoffs"].placement===1
    );
  }

  if(objective.type==="Win International Event"){
    return (
      season.events["Masters 1"].placement===1||
      season.events["Masters 2"].placement===1||
      season.events.Champions.placement===1
    );
  }

  return false;
}

function getCoachSeasonResults(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season)return [];

  const phases=[
    "Kickoff",
    "Masters 1",
    "Stage 1",
    "Stage 1 Playoffs",
    "Masters 2",
    "Stage 2",
    "Stage 2 Playoffs",
    "Champions",
  ] as const;

  return phases.flatMap(phase=>
    season.events[phase].matches.map(match=>match.won)
  );
}

function getCurrentResultStreak(results:boolean[]) {
  if(!results.length)return 0;

  const latest=results[results.length-1];
  let streak=0;

  for(let i=results.length-1;i>=0;i--){
    if(results[i]!==latest)break;
    streak++;
  }

  return streak;
}

function getCoachClubAmbition(strength:number,prestige:number):CoachClubAmbition {
  const rating=strength*.7+prestige*.3;

  if(rating>=90)return "Elite";
  if(rating>=85)return "Contender";
  if(rating>=80)return "Competitive";

  return "Underdog";
}

function getCurrentCoachSeasonTrophies(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season)return [];

  const trophies:string[]=[];

  if(season.events.Kickoff.placement===1)trophies.push("Kickoff");
  if(season.events["Stage 1 Playoffs"].placement===1)trophies.push("Stage 1");
  if(season.events["Masters 1"].placement===1)trophies.push("Masters 1");
  if(season.events["Masters 2"].placement===1)trophies.push("Masters 2");
  if(season.events["Stage 2 Playoffs"].placement===1)trophies.push("Stage 2");
  if(season.events.Champions.placement===1)trophies.push("Champions");

  return trophies;
}

function addCoachBoardHistory(career:CoachCareerState,type:CoachBoardHistoryEntry["type"],label:string,confidenceChange:number,confidenceAfter:number) {
  const history=career.board.history??[];

  const entry:CoachBoardHistoryEntry={
    id:`board-history-${career.coach.season}-${history.length}-${type.toLowerCase()}-${deterministicNumber(`${label}-${history.length}`)}`,
    season:career.coach.season,
    type,
    label,
    confidenceChange,
    confidenceAfter,
  };

  return [...history,entry].slice(-50);
}

function getCoachBoardEvaluationLabel(career:CoachCareerState) {
  return `${career.coach.season}-${career.seasonState?.phase??"Season"}`;
}

function createObjective(type:CoachBoardObjective["type"],confidenceImpact:number,reputationImpact:number):CoachBoardObjective {
  return {
    id:`board-${type.toLowerCase().replace(/\s+/g,"-")}`,
    type,
    status:"Active",
    confidenceImpact,
    reputationImpact,
  };
}

function getInitialBoardConfidence(team:TeamDefinition) {
  if(team.tier===2)return clamp(75-(team.prestige-30)*.15,62,78);

  if(team.prestige>=90)return 62;
  if(team.prestige>=80)return 67;
  if(team.prestige>=70)return 72;

  return 76;
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}

function clamp(value:number,min:number,max:number) {
  return Math.round(Math.max(min,Math.min(max,value)));
}