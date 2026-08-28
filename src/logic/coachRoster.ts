import type {PlayerRole,PlayerStats,TeamDefinition} from "../types/career";
import type {CoachPlayer} from "../types/coach";
import {TEAMS} from "../data/teams";
import {getCoachPlayerMarketValue} from "./coachPlayerValue";
import {getEffectiveVCTRoster} from "../data/vctPlayers";

const TIER2_ROLES:PlayerRole[]=["Duelist","Initiator","Controller","Sentinel","Flex"];
const INITIAL_COACH_SEASON=2026;

export function createInitialCoachRoster(team:TeamDefinition):CoachPlayer[] {
  const realRoster=getEffectiveVCTRoster(team.name);

  if(realRoster.length>=5){
    return realRoster.slice(0,5).map(player=>{
      const role=normalizeRole(player.role);
      const isIGL=normalizeIsIGL(player.role);
      const stats={...player.stats};
      const overall=getStatsOverall(stats);
      const contractLength=getInitialContractLength(player.age);

      const coachPlayer:CoachPlayer={
        id:`coach-${team.id}-${normalizePlayerId(player.ign)}`,
        ign:player.ign,
        teamId:team.id,
        role,
        isIGL,
        stats,
        overall,
        potential:getInitialPotential(overall,player.age,team.tier===1),
        peakAge:getInitialPeakAge(player.age,role),
        salary:getInitialCoachPlayerSalary(overall,team.tier),
        age:player.age,
        starter:true,
        marketValue:0,

        contractStartSeason:INITIAL_COACH_SEASON,
        contractEndSeason:INITIAL_COACH_SEASON+contractLength-1,
        contractSeasonsRemaining:contractLength,
        contractStatus:getContractStatus(contractLength),
        transferStatus:"NotListed",
        joinedTeamSeason:INITIAL_COACH_SEASON,
      };

      return {...coachPlayer,marketValue:getCoachPlayerMarketValue(coachPlayer)};
    });
  }

  return createGeneratedTier2Roster(team);
}

export function createCoachPlayerPool():CoachPlayer[] {
  return TEAMS.flatMap(team=>createInitialCoachRoster(team));
}

export function createCoachRookieClass(season:number):CoachPlayer[] {
  const count=10+(deterministicNumber(`rookie-count-${season}`)%5);

  return Array.from({length:count},(_,index)=>{
    const role=TIER2_ROLES[deterministicNumber(`rookie-role-${season}-${index}`)%TIER2_ROLES.length];
    const age=17+(deterministicNumber(`rookie-age-${season}-${index}`)%4);
    const base=getRookieBaseOverall(season,index);
    const stats=createDeterministicStatsForRole(role,base,`${season}-${index}`);
    const overall=getStatsOverall(stats);
    const potential=getRookiePotential(overall,season,index);
    const peakAge=getRookiePeakAge(role,season,index);

    const coachPlayer:CoachPlayer={
      id:`rookie-${season}-${index}`,
      ign:getRookieName(season,index),
      teamId:"free-agent",
      role,
      isIGL:getRookieIsIGL(season,index),
      stats,
      overall,
      potential,
      peakAge,
      salary:getRookieSalary(overall,potential),
      age,
      starter:false,
      marketValue:0,

      contractStartSeason:season,
      contractEndSeason:season,
      contractSeasonsRemaining:0,
      contractStatus:"FreeAgent",
      transferStatus:"NotListed",
      joinedTeamSeason:season,
    };

    return {...coachPlayer,marketValue:getCoachPlayerMarketValue(coachPlayer)};
  });
}

function createGeneratedTier2Roster(team:TeamDefinition):CoachPlayer[] {
  return TIER2_ROLES.map((role,index)=>{
    const base=team.strength+random(-4,4);
    const isIGL=getGeneratedIsIGL(team.id,index);
    const stats=createStatsForRole(role,base);
    const overall=getStatsOverall(stats);
    const age=random(18,27);
    const contractLength=getInitialContractLength(age);

    const coachPlayer:CoachPlayer={
      id:`coach-${team.id}-${index}`,
      ign:getGeneratedPlayerName(team.shortName,index),
      teamId:team.id,
      role,
      isIGL,
      stats,
      overall,
      potential:getInitialPotential(overall,age,false),
      peakAge:getInitialPeakAge(age,role),
      salary:getInitialCoachPlayerSalary(overall,2),
      age,
      starter:true,
      marketValue:0,

      contractStartSeason:INITIAL_COACH_SEASON,
      contractEndSeason:INITIAL_COACH_SEASON+contractLength-1,
      contractSeasonsRemaining:contractLength,
      contractStatus:getContractStatus(contractLength),
      transferStatus:"NotListed",
      joinedTeamSeason:INITIAL_COACH_SEASON,
    };

    return {...coachPlayer,marketValue:getCoachPlayerMarketValue(coachPlayer)};
  });
}

