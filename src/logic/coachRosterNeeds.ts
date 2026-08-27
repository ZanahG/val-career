import type {CoachPlayer} from "../types/coach";

export type CoachRosterNeedPriority="Critical"|"High"|"Medium"|"Low"|"None";

export interface CoachRosterRoleNeed {
  role:CoachPlayer["role"];
  count:number;
  starters:number;
  bestOverall:number;
  averageOverall:number;
  averageAge:number;
  bestPotential:number;
  needScore:number;
  priority:CoachRosterNeedPriority;
}

export interface CoachRosterAnalysis {
  rosterSize:number;
  starterCount:number;
  benchCount:number;
  averageOverall:number;
  averageAge:number;
  hasIGL:boolean;
  iglQuality:number;
  missingCoreRoles:CoachPlayer["role"][];
  duplicatedCoreRoles:CoachPlayer["role"][];
  needsBench:boolean;
  needsIGL:boolean;
  weakestRole:CoachPlayer["role"];
  strongestRole:CoachPlayer["role"];
  roleNeeds:CoachRosterRoleNeed[];
  balanceScore:number;
}

const CORE_ROLES:CoachPlayer["role"][]=["Duelist","Initiator","Controller","Sentinel"];

export function analyzeCoachRoster(roster:CoachPlayer[]):CoachRosterAnalysis {
  const roleNeeds:CoachRosterRoleNeed[]=[
    ...CORE_ROLES.map(role=>analyzeCoachRosterRole(roster,role)),
    analyzeCoachRosterRole(roster,"Flex"),
  ];

  const coreNeeds=roleNeeds.filter(item=>CORE_ROLES.includes(item.role));
  const missingCoreRoles=coreNeeds.filter(item=>item.count===0).map(item=>item.role);
  const duplicatedCoreRoles=coreNeeds.filter(item=>item.count>=2).map(item=>item.role);

  const starters=roster.filter(player=>player.starter);
  const igls=roster.filter(player=>player.isIGL);
  const bestIGL=[...igls].sort((a,b)=>getIGLQuality(b)-getIGLQuality(a))[0];

  const weakestRole=[...coreNeeds].sort((a,b)=>{
    if(b.needScore!==a.needScore)return b.needScore-a.needScore;
    return a.bestOverall-b.bestOverall;
  })[0]?.role??"Flex";

  const strongestRole=[...coreNeeds].sort((a,b)=>{
    if(a.needScore!==b.needScore)return a.needScore-b.needScore;
    return b.bestOverall-a.bestOverall;
  })[0]?.role??"Flex";

  return {
    rosterSize:roster.length,
    starterCount:starters.length,
    benchCount:Math.max(0,roster.length-starters.length),
    averageOverall:getAverage(roster.map(player=>player.overall)),
    averageAge:getAverage(roster.map(player=>player.age)),
    hasIGL:igls.length>0,
    iglQuality:bestIGL?getIGLQuality(bestIGL):0,
    missingCoreRoles,
    duplicatedCoreRoles,
    needsBench:false,
    needsIGL:getIGLNeedScore(roster)>20,
    weakestRole,
    strongestRole,
    roleNeeds,
    balanceScore:getCoachRosterBalanceScore(roster,roleNeeds),
  };
}

export function analyzeCoachRosterRole(roster:CoachPlayer[],role:CoachPlayer["role"]):CoachRosterRoleNeed {
  const players=roster.filter(player=>player.role===role);
  const starters=players.filter(player=>player.starter);
  const best=[...players].sort((a,b)=>b.overall-a.overall)[0];

  const bestOverall=best?.overall??0;
  const averageOverall=getAverage(players.map(player=>player.overall));
  const averageAge=getAverage(players.map(player=>player.age));
  const bestPotential=players.length?Math.max(...players.map(player=>player.potential)):0;

  const needScore=getCoachRosterRoleNeedScore(roster,role);

  return {
    role,
    count:players.length,
    starters:starters.length,
    bestOverall,
    averageOverall,
    averageAge,
    bestPotential,
    needScore,
    priority:getNeedPriority(needScore),
  };
}

export function getCoachRosterRoleNeedScore(roster:CoachPlayer[],role:CoachPlayer["role"]) {
  if(role==="Flex")return getFlexNeedScore(roster);

  const players=roster.filter(player=>player.role===role);
  const best=[...players].sort((a,b)=>b.overall-a.overall)[0];

  let score=0;

  if(players.length===0)score+=110;
  else if(players.length===1)score+=25;
  else if(players.length===2)score-=10;
  else score-=30;

  if(!best)score+=50;
  else if(best.overall<70)score+=45;
  else if(best.overall<75)score+=35;
  else if(best.overall<80)score+=25;
  else if(best.overall<84)score+=15;
  else if(best.overall<88)score+=5;
  else if(best.overall>=92)score-=15;

  if(best){
    if(best.age>=32)score+=18;
    else if(best.age>=30)score+=10;

    if(best.potential<=best.overall&&best.age>=28)score+=8;
  }

  const youngProspects=players.filter(player=>player.age<=22&&player.potential>=player.overall+5);

  if(players.length>=2&&youngProspects.length)score-=10;

  if(roster.length<5)score+=15;

  return Math.round(score);
}

export function getCoachRosterNeedForPlayer(roster:CoachPlayer[],player:CoachPlayer) {
  if(player.role==="Flex"){
    const coreNeed=Math.max(...CORE_ROLES.map(role=>getCoachRosterRoleNeedScore(roster,role)));
    const flexNeed=getCoachRosterRoleNeedScore(roster,"Flex");

    return Math.max(flexNeed,coreNeed*.7);
  }

  return getCoachRosterRoleNeedScore(roster,player.role);
}

