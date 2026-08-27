import type {CoachCareerState,CoachTacticalStyle} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getNextCoachOpponent} from "../../logic/coachVCTSeason";
import {useGameSettings} from "../../context/GameSettingsContext";
import {formatCurrency} from "../../utils/currency";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {getTeamLogo} from "../../utils/teamLogo";
import rosterIcon from "../../images/icons/roster.png";
import marketIcon from "../../images/icons/market.png";
import tacticsIcon from "../../images/icons/tactics.png";
import mapPoolIcon from "../../images/icons/map-pool.png";
import seasonIcon from "../../images/icons/season.png";
import "../../styles/CoachDashboard.css";

interface CoachDashboardProps {
  career:CoachCareerState;
  onChangeTacticalStyle:(style:CoachTacticalStyle)=>void;
  onOpenCoachProfile:()=>void;
  onOpenRoster:()=>void;
  onOpenMarket:()=>void;
  onOpenTactics:()=>void;
  onOpenSeason:()=>void;
  onOpenMapPool:()=>void;
  onExit:()=>void;
}

const TACTICAL_STYLES:CoachTacticalStyle[]=["Balanced","Aggressive","Controlled","Reactive","Anti-Strat"];

export function CoachDashboard({career,onChangeTacticalStyle,onOpenCoachProfile,onOpenRoster,onOpenMarket,onOpenTactics,onOpenMapPool,onOpenSeason,onExit}:CoachDashboardProps) {
  const {language,currency}=useGameSettings();
  const es=language==="es";

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
            <div className="coach-dashboard__club-mark">{logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TCV"}</span>}</div>
            <div>
              <span>COACH CAREER</span>
              <strong>{team?.name??(es?"Sin equipo":"No team")}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <div className="coach-dashboard__topbar-actions">
            <GameSettingsControls/>
            <div className="coach-dashboard__season-pill"><span>{es?"TEMPORADA":"SEASON"}</span><strong>{career.coach.season}</strong></div>
            <button className="coach-dashboard__exit" onClick={onExit}>{es?"SALIR":"EXIT"}</button>
          </div>
        </header>

        <section className="coach-dashboard__hero">
          <button className="coach-dashboard__hero-main coach-card coach-card--interactive coach-dashboard__coach-button" onClick={onOpenCoachProfile}>
            <div className="coach-dashboard__coach-profile">
              <span className="coach-dashboard__eyebrow">HEAD COACH</span>
              <h1>{career.coach.name}</h1>

              <div className="coach-dashboard__coach-meta">
                <div>
                  <span>{es?"REPUTACIÓN":"REPUTATION"}</span>
                  <strong>{career.coach.reputation}</strong>
                </div>

                <div>
                  <span>{es?"CONFIANZA":"CONFIDENCE"}</span>
                  <strong>{career.board.confidence}</strong>
                </div>

                <div className={`coach-dashboard__job-status coach-dashboard__job-status--${career.board.jobSecurity.toLowerCase().replace(/\s+/g,"-")}`}>
                  <span>{es?"ESTADO":"STATUS"}</span>
                  <strong>{getJobSecurityLabel(career.board.jobSecurity,language)}</strong>
                </div>
              </div>

              <div className="coach-dashboard__coach-confidence">
                <div className="coach-dashboard__coach-confidence-track">
                  <div
                    className={`coach-dashboard__coach-confidence-fill coach-dashboard__coach-confidence-fill--${getConfidenceLevel(career.board.confidence)}`}
                    style={{width:`${career.board.confidence}%`}}
                  />
                </div>
              </div>
            </div>

            <b className="coach-dashboard__coach-arrow">→</b>
          </button>

          <button className={`coach-dashboard__season-card coach-card coach-card--interactive${seasonComplete?" coach-dashboard__season-card--complete":""}`} onClick={onOpenSeason}>
            <div className="coach-dashboard__season-card-head">
              <div>
                <span>{getSeasonCardEyebrow(seasonStarted,seasonComplete,language)}</span>
                <strong>{getSeasonCardTitle(seasonStarted,seasonComplete,language)}</strong>
              </div>
              <b>→</b>
            </div>

            {!seasonStarted&&(
              <div className="coach-dashboard__season-empty">
                <span>VCT {career.coach.circuit}</span>
                <strong>{career.coach.season}</strong>
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
                <span>{getCurrentCompetition(career,language)}</span>
                <strong>{annualRecord.wins}-{annualRecord.losses}</strong>
                <small>{es?"Temporada en curso":"Season in progress"}</small>
              </div>
            )}

            {seasonComplete&&(
              <div className="coach-dashboard__season-summary">
                <div><span>{es?"RÉCORD":"RECORD"}</span><strong>{annualRecord.wins}-{annualRecord.losses}</strong></div>
                <div><span>CHAMP. POINTS</span><strong>{championshipPoints}</strong></div>
                <div><span>{es?"TROFEOS":"TROPHIES"}</span><strong>{trophiesThisSeason.length}</strong></div>
              </div>
            )}
          </button>
        </section>

        <section className="coach-dashboard__menu">
          <MenuTile index="01" title={es?"PLANTILLA":"ROSTER"} description={es?"Jugadores, roles y estado del equipo.":"Players, roles and team status."} onClick={onOpenRoster} iconSrc={rosterIcon} iconAlt={es?"Plantilla":"Roster"}/>
          <MenuTile index="02" title={es?"MERCADO":"MARKET"} description={es?"Fichajes, scouting y oportunidades.":"Transfers, scouting and opportunities."} onClick={onOpenMarket} iconSrc={marketIcon} iconAlt={es?"Mercado":"Market"}/>
          <MenuTile index="03" title={es?"GESTIÓN TÁCTICA":"TACTICAL MANAGEMENT"} description={es?"Plan de juego e identidad del equipo.":"Game plan and team identity."} onClick={onOpenTactics} iconSrc={tacticsIcon} iconAlt={es?"Gestión táctica":"Tactical management"}/>
          <MenuTile index="04" title="MAP POOL" description={es?"Fortalezas y debilidades por mapa.":"Strengths and weaknesses on each map."} onClick={onOpenMapPool} iconSrc={mapPoolIcon} iconAlt="Map Pool"/>
          <MenuTile index="05" title={seasonComplete?(es?"RESUMEN TEMPORADA":"SEASON SUMMARY"):(es?"TEMPORADA":"SEASON")} description={seasonComplete?(es?"Resultados, trofeos y cierre del año competitivo.":"Results, trophies and competitive year summary."):(es?"Calendario, clasificación y partidos.":"Schedule, standings and matches.")} onClick={onOpenSeason} iconSrc={seasonIcon} iconAlt={es?"Temporada":"Season"} active={seasonComplete}/>
        </section>

        <div className="coach-dashboard__lower-grid">
          <section className="coach-dashboard__finance-card coach-card">
            <header className="coach-dashboard__section-head">
              <div><span>{es?"FINANZAS":"FINANCES"}</span><strong>{es?"GESTIÓN DEL CLUB":"CLUB MANAGEMENT"}</strong></div>
              <span>{payrollUsage}% {es?"NÓMINA":"PAYROLL"}</span>
            </header>

            <div className="coach-dashboard__finance-main">
              <div><span>{es?"DISPONIBLE MENSUAL":"MONTHLY AVAILABLE"}</span><strong>{formatCurrency(availableBudget,currency)}</strong><small>{currency}</small></div>
              <div className="coach-dashboard__finance-progress"><div style={{width:`${payrollUsage}%`}}/></div>
            </div>

            <div className="coach-dashboard__finance-grid">
              <FinanceItem label={es?"PRESUPUESTO":"BUDGET"} value={formatCurrency(finances.monthlyBudget,currency)}/>
              <FinanceItem label={es?"NÓMINA":"PAYROLL"} value={formatCurrency(finances.currentMonthlyPayroll,currency)}/>
              <FinanceItem label={es?"FICHAJES":"TRANSFERS"} value={formatCurrency(finances.transferBudget,currency)}/>
            </div>
          </section>

          <section className="coach-dashboard__identity-card coach-card">
            <header className="coach-dashboard__section-head">
              <div><span>{es?"IDENTIDAD TÁCTICA":"TACTICAL IDENTITY"}</span><strong>{es?"ESTILO DE JUEGO":"PLAYSTYLE"}</strong></div>
            </header>

            <div className="coach-dashboard__identity-current">
              <strong>{getTacticalStyleLabel(career.team.tacticalStyle,language)}</strong>
              <p>{getTacticalStyleDescription(career.team.tacticalStyle,language)}</p>
            </div>

            <div className="coach-dashboard__style-selector">
              {TACTICAL_STYLES.map(style=>(
                <button key={style} className={career.team.tacticalStyle===style?"active":""} onClick={()=>onChangeTacticalStyle(style)}>{getTacticalStyleLabel(style,language)}</button>
              ))}
            </div>

            <button className="coach-dashboard__tactics-link" onClick={onOpenTactics}>{es?"CONFIGURAR TÁCTICAS":"CONFIGURE TACTICS"} <span>→</span></button>
          </section>
        </div>
      </div>
    </main>
  );
}

