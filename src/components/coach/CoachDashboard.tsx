import type {CoachCareerState,CoachTacticalStyle} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getNextCoachOpponent} from "../../logic/coachVCTSeason";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachDashboard.css";

interface CoachDashboardProps {
  career:CoachCareerState;
  onChangeTacticalStyle:(style:CoachTacticalStyle)=>void;
  onOpenRoster:()=>void;
  onOpenMarket:()=>void;
  onOpenTactics:()=>void;
  onOpenSeason:()=>void;
  onOpenMapPool:()=>void;
  onExit:()=>void;
}

const TACTICAL_STYLES:CoachTacticalStyle[]=["Balanced","Aggressive","Controlled","Reactive","Anti-Strat"];

export function CoachDashboard({career,onChangeTacticalStyle,onOpenRoster,onOpenMarket,onOpenTactics,onOpenMapPool,onOpenSeason,onExit}:CoachDashboardProps) {
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);
  const opponent=getNextCoachOpponent(career);
  const opponentLogo=getTeamLogo(opponent?.logo);

  const finances=career.team.finances;
  const availableBudget=Math.max(0,finances.monthlyBudget-finances.currentMonthlyPayroll);
  const payrollUsage=finances.monthlyBudget>0?Math.min(100,Math.round(finances.currentMonthlyPayroll/finances.monthlyBudget*100)):0;

  const seasonStarted=Boolean(career.seasonState);
  const seasonComplete=career.seasonState?.phase==="Complete";
  const seasonInProgress=seasonStarted&&!seasonComplete;

  const annualRecord=getAnnualRecord(career);
  const championshipPoints=career.seasonState?.championshipPointsByTeam[career.team.teamId]??0;
  const trophiesThisSeason=getCurrentSeasonTrophies(career);

  return (
    <main className="coach-dashboard">
      <div className="coach-dashboard__bg"/>
      <div className="coach-dashboard__overlay"/>

      <div className="coach-dashboard__shell">
        <header className="coach-dashboard__topbar">
          <div className="coach-dashboard__club-header">
            <div className="coach-dashboard__club-mark">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TCV"}</span>}
            </div>

            <div>
              <span>COACH CAREER</span>
              <strong>{team?.name??"Sin equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <div className="coach-dashboard__topbar-actions">
            <div className="coach-dashboard__season-pill">
              <span>TEMPORADA</span>
              <strong>{career.coach.season}</strong>
            </div>

            <button className="coach-dashboard__exit" onClick={onExit}>SALIR</button>
          </div>
        </header>

        <section className="coach-dashboard__hero">
          <div className="coach-dashboard__hero-main coach-card">
            <div className="coach-dashboard__coach-profile">
              <span className="coach-dashboard__eyebrow">HEAD COACH</span>
              <h1>{career.coach.name}</h1>
              <p>{career.coach.nationality} · {career.coach.age} años</p>
            </div>

            <div className="coach-dashboard__hero-meta">
              <DashboardStat label="REPUTACIÓN" value={career.coach.reputation}/>
              <DashboardStat label="QUÍMICA" value={career.team.chemistry}/>
              <DashboardStat label="FORMA" value={career.team.form}/>
            </div>
          </div>

          <button className={`coach-dashboard__season-card coach-card coach-card--interactive${seasonComplete?" coach-dashboard__season-card--complete":""}`} onClick={onOpenSeason}>
            <div className="coach-dashboard__season-card-head">
              <div>
                <span>{getSeasonCardEyebrow(seasonStarted,seasonComplete)}</span>
                <strong>{getSeasonCardTitle(seasonStarted,seasonComplete)}</strong>
              </div>

              <b>→</b>
            </div>

            {!seasonStarted&&(
              <div className="coach-dashboard__season-empty">
                <span>VCT {career.coach.circuit}</span>
                <strong>{career.coach.season}</strong>
                <small>Kickoff · Masters · Stages · Champions</small>
              </div>
            )}

            {seasonInProgress&&opponent&&(
              <div className="coach-dashboard__next-match">
                <div className="coach-dashboard__next-team">
                  <div>{logo&&<img src={logo} alt={team?.name??""}/>}</div>
                  <strong>{team?.shortName??team?.name}</strong>
                </div>

                <span>VS</span>

                <div className="coach-dashboard__next-team">
                  <div>{opponentLogo&&<img src={opponentLogo} alt={opponent.name}/>}</div>
                  <strong>{opponent.shortName??opponent.name}</strong>
                </div>
              </div>
            )}

            {seasonInProgress&&!opponent&&(
              <div className="coach-dashboard__season-empty">
                <span>{getCurrentCompetition(career)}</span>
                <strong>{annualRecord.wins}-{annualRecord.losses}</strong>
                <small>Temporada en curso</small>
              </div>
            )}

            {seasonComplete&&(
              <div className="coach-dashboard__season-summary">
                <div>
                  <span>RÉCORD</span>
                  <strong>{annualRecord.wins}-{annualRecord.losses}</strong>
                </div>

                <div>
                  <span>CHAMP. POINTS</span>
                  <strong>{championshipPoints}</strong>
                </div>

                <div>
                  <span>TROFEOS</span>
                  <strong>{trophiesThisSeason.length}</strong>
                </div>
              </div>
            )}
          </button>
        </section>

        <section className="coach-dashboard__menu">
          <MenuTile index="01" title="PLANTILLA" description="Jugadores, roles y estado del equipo." onClick={onOpenRoster} icon="◎"/>
          <MenuTile index="02" title="MERCADO" description="Fichajes, scouting y oportunidades." onClick={onOpenMarket} icon="↗"/>
          <MenuTile index="03" title="GESTIÓN TÁCTICA" description="Plan de juego e identidad del equipo." onClick={onOpenTactics} icon="⌁"/>
          <MenuTile index="04" title="MAP POOL" description="Fortalezas y debilidades por mapa." onClick={onOpenMapPool} icon="◇"/>
          <MenuTile
            index="05"
            title={seasonComplete?"RESUMEN TEMPORADA":"TEMPORADA"}
            description={seasonComplete?"Resultados, trofeos y cierre del año competitivo.":"Calendario, clasificación y partidos."}
            onClick={onOpenSeason}
            icon="▦"
            active={seasonComplete}
          />
        </section>

        <div className="coach-dashboard__lower-grid">
          <section className="coach-dashboard__finance-card coach-card">
            <header className="coach-dashboard__section-head">
              <div>
                <span>FINANZAS</span>
                <strong>GESTIÓN DEL CLUB</strong>
              </div>

              <span>{payrollUsage}% NÓMINA</span>
            </header>

            <div className="coach-dashboard__finance-main">
              <div>
                <span>DISPONIBLE MENSUAL</span>
                <strong>${availableBudget.toLocaleString("en-US")}</strong>
                <small>USD</small>
              </div>

              <div className="coach-dashboard__finance-progress">
                <div style={{width:`${payrollUsage}%`}}/>
              </div>
            </div>

            <div className="coach-dashboard__finance-grid">
              <FinanceItem label="PRESUPUESTO" value={`$${finances.monthlyBudget.toLocaleString("en-US")}`}/>
              <FinanceItem label="NÓMINA" value={`$${finances.currentMonthlyPayroll.toLocaleString("en-US")}`}/>
              <FinanceItem label="FICHAJES" value={`$${finances.transferBudget.toLocaleString("en-US")}`}/>
            </div>
          </section>

          <section className="coach-dashboard__identity-card coach-card">
            <header className="coach-dashboard__section-head">
              <div>
                <span>IDENTIDAD TÁCTICA</span>
                <strong>ESTILO DE JUEGO</strong>
              </div>
            </header>

            <div className="coach-dashboard__identity-current">
              <span>ESTILO ACTUAL</span>
              <strong>{getTacticalStyleLabel(career.team.tacticalStyle)}</strong>
              <p>{getTacticalStyleDescription(career.team.tacticalStyle)}</p>
            </div>

            <div className="coach-dashboard__style-selector">
              {TACTICAL_STYLES.map(style=>(
                <button key={style} className={career.team.tacticalStyle===style?"active":""} onClick={()=>onChangeTacticalStyle(style)}>
                  {getTacticalStyleLabel(style)}
                </button>
              ))}
            </div>

            <button className="coach-dashboard__tactics-link" onClick={onOpenTactics}>CONFIGURAR TÁCTICAS <span>→</span></button>
          </section>
        </div>
      </div>
    </main>
  );
}

