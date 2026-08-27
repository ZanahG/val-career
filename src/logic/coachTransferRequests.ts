import type {CoachPlayer,CoachTransferRequest} from "../types/coach";
import {getTeamById} from "../data/teams";

export function generateCoachTransferRequests(playerPool:CoachPlayer[],season:number,playerTeamId:string):CoachTransferRequest[] {
  const requests:CoachTransferRequest[]=[];

  for(const player of playerPool){
    if(player.teamId==="free-agent")continue;
    if(player.teamId===playerTeamId)continue;

    const roster=playerPool.filter(item=>item.teamId===player.teamId);
    const reason=getTransferRequestReason(player,roster,season);

    if(!reason)continue;

    requests.push({
      playerId:player.id,
      playerName:player.ign,
      teamId:player.teamId,
      reason,
    });
  }

  return requests;
}

function getTransferRequestReason(player:CoachPlayer,roster:CoachPlayer[],season:number):CoachTransferRequest["reason"]|null {
  const team=getTeamById(player.teamId);
  const teamStrength=team?.strength??80;
  const starterRank=[...roster].sort((a,b)=>b.overall-a.overall).findIndex(item=>item.id===player.id);
  const isStarter=starterRank>=0&&starterRank<5;

  const notStartingChance=!isStarter&&player.overall>=78?getRequestRoll(player,season,"bench")<45:false;
  if(notStartingChance)return "Not Starting";

  const strongerTeamChance=player.overall>=86&&teamStrength<=80?getRequestRoll(player,season,"stronger-team")<35:false;
  if(strongerTeamChance)return "Seeking Stronger Team";

  const contractSituation=(player.contractSeasonsRemaining??0)===1&&player.overall>=80?getRequestRoll(player,season,"contract")<25:false;
  if(contractSituation)return "Contract Situation";

  const careerAmbition=player.age>=22&&player.age<=27&&player.overall>=84&&player.potential>=88&&teamStrength<84
    ?getRequestRoll(player,season,"ambition")<20
    :false;

  if(careerAmbition)return "Career Ambition";

  return null;
}

function getRequestRoll(player:CoachPlayer,season:number,type:string) {
  return deterministicNumber(`${player.id}-${season}-${type}-transfer-request`)%100;
}

function deterministicNumber(value:string) {
  let hash=2166136261;

  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }

  return Math.abs(hash>>>0);
}