function MenuTile({index,title,description,onClick,iconSrc,iconAlt,active=false}:{index:string;title:string;description:string;onClick:()=>void;iconSrc:string;iconAlt:string;active?:boolean}) {
  return (
    <button className={`coach-dashboard__menu-tile coach-card coach-card--interactive${active?" coach-dashboard__menu-tile--active":""}`} onClick={onClick}>
      <div className="coach-dashboard__menu-icon"><img src={iconSrc} alt={iconAlt}/></div>
      <span>{index}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <b>→</b>
    </button>
  );
}

function DashboardStat({label,value}:{label:string;value:number}) {
  return <div className="coach-dashboard__hero-stat"><span>{label}</span><strong>{value}</strong></div>;
}

function FinanceItem({label,value}:{label:string;value:string}) {
  return <div className="coach-dashboard__finance-item"><span>{label}</span><strong>{value}</strong></div>;
}

function getSeasonCardEyebrow(seasonStarted:boolean,seasonComplete:boolean,language:"es"|"en") {
  if(!seasonStarted)return language==="es"?"PRÓXIMO PASO":"NEXT STEP";
  if(seasonComplete)return language==="es"?"TEMPORADA FINALIZADA":"SEASON COMPLETE";
  return language==="es"?"CENTRO DE TEMPORADA":"SEASON HUB";
}