export function getCoachMostNeededRosterRole(roster:CoachPlayer[]):CoachPlayer["role"] {
  const roles:CoachPlayer["role"][]=["Duelist","Initiator","Controller","Sentinel","Flex"];

  return [...roles].sort((a,b)=>{
    const scoreA=getCoachRosterRoleNeedScore(roster,a);
    const scoreB=getCoachRosterRoleNeedScore(roster,b);

    if(scoreB!==scoreA)return scoreB-scoreA;

    return a.localeCompare(b);
  })[0];
}

export function getCoachRosterPlayerRedundancyScore(roster:CoachPlayer[],player:CoachPlayer) {
  const sameRole=roster.filter(item=>item.id!==player.id&&item.role===player.role);

  if(player.role==="Flex")return sameRole.length>=2?20:0;

  let score=0;

  if(sameRole.length>=1)score+=15;
  if(sameRole.length>=2)score+=20;

  const betterSameRole=sameRole.some(item=>item.overall>=player.overall);
  if(betterSameRole)score+=20;

  const youngerReplacement=sameRole.some(item=>
    item.age+3<=player.age&&
    item.potential>=player.overall&&
    item.overall>=player.overall-4
  );

  if(youngerReplacement)score+=25;

  return score;
}

function getIGLNeedScore(roster:CoachPlayer[]) {
  const igls=roster.filter(player=>player.isIGL);

  if(!igls.length)return 80;

  const bestLeadership=Math.max(...igls.map(player=>
    player.stats.communication*.45+
    player.stats.gameSense*.35+
    player.stats.mental*.20
  ));

  if(bestLeadership<70)return 50;
  if(bestLeadership<76)return 35;
  if(bestLeadership<82)return 18;
  if(bestLeadership<87)return 5;

  return -10;
}

function getFlexNeedScore(roster:CoachPlayer[]) {
  const flexes=roster.filter(player=>player.role==="Flex");

  if(roster.length<5)return flexes.length?10:25;
  if(flexes.length===0)return 8;
  if(flexes.length===1)return 0;

  return -15*flexes.length;
}

function getCoachRosterBalanceScore(roster:CoachPlayer[],roleNeeds:CoachRosterRoleNeed[]) {
  if(!roster.length)return 0;

  let score=100;

  const coreNeeds=roleNeeds.filter(item=>CORE_ROLES.includes(item.role));

  score-=coreNeeds.filter(item=>item.count===0).length*18;
  score-=coreNeeds.filter(item=>item.count>=2).length*5;

  if(!roster.some(player=>player.isIGL))score-=15;

  if(roster.length<5)score-=(5-roster.length)*15;
  if(roster.length>6)score-=(roster.length-6)*8;

  const age=getAverage(roster.map(player=>player.age));

  if(age>=30)score-=10;
  else if(age>=28)score-=5;

  return clamp(Math.round(score),0,100);
}

function getNeedPriority(score:number):CoachRosterNeedPriority {
  if(score>=90)return "Critical";
  if(score>=55)return "High";
  if(score>=25)return "Medium";
  if(score>0)return "Low";

  return "None";
}

function getAverage(values:number[]) {
  if(!values.length)return 0;
  return Math.round(values.reduce((total,value)=>total+value,0)/values.length*10)/10;
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}

export function getCoachRosterReleaseScore(roster:CoachPlayer[],player:CoachPlayer) {
  const redundancy=getCoachRosterPlayerRedundancyScore(roster,player);
  const roleNeed=getCoachRosterRoleNeedScore(roster,player.role);

  let score=0;

  score+=redundancy;

  if(player.overall<70)score+=30;
  else if(player.overall<74)score+=22;
  else if(player.overall<78)score+=14;
  else if(player.overall<82)score+=7;
  else if(player.overall>=88)score-=20;

  const potentialGap=player.potential-player.overall;

  if(player.age<=21&&potentialGap>=6)score-=25;
  else if(player.age<=23&&potentialGap>=4)score-=15;
  else if(player.age>=31)score+=15;
  else if(player.age>=29)score+=8;

  if(player.starter)score-=8;

  if(player.isIGL){
    const otherIGLs=roster.filter(item=>item.id!==player.id&&item.isIGL);

    if(!otherIGLs.length)score-=35;
  }

  if(roleNeed>=80)score-=35;
  else if(roleNeed>=50)score-=20;
  else if(roleNeed>=25)score-=10;

  const sameRole=roster.filter(item=>item.id!==player.id&&item.role===player.role);

  if(!sameRole.length&&player.role!=="Flex")score-=25;

  if(player.salary>=20000)score+=12;
  else if(player.salary>=15000)score+=7;
  else if(player.salary<=5000)score-=5;

  if(player.transferStatus==="TransferListed")score+=30;

  return Math.round(score);
}

export function getCoachBestRosterCutCandidate(roster:CoachPlayer[]) {
  if(!roster.length)return null;

  return [...roster]
    .sort((a,b)=>{
      const scoreA=getCoachRosterReleaseScore(roster,a);
      const scoreB=getCoachRosterReleaseScore(roster,b);

      if(scoreB!==scoreA)return scoreB-scoreA;

      if(a.overall!==b.overall)return a.overall-b.overall;

      return b.age-a.age;
    })[0]??null;
}

function getIGLQuality(player:CoachPlayer) {
  return Math.round(
    player.stats.communication*.45+
    player.stats.gameSense*.35+
    player.stats.mental*.20
  );
}