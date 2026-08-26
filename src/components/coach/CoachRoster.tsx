import type {CoachCareerState,CoachPlayer} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachRoster.css";

interface CoachRosterProps {
  career:CoachCareerState;
  onBack:()=>void;
}

export function CoachRoster({career,onBack}:CoachRosterProps) {
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);
  const roster=[...career.team.roster].sort((a,b)=>Number(b.starter)-Number(a.starter)||b.overall-a.overall);
  const payroll=roster.reduce((total,player)=>total+player.salary,0);
  const averageOverall=roster.length?Math.round(roster.reduce((total,player)=>total+player.overall,0)/roster.length):0;
  const starters=roster.filter(player=>player.starter).length;
  const highestOverall=roster.length?Math.max(...roster.map(player=>player.overall)):0;

  return (
    <main className="coach-roster">
      <div className="coach-roster__bg"/>
      <div className="coach-roster__overlay"/>

      <div className="coach-roster__shell">
        <header className="coach-roster__topbar">
          <div className="coach-roster__club">
            <div className="coach-roster__club-logo">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>GESTIÓN DE PLANTILLA</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-roster__back" onClick={onBack}>← DASHBOARD</button>
        </header>

        <section className="coach-roster__hero">
          <div>
            <span className="coach-roster__eyebrow">PRIMER EQUIPO</span>
            <h1>PLANTILLA</h1>
            <p>Evalúa el nivel del roster, roles, estado competitivo y coste mensual de cada jugador.</p>
          </div>

          <div className="coach-roster__summary">
            <SummaryStat label="JUGADORES" value={roster.length}/>
            <SummaryStat label="TITULARES" value={starters}/>
            <SummaryStat label="MEDIA" value={averageOverall}/>
            <SummaryStat label="MEJOR OVR" value={highestOverall}/>
            <div className="coach-roster__summary-finance">
              <span>NÓMINA MENSUAL</span>
              <strong>${payroll.toLocaleString("en-US")}</strong>
              <small>USD</small>
            </div>
          </div>
        </section>

        <section className="coach-roster__squad">
          <header className="coach-roster__section-header">
            <div>
              <span>ROSTER ACTUAL</span>
              <strong>{starters} TITULARES · {Math.max(0,roster.length-starters)} SUPLENTES</strong>
            </div>

            <span>OVR MEDIO {averageOverall}</span>
          </header>

          <div className="coach-roster__table">
            <div className="coach-roster__row coach-roster__row--header">
              <span>JUGADOR</span>
              <span>ROL</span>
              <span>OVR</span>
              <span>AIM</span>
              <span>GAME SENSE</span>
              <span>COMMS</span>
              <span>CLUTCH</span>
              <span>CONS.</span>
              <span>MENTAL</span>
              <span>SUELDO</span>
            </div>

            {roster.map(player=><PlayerRow key={player.id} player={player}/>)}
          </div>
        </section>
      </div>
    </main>
  );
}

function PlayerRow({player}:{player:CoachPlayer}) {
  return (
    <article className={`coach-roster__row${player.starter?" coach-roster__row--starter":""}`}>
      <div className="coach-roster__player">
        <div className="coach-roster__avatar">{player.ign.slice(0,1).toUpperCase()}</div>

        <div className="coach-roster__player-info">
          <div>
            <strong>{player.ign}</strong>
            {player.starter&&<span>TITULAR</span>}
          </div>

          <small>{player.age} AÑOS</small>
        </div>
      </div>

      <span className="coach-roster__role">{getRoleLabel(player.role)}</span>

      <strong className={`coach-roster__overall ${getOverallClass(player.overall)}`}>
        {player.overall}
      </strong>

      <StatValue value={player.stats.aim}/>
      <StatValue value={player.stats.gameSense}/>
      <StatValue value={player.stats.communication}/>
      <StatValue value={player.stats.clutch}/>
      <StatValue value={player.stats.consistency}/>
      <StatValue value={player.stats.mental}/>

      <strong className="coach-roster__salary">${player.salary.toLocaleString("en-US")}</strong>
    </article>
  );
}

function SummaryStat({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-roster__summary-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatValue({value}:{value:number}) {
  return <span className={getStatClass(value)}>{value}</span>;
}

function getRoleLabel(role:CoachPlayer["role"]) {
  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";
  if(role==="IGL")return "IGL";
  return "FLEX";
}

function getOverallClass(overall:number) {
  if(overall>=90)return "coach-roster__overall--elite";
  if(overall>=85)return "coach-roster__overall--star";
  if(overall>=80)return "coach-roster__overall--good";
  return "";
}

function getStatClass(value:number) {
  if(value>=90)return "coach-roster__stat coach-roster__stat--elite";
  if(value>=85)return "coach-roster__stat coach-roster__stat--high";
  if(value<70)return "coach-roster__stat coach-roster__stat--low";
  return "coach-roster__stat";
}