function getSeasonCardTitle(seasonStarted:boolean,seasonComplete:boolean,language:"es"|"en") {
  if(!seasonStarted)return language==="es"?"COMENZAR TEMPORADA":"START SEASON";
  if(seasonComplete)return language==="es"?"VER RESUMEN":"VIEW SUMMARY";
  return language==="es"?"TEMPORADA":"SEASON";
}

function getAnnualRecord(career:CoachCareerState) {
  if(!career.seasonState)return {wins:0,losses:0};
  const matches=Object.values(career.seasonState.events).flatMap(event=>event.matches);
  return {wins:matches.filter(match=>match.won).length,losses:matches.filter(match=>!match.won).length};
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

function getCurrentCompetition(career:CoachCareerState,language:"es"|"en") {
  const phase=career.seasonState?.phase;

  if(!phase)return `VCT ${career.coach.circuit}`;
  if(phase==="Stage 1 Playoffs")return "STAGE 1 PLAYOFFS";
  if(phase==="Stage 2 Playoffs")return "STAGE 2 PLAYOFFS";
  if(phase==="Complete")return language==="es"?"TEMPORADA COMPLETA":"SEASON COMPLETE";

  return phase.toUpperCase();
}

function getTacticalStyleLabel(style:CoachTacticalStyle,language:"es"|"en") {
  if(language==="en")return style.toUpperCase();

  if(style==="Balanced")return "BALANCEADO";
  if(style==="Aggressive")return "AGRESIVO";
  if(style==="Controlled")return "CONTROLADO";
  if(style==="Reactive")return "REACTIVO";
  return "ANTI-STRAT";
}

function getTacticalStyleDescription(style:CoachTacticalStyle,language:"es"|"en") {
  if(language==="en"){
    if(style==="Aggressive")return "Looks to take the initiative, force duels and play rounds with high pressure.";
    if(style==="Controlled")return "Prioritizes map control, discipline and structured rounds.";
    if(style==="Reactive")return "Adapts to available information and punishes opponent mistakes.";
    if(style==="Anti-Strat")return "Prepares specifically to neutralize the opponent.";
    return "A balance between initiative, structure and adaptation.";
  }

  if(style==="Aggressive")return "Busca tomar la iniciativa, forzar duelos y jugar rondas con presión alta.";
  if(style==="Controlled")return "Prioriza control de mapa, disciplina y rondas estructuradas.";
  if(style==="Reactive")return "Se adapta según la información y castiga errores del rival.";
  if(style==="Anti-Strat")return "Prepara el partido específicamente para neutralizar al oponente.";
  return "Equilibrio entre iniciativa, estructura y adaptación.";
}
function getJobSecurityLabel(status:CoachCareerState["board"]["jobSecurity"],language:"es"|"en") {
  if(language==="en")return status.toUpperCase();

  if(status==="Secure")return "SEGURO";
  if(status==="Stable")return "ESTABLE";
  if(status==="Under Pressure")return "BAJO PRESIÓN";

  return "CRÍTICO";
}

function getConfidenceLevel(confidence:number) {
  if(confidence>=75)return "secure";
  if(confidence>=50)return "stable";
  if(confidence>=25)return "pressure";

  return "critical";
}