function getRookieIsIGL(season:number,index:number) {
  return deterministicNumber(`rookie-igl-${season}-${index}`)%100<18;
}

function getGeneratedIsIGL(teamId:string,index:number) {
  return deterministicNumber(`${teamId}-${index}-igl`)%100<20;
}

function createStatsForRole(role:PlayerRole,base:number):PlayerStats {
  const stat=()=>clamp(base+random(-5,5),50,92);

  if(role==="Duelist"){
    return {
      aim:clamp(base+6,50,94),
      gameSense:stat(),
      communication:clamp(base-5,50,90),
      clutch:clamp(base+3,50,93),
      consistency:stat(),
      mental:stat(),
    };
  }

  if(role==="Initiator"){
    return {
      aim:stat(),
      gameSense:clamp(base+4,50,94),
      communication:clamp(base+5,50,94),
      clutch:stat(),
      consistency:stat(),
      mental:stat(),
    };
  }

  if(role==="Controller"){
    return {
      aim:stat(),
      gameSense:clamp(base+5,50,94),
      communication:clamp(base+4,50,94),
      clutch:stat(),
      consistency:clamp(base+4,50,94),
      mental:stat(),
    };
  }

  if(role==="Sentinel"){
    return {
      aim:stat(),
      gameSense:clamp(base+4,50,94),
      communication:stat(),
      clutch:clamp(base+2,50,94),
      consistency:clamp(base+5,50,94),
      mental:stat(),
    };
  }

  return {
    aim:stat(),
    gameSense:stat(),
    communication:stat(),
    clutch:stat(),
    consistency:stat(),
    mental:stat(),
  };
}

function createDeterministicStatsForRole(role:PlayerRole,base:number,seed:string):PlayerStats {
  const stat=(name:string,offset=0)=>clamp(base+offset+randomDeterministic(-4,4,`${seed}-${name}`),45,94);

  if(role==="Duelist"){
    return {
      aim:stat("aim",6),
      gameSense:stat("gameSense"),
      communication:stat("communication",-4),
      clutch:stat("clutch",3),
      consistency:stat("consistency"),
      mental:stat("mental"),
    };
  }

  if(role==="Initiator"){
    return {
      aim:stat("aim"),
      gameSense:stat("gameSense",4),
      communication:stat("communication",4),
      clutch:stat("clutch"),
      consistency:stat("consistency"),
      mental:stat("mental"),
    };
  }

  if(role==="Controller"){
    return {
      aim:stat("aim"),
      gameSense:stat("gameSense",5),
      communication:stat("communication",3),
      clutch:stat("clutch"),
      consistency:stat("consistency",3),
      mental:stat("mental"),
    };
  }

  if(role==="Sentinel"){
    return {
      aim:stat("aim"),
      gameSense:stat("gameSense",4),
      communication:stat("communication"),
      clutch:stat("clutch",2),
      consistency:stat("consistency",4),
      mental:stat("mental"),
    };
  }

  return {
    aim:stat("aim"),
    gameSense:stat("gameSense"),
    communication:stat("communication"),
    clutch:stat("clutch"),
    consistency:stat("consistency"),
    mental:stat("mental"),
  };
}

function normalizeRole(role:string):PlayerRole {
  const normalized=role.trim().toLowerCase();

  if(normalized.includes("duel"))return "Duelist";
  if(normalized.includes("inici")||normalized.includes("init"))return "Initiator";
  if(normalized.includes("control"))return "Controller";
  if(normalized.includes("cent")||normalized.includes("sent"))return "Sentinel";

  return "Flex";
}

function normalizeIsIGL(role:string) {
  return role.trim().toLowerCase()==="igl";
}