function MenuTile({index,title,description,onClick,icon,active=false}:{index:string;title:string;description:string;onClick:()=>void;icon:string;active?:boolean}) {
  return (
    <button className={`coach-dashboard__menu-tile coach-card coach-card--interactive${active?" coach-dashboard__menu-tile--active":""}`} onClick={onClick}>
      <div className="coach-dashboard__menu-icon">{icon}</div>
      <span>{index}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <b>→</b>
    </button>
  );
}

function DashboardStat({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-dashboard__hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FinanceItem({label,value}:{label:string;value:string}) {
  return (
    <div className="coach-dashboard__finance-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getSeasonCardEyebrow(seasonStarted:boolean,seasonComplete:boolean) {
  if(!seasonStarted)return "PRÓXIMO PASO";
  if(seasonComplete)return "TEMPORADA FINALIZADA";
  return "CENTRO DE TEMPORADA";
}

function getSeasonCardTitle(seasonStarted:boolean,seasonComplete:boolean) {
  if(!seasonStarted)return "COMENZAR TEMPORADA";
  if(seasonComplete)return "VER RESUMEN";
  return "TEMPORADA";
}

function getAnnualRecord(career:CoachCareerState) {
  if(!career.seasonState)return {wins:0,losses:0};

  const matches=Object.values(career.seasonState.events).flatMap(event=>event.matches);

  return {
    wins:matches.filter(match=>match.won).length,
    losses:matches.filter(match=>!match.won).length,
  };
}

function getCurrentSeasonTrophies(career:CoachCareerState) {
  const season=career.seasonState;
  if(!season)return [];

  const trophies:string[]=[];

  if(season.events.Kickoff.placement===1)trophies.push(`VCT ${season.circuit} Kickoff`);
  if(season.events["Masters 1"].placement===1)trophies.push("Masters 1");
  if(season.events["Stage 1 Playoffs"].placement===1)trophies.push(`VCT ${season.circuit} Stage 1`);
  if(season.events["Masters 2"].placement===1)trophies.push("Masters 2");
  if(season.events["Stage 2 Playoffs"].placement===1)trophies.push(`VCT ${season.circuit} Stage 2`);
  if(season.events.Champions.placement===1)trophies.push("Valorant Champions");

  return trophies;
}

function getCurrentCompetition(career:CoachCareerState) {
  const phase=career.seasonState?.phase;

  if(!phase)return `VCT ${career.coach.circuit}`;
  if(phase==="Stage 1 Playoffs")return "STAGE 1 PLAYOFFS";
  if(phase==="Stage 2 Playoffs")return "STAGE 2 PLAYOFFS";
  if(phase==="Complete")return "TEMPORADA COMPLETA";

  return phase.toUpperCase();
}

function getTacticalStyleLabel(style:CoachTacticalStyle) {
  if(style==="Balanced")return "BALANCEADO";
  if(style==="Aggressive")return "AGRESIVO";
  if(style==="Controlled")return "CONTROLADO";
  if(style==="Reactive")return "REACTIVO";
  return "ANTI-STRAT";
}

function getTacticalStyleDescription(style:CoachTacticalStyle) {
  if(style==="Aggressive")return "Busca tomar la iniciativa, forzar duelos y jugar rondas con presión alta.";
  if(style==="Controlled")return "Prioriza control de mapa, disciplina y rondas estructuradas.";
  if(style==="Reactive")return "Se adapta según la información y castiga errores del rival.";
  if(style==="Anti-Strat")return "Prepara el partido específicamente para neutralizar al oponente.";
  return "Equilibrio entre iniciativa, estructura y adaptación.";
}