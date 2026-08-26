import type {CoachAttackStyle,CoachCareerState,CoachDefenseStyle,CoachOperatorUsage,CoachPace,CoachRisk,CoachTacticalStyle} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getCoachTacticalFit,getTacticalIdentityDescription} from "../../logic/coachTactics";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachTactics.css";

interface CoachTacticsProps {
  career:CoachCareerState;
  onUpdateCareer:(career:CoachCareerState)=>void;
  onBack:()=>void;
}

const STYLES:CoachTacticalStyle[]=["Balanced","Aggressive","Controlled","Reactive","Anti-Strat"];
const PACES:CoachPace[]=["Slow","Balanced","Fast"];
const RISKS:CoachRisk[]=["Low","Medium","High"];
const ATTACKS:CoachAttackStyle[]=["Defaults","Executions","Map Control","Explosive"];
const DEFENSES:CoachDefenseStyle[]=["Passive","Standard","Aggressive","Retake"];
const OPERATORS:CoachOperatorUsage[]=["Rare","Situational","Priority"];

export function CoachTactics({career,onUpdateCareer,onBack}:CoachTacticsProps) {
  const fit=getCoachTacticalFit(career);
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);

  const setStyle=(tacticalStyle:CoachTacticalStyle)=>{
    onUpdateCareer({...career,team:{...career.team,tacticalStyle}});
  };

  const updateTactic=<K extends keyof typeof career.team.tactics>(key:K,value:(typeof career.team.tactics)[K])=>{
    onUpdateCareer({...career,team:{...career.team,tactics:{...career.team.tactics,[key]:value}}});
  };

  return (
    <main className="coach-tactics">
      <div className="coach-tactics__bg"/>
      <div className="coach-tactics__overlay"/>

      <div className="coach-tactics__shell">
        <header className="coach-tactics__topbar">
          <div className="coach-tactics__club">
            <div className="coach-tactics__club-logo">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>GESTIÓN TÁCTICA</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-tactics__back" onClick={onBack}>← DASHBOARD</button>
        </header>

        <section className="coach-tactics__hero">
          <div>
            <span className="coach-tactics__eyebrow">FILOSOFÍA DE JUEGO</span>
            <h1>TÁCTICAS</h1>
            <p>Define cómo quieres que tu equipo interprete cada ronda, desde el ritmo general hasta el uso del Operator.</p>
          </div>

          <div className={`coach-tactics__fit ${fit>=85?"coach-tactics__fit--good":fit<65?"coach-tactics__fit--bad":""}`}>
            <span>COHERENCIA TÁCTICA</span>
            <strong>{fit}</strong>
            <small>/ 100</small>
          </div>
        </section>

        <section className="coach-tactics__identity coach-card">
          <header className="coach-tactics__section-head">
            <div>
              <span>IDENTIDAD DEL EQUIPO</span>
              <strong>FILOSOFÍA PRINCIPAL</strong>
            </div>

            <span>{getStyleLabel(career.team.tacticalStyle)}</span>
          </header>

          <div className="coach-tactics__styles">
            {STYLES.map(style=>(
              <button key={style} className={career.team.tacticalStyle===style?"active":""} onClick={()=>setStyle(style)}>
                <span>{getStyleIndex(style)}</span>
                <strong>{getStyleLabel(style)}</strong>
                <small>{getStyleShortDescription(style)}</small>
              </button>
            ))}
          </div>

          <div className="coach-tactics__identity-description">
            <span>DESCRIPCIÓN</span>
            <p>{getTacticalIdentityDescription(career.team.tacticalStyle)}</p>
          </div>
        </section>

        <div className="coach-tactics__layout">
          <section className="coach-tactics__settings coach-card">
            <header className="coach-tactics__section-head">
              <div>
                <span>PLAN DE PARTIDO</span>
                <strong>CONFIGURACIÓN TÁCTICA</strong>
              </div>

              <span>ACTUAL</span>
            </header>

            <TacticSetting title="RITMO DE JUEGO" description="Define la velocidad con la que el equipo ejecuta el plan.">
              {PACES.map(value=><OptionButton key={value} active={career.team.tactics.pace===value} onClick={()=>updateTactic("pace",value)}>{getPaceLabel(value)}</OptionButton>)}
            </TacticSetting>

            <TacticSetting title="RIESGO" description="Nivel de riesgo que asumirás para buscar ventajas tempranas.">
              {RISKS.map(value=><OptionButton key={value} active={career.team.tactics.risk===value} onClick={()=>updateTactic("risk",value)}>{getRiskLabel(value)}</OptionButton>)}
            </TacticSetting>

            <TacticSetting title="ATAQUE" description="Estructura principal utilizada durante el lado atacante.">
              {ATTACKS.map(value=><OptionButton key={value} active={career.team.tactics.attackStyle===value} onClick={()=>updateTactic("attackStyle",value)}>{getAttackLabel(value)}</OptionButton>)}
            </TacticSetting>

            <TacticSetting title="DEFENSA" description="Comportamiento preferido cuando el rival tiene la iniciativa.">
              {DEFENSES.map(value=><OptionButton key={value} active={career.team.tactics.defenseStyle===value} onClick={()=>updateTactic("defenseStyle",value)}>{getDefenseLabel(value)}</OptionButton>)}
            </TacticSetting>

            <TacticSetting title="OPERATOR" description="Prioridad económica y táctica que tendrá el Operator.">
              {OPERATORS.map(value=><OptionButton key={value} active={career.team.tactics.operatorUsage===value} onClick={()=>updateTactic("operatorUsage",value)}>{getOperatorLabel(value)}</OptionButton>)}
            </TacticSetting>
          </section>

          <aside className="coach-tactics__summary coach-card">
            <header className="coach-tactics__section-head">
              <div>
                <span>RESUMEN</span>
                <strong>PLAN ACTUAL</strong>
              </div>
            </header>

            <div className="coach-tactics__summary-style">
              <span>IDENTIDAD</span>
              <strong>{getStyleLabel(career.team.tacticalStyle)}</strong>
              <p>{getStyleShortDescription(career.team.tacticalStyle)}</p>
            </div>

            <div className="coach-tactics__summary-grid">
              <Summary label="RITMO" value={getPaceLabel(career.team.tactics.pace)}/>
              <Summary label="RIESGO" value={getRiskLabel(career.team.tactics.risk)}/>
              <Summary label="ATAQUE" value={getAttackLabel(career.team.tactics.attackStyle)}/>
              <Summary label="DEFENSA" value={getDefenseLabel(career.team.tactics.defenseStyle)}/>
              <Summary label="OPERATOR" value={getOperatorLabel(career.team.tactics.operatorUsage)}/>
            </div>

            <div className="coach-tactics__fit-summary">
              <div>
                <span>COHERENCIA</span>
                <strong>{fit}</strong>
              </div>

              <div className="coach-tactics__fit-bar">
                <span style={{width:`${fit}%`}}/>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function TacticSetting({title,description,children}:{title:string;description:string;children:React.ReactNode}) {
  return (
    <article className="coach-tactics__setting">
      <div className="coach-tactics__setting-info">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <div className="coach-tactics__options">{children}</div>
    </article>
  );
}

function OptionButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}) {
  return <button className={active?"active":""} onClick={onClick}>{children}</button>;
}

