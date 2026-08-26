import type {CoachCareerState,CoachTactics,CoachTacticalStyle} from "../types/coach";

export function getCoachTacticalFit(career:CoachCareerState) {
  const {tacticalStyle,tactics}=career.team;
  let score=70;

  if(tacticalStyle==="Aggressive") {
    if(tactics.pace==="Fast")score+=8;
    if(tactics.risk==="High")score+=7;
    if(tactics.attackStyle==="Explosive")score+=8;
    if(tactics.defenseStyle==="Aggressive")score+=7;
    if(tactics.pace==="Slow")score-=10;
  }

  if(tacticalStyle==="Controlled") {
    if(tactics.pace==="Slow")score+=8;
    if(tactics.risk==="Low")score+=6;
    if(tactics.attackStyle==="Map Control")score+=9;
    if(tactics.defenseStyle==="Standard")score+=5;
    if(tactics.attackStyle==="Explosive")score-=8;
  }

  if(tacticalStyle==="Reactive") {
    if(tactics.risk==="Medium")score+=5;
    if(tactics.attackStyle==="Defaults")score+=7;
    if(tactics.defenseStyle==="Retake")score+=8;
  }

  if(tacticalStyle==="Anti-Strat") {
    if(tactics.pace==="Balanced")score+=5;
    if(tactics.risk==="Medium")score+=5;
    if(tactics.attackStyle==="Executions")score+=8;
    if(tactics.defenseStyle==="Standard")score+=5;
  }

  if(tacticalStyle==="Balanced") {
    if(tactics.pace==="Balanced")score+=6;
    if(tactics.risk==="Medium")score+=6;
    if(tactics.defenseStyle==="Standard")score+=6;
  }

  return Math.max(40,Math.min(100,score));
}

export function updateCoachTactics(career:CoachCareerState,tactics:CoachTactics):CoachCareerState {
  return {...career,team:{...career.team,tactics}};
}

export function getTacticalIdentityDescription(style:CoachTacticalStyle) {
  if(style==="Aggressive")return "Busca imponer ritmo, tomar espacio temprano y generar duelos favorables.";
  if(style==="Controlled")return "Prioriza estructura, información y control progresivo del mapa.";
  if(style==="Reactive")return "Lee al rival y modifica el plan según la información obtenida.";
  if(style==="Anti-Strat")return "Construye planes específicos para atacar las tendencias del rival.";
  return "Combina estructura, iniciativa y adaptación sin especializarse en un extremo.";
}