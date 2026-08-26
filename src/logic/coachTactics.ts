import type {CoachCareerState,CoachTactics,CoachTacticalStyle} from "../types/coach";

export function getCoachTacticalFit(career:CoachCareerState) {
  const {tacticalStyle,tactics}=career.team;
  let score=68;

  if(tacticalStyle==="Aggressive"){
    if(tactics.pace==="Fast")score+=8;
    if(tactics.pace==="Balanced")score+=3;
    if(tactics.pace==="Slow")score-=8;

    if(tactics.risk==="High")score+=7;
    if(tactics.risk==="Medium")score+=3;
    if(tactics.risk==="Low")score-=5;

    if(tactics.attackStyle==="Explosive")score+=8;
    if(tactics.attackStyle==="Executions")score+=4;
    if(tactics.attackStyle==="Map Control")score-=3;

    if(tactics.defenseStyle==="Aggressive")score+=7;
    if(tactics.defenseStyle==="Standard")score+=3;
    if(tactics.defenseStyle==="Passive")score-=5;

    if(tactics.operatorUsage==="Rare")score+=3;
    if(tactics.operatorUsage==="Situational")score+=2;
    if(tactics.operatorUsage==="Priority")score+=1;
  }

  if(tacticalStyle==="Controlled"){
    if(tactics.pace==="Slow")score+=7;
    if(tactics.pace==="Balanced")score+=5;
    if(tactics.pace==="Fast")score-=6;

    if(tactics.risk==="Low")score+=7;
    if(tactics.risk==="Medium")score+=5;
    if(tactics.risk==="High")score-=6;

    if(tactics.attackStyle==="Map Control")score+=8;
    if(tactics.attackStyle==="Defaults")score+=5;
    if(tactics.attackStyle==="Explosive")score-=7;

    if(tactics.defenseStyle==="Standard")score+=6;
    if(tactics.defenseStyle==="Passive")score+=4;
    if(tactics.defenseStyle==="Aggressive")score-=4;

    if(tactics.operatorUsage==="Situational")score+=3;
    if(tactics.operatorUsage==="Priority")score+=2;
    if(tactics.operatorUsage==="Rare")score+=1;
  }

  if(tacticalStyle==="Reactive"){
    if(tactics.pace==="Balanced")score+=7;
    if(tactics.pace==="Slow")score+=4;
    if(tactics.pace==="Fast")score-=3;

    if(tactics.risk==="Medium")score+=7;
    if(tactics.risk==="Low")score+=3;
    if(tactics.risk==="High")score-=4;

    if(tactics.attackStyle==="Defaults")score+=8;
    if(tactics.attackStyle==="Map Control")score+=4;
    if(tactics.attackStyle==="Explosive")score-=4;

    if(tactics.defenseStyle==="Retake")score+=8;
    if(tactics.defenseStyle==="Standard")score+=4;
    if(tactics.defenseStyle==="Aggressive")score-=3;

    if(tactics.operatorUsage==="Situational")score+=3;
    if(tactics.operatorUsage==="Priority")score+=1;
    if(tactics.operatorUsage==="Rare")score+=1;
  }

  if(tacticalStyle==="Anti-Strat"){
    if(tactics.pace==="Balanced")score+=7;
    if(tactics.pace==="Slow")score+=3;
    if(tactics.pace==="Fast")score-=2;

    if(tactics.risk==="Medium")score+=7;
    if(tactics.risk==="Low")score+=3;
    if(tactics.risk==="High")score-=3;

    if(tactics.attackStyle==="Defaults")score+=7;
    if(tactics.attackStyle==="Map Control")score+=6;
    if(tactics.attackStyle==="Executions")score+=3;

    if(tactics.defenseStyle==="Retake")score+=7;
    if(tactics.defenseStyle==="Standard")score+=6;
    if(tactics.defenseStyle==="Aggressive")score-=3;

    if(tactics.operatorUsage==="Situational")score+=3;
    if(tactics.operatorUsage==="Priority")score+=2;
    if(tactics.operatorUsage==="Rare")score+=2;
  }

  if(tacticalStyle==="Balanced"){
    if(tactics.pace==="Balanced")score+=7;
    if(tactics.pace==="Slow"||tactics.pace==="Fast")score+=2;

    if(tactics.risk==="Medium")score+=7;
    if(tactics.risk==="Low"||tactics.risk==="High")score+=2;

    if(tactics.attackStyle==="Defaults")score+=6;
    if(tactics.attackStyle==="Executions")score+=5;
    if(tactics.attackStyle==="Map Control")score+=5;
    if(tactics.attackStyle==="Explosive")score+=2;

    if(tactics.defenseStyle==="Standard")score+=7;
    if(tactics.defenseStyle==="Retake")score+=4;
    if(tactics.defenseStyle==="Passive"||tactics.defenseStyle==="Aggressive")score+=2;

    if(tactics.operatorUsage==="Situational")score+=5;
    if(tactics.operatorUsage==="Rare"||tactics.operatorUsage==="Priority")score+=1;
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