function Summary({label,value}:{label:string;value:string}) {
  return (
    <div className="coach-tactics__summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getStyleIndex(value:CoachTacticalStyle) {
  return String(STYLES.indexOf(value)+1).padStart(2,"0");
}

function getStyleLabel(value:CoachTacticalStyle) {
  if(value==="Aggressive")return "AGRESIVO";
  if(value==="Controlled")return "CONTROLADO";
  if(value==="Reactive")return "REACTIVO";
  if(value==="Anti-Strat")return "ANTI-STRAT";
  return "BALANCEADO";
}

function getStyleShortDescription(value:CoachTacticalStyle) {
  if(value==="Aggressive")return "Presión e iniciativa";
  if(value==="Controlled")return "Disciplina y control";
  if(value==="Reactive")return "Lectura y adaptación";
  if(value==="Anti-Strat")return "Preparación específica";
  return "Juego equilibrado";
}

function getPaceLabel(value:CoachPace){return value==="Slow"?"LENTO":value==="Fast"?"RÁPIDO":"BALANCEADO";}
function getRiskLabel(value:CoachRisk){return value==="Low"?"BAJO":value==="High"?"ALTO":"MEDIO";}
function getAttackLabel(value:CoachAttackStyle){return value==="Defaults"?"DEFAULTS":value==="Executions"?"EXECUCIONES":value==="Map Control"?"CONTROL DE MAPA":"EXPLOSIVO";}
function getDefenseLabel(value:CoachDefenseStyle){return value==="Passive"?"PASIVA":value==="Aggressive"?"AGRESIVA":value==="Retake"?"RETAKE":"ESTÁNDAR";}
function getOperatorLabel(value:CoachOperatorUsage){return value==="Rare"?"OCASIONAL":value==="Priority"?"PRIORIDAD":"SITUACIONAL";}