function normalizePlayerId(ign:string) {
  return ign.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

function getStatsOverall(stats:PlayerStats) {
  return Math.round(
    (
      stats.aim+
      stats.gameSense+
      stats.communication+
      stats.clutch+
      stats.consistency+
      stats.mental
    )/6,
  );
}

function getInitialContractLength(age:number) {
  if(age<=21)return random(2,4);
  if(age<=27)return random(1,3);
  if(age<=31)return random(1,2);

  return 1;
}

function getContractStatus(remaining:number):CoachPlayer["contractStatus"] {
  if(remaining<=0)return "FreeAgent";
  if(remaining===1)return "Expiring";

  return "Active";
}

function getInitialCoachPlayerSalary(overall:number,tier:1|2) {
  if(tier===1){
    if(overall>=94)return random(22000,30000);
    if(overall>=90)return random(15000,22000);
    if(overall>=85)return random(11000,18000);
    if(overall>=80)return random(7500,14000);

    return random(5000,9000);
  }

  if(overall>=80)return random(1800,3200);
  if(overall>=75)return random(1200,2400);
  if(overall>=70)return random(800,1800);

  return random(500,1300);
}

function getInitialPotential(overall:number,age:number,tier1:boolean) {
  const growthRoom=
    age<=19?random(7,14):
    age<=21?random(5,11):
    age<=23?random(3,8):
    age<=26?random(1,5):
    age<=29?random(0,3):
    random(0,1);

  const tierBonus=tier1?random(0,2):0;

  return clamp(overall+growthRoom+tierBonus,overall,99);
}

function getInitialPeakAge(age:number,role:PlayerRole) {
  const base=
    role==="Controller"?random(24,28):
    role==="Initiator"?random(23,27):
    role==="Sentinel"?random(23,27):
    role==="Duelist"?random(21,25):
    random(23,27);

  return Math.max(age,base);
}

function getRookieBaseOverall(season:number,index:number) {
  const roll=deterministicNumber(`rookie-quality-${season}-${index}`)%100;

  if(roll<3)return 78;
  if(roll<12)return 74;
  if(roll<35)return 70;
  if(roll<70)return 66;

  return 62;
}

function getRookiePotential(overall:number,season:number,index:number) {
  const roll=deterministicNumber(`rookie-potential-${season}-${index}`)%100;

  const growth=
    roll<2?randomDeterministic(14,19,`rookie-growth-${season}-${index}`):
    roll<10?randomDeterministic(10,15,`rookie-growth-${season}-${index}`):
    roll<35?randomDeterministic(7,12,`rookie-growth-${season}-${index}`):
    roll<70?randomDeterministic(4,9,`rookie-growth-${season}-${index}`):
    randomDeterministic(2,6,`rookie-growth-${season}-${index}`);

  return clamp(overall+growth,overall,99);
}

function getRookiePeakAge(role:PlayerRole,season:number,index:number) {
  const range:[number,number]=
    role==="Duelist"?[21,25]:
    role==="Controller"?[24,28]:
    role==="Initiator"?[23,27]:
    role==="Sentinel"?[23,27]:
    [23,27];

  return randomDeterministic(range[0],range[1],`rookie-peak-${season}-${index}`);
}

function getRookieSalary(overall:number,potential:number) {
  const value=overall+(potential-overall)*.4;

  if(value>=82)return 3500;
  if(value>=78)return 2500;
  if(value>=74)return 1800;
  if(value>=70)return 1200;

  return 700;
}

function getRookieName(season:number,index:number) {
  const prefixes=["Nova","Zero","Kyo","Lynx","Vex","Nox","Aero","Flux","Kiro","Zyn","Ryn","Sora","Nero","Kaze","Vyn","Lumi","Zeru","Aki"];
  const suffixes=["X","7","Z","One","V","K","R","Q","N","S"];

  const prefix=prefixes[deterministicNumber(`rookie-name-a-${season}-${index}`)%prefixes.length];
  const suffix=suffixes[deterministicNumber(`rookie-name-b-${season}-${index}`)%suffixes.length];

  return `${prefix}${suffix}${index+1}`;
}

function getGeneratedPlayerName(shortName:string,index:number) {
  return `${shortName} Player ${index+1}`;
}

function random(min:number,max:number) {
  return Math.floor(Math.random()*(max-min+1))+min;
}

function randomDeterministic(min:number,max:number,seed:string) {
  return min+(deterministicNumber(seed)%(max-min+1));
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
  return Math.max(min,Math.min(max,value));
}