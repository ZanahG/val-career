import {useMemo,useState} from "react";
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

  const roster=useMemo(
    ()=>[...career.team.roster].sort((a,b)=>Number(b.starter)-Number(a.starter)||b.overall-a.overall),
    [career.team.roster],
  );

  const [selectedPlayerId,setSelectedPlayerId]=useState<string|null>(roster[0]?.id??null);

  const selectedPlayer=roster.find(player=>player.id===selectedPlayerId)??roster[0]??null;

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
              <span>COACH CAREER</span>
              <strong>CENTRO DE PLANTILLA</strong>
              <small>{team?.name??"Equipo"} · {team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-roster__back" onClick={onBack}>← DASHBOARD</button>
        </header>

        <section className="coach-roster__navigation">
          <div>
            <span>PRIMER EQUIPO</span>
            <strong>PLANTILLA</strong>
          </div>

          <div className="coach-roster__nav-summary">
            <SummaryStat label="JUGADORES" value={roster.length}/>
            <SummaryStat label="TITULARES" value={starters}/>
            <SummaryStat label="OVR MEDIO" value={averageOverall}/>
            <SummaryStat label="MEJOR OVR" value={highestOverall}/>
          </div>
        </section>

        <div className="coach-roster__layout">
          <section className="coach-roster__list-panel">
            <header className="coach-roster__list-head">
              <div>
                <span>ROSTER ACTUAL</span>
                <strong>{roster.length} JUGADORES</strong>
              </div>

              <div>
                <span>NÓMINA</span>
                <strong>${payroll.toLocaleString("en-US")}</strong>
              </div>
            </header>

            <div className="coach-roster__table-head">
              <span>ESTADO</span>
              <span>NOMBRE</span>
              <span>ROL</span>
              <span>OVR</span>
              <span>EDAD</span>
              <span>CONTRATO</span>
            </div>

            <div className="coach-roster__players">
              {roster.map(player=>(
                <PlayerRow
                  key={player.id}
                  player={player}
                  selected={selectedPlayer?.id===player.id}
                  onClick={()=>setSelectedPlayerId(player.id)}
                />
              ))}
            </div>
          </section>

          <aside className="coach-roster__detail-panel">
            {selectedPlayer?(
              <PlayerDetail player={selectedPlayer}/>
            ):(
              <div className="coach-roster__empty">
                <strong>SIN JUGADORES</strong>
                <span>No hay jugadores registrados en la plantilla.</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function PlayerRow({player,selected,onClick}:{player:CoachPlayer;selected:boolean;onClick:()=>void}) {
  return (
    <button className={`coach-roster__player-row${selected?" coach-roster__player-row--selected":""}`} onClick={onClick}>
      <div className="coach-roster__status">
        <span className={player.starter?"coach-roster__status-dot coach-roster__status-dot--starter":"coach-roster__status-dot"}/>
        <small>{player.starter?"XI":"SUB"}</small>
      </div>

      <div className="coach-roster__player-name">
        <div className="coach-roster__avatar">{player.ign.slice(0,1).toUpperCase()}</div>

        <div>
          <strong>{player.ign}</strong>
          <small>${player.salary.toLocaleString("en-US")} / MES</small>
        </div>
      </div>

      <span>{getRoleLabel(player.role)}</span>
      <strong className={getOverallClass(player.overall)}>{player.overall}</strong>
      <span>{player.age}</span>
      <span>{formatContract(player)}</span>
    </button>
  );
}

function PlayerDetail({player}:{player:CoachPlayer}) {
  const averageStats=Math.round(
    (
      player.stats.aim+
      player.stats.gameSense+
      player.stats.communication+
      player.stats.clutch+
      player.stats.consistency+
      player.stats.mental
    )/6,
  );

  return (
    <>
      <header className="coach-roster__detail-head">
        <div className="coach-roster__detail-player">
          <div className="coach-roster__detail-avatar">{player.ign.slice(0,1).toUpperCase()}</div>

          <div>
            <span>{getRoleLabel(player.role)}</span>
            <h2>{player.ign}</h2>
            <small>{player.starter?"TITULAR":"SUPLENTE"} · {player.age} AÑOS</small>
          </div>
        </div>

        <div className="coach-roster__detail-overall">
          <strong className={getOverallClass(player.overall)}>{player.overall}</strong>
          <span>OVR</span>
        </div>
      </header>

      <section className="coach-roster__profile-grid">
        <ProfileItem label="POTENCIAL" value={String(player.potential)}/>
        <ProfileItem label="EDAD" value={String(player.age)}/>
        <ProfileItem label="ROL" value={getRoleLabel(player.role)}/>
        <ProfileItem label="CONTRATO" value={formatContract(player)}/>
      </section>

      <section className="coach-roster__radar-section">
        <header>
          <div>
            <span>PLAYER PROFILE</span>
            <strong>ATRIBUTOS</strong>
          </div>

          <div>
            <span>MEDIA</span>
            <strong>{averageStats}</strong>
          </div>
        </header>

        <PlayerRadar player={player}/>
      </section>

      <section className="coach-roster__attribute-list">
        <Attribute label="AIM" value={player.stats.aim}/>
        <Attribute label="GAME SENSE" value={player.stats.gameSense}/>
        <Attribute label="COMMUNICATION" value={player.stats.communication}/>
        <Attribute label="CLUTCH" value={player.stats.clutch}/>
        <Attribute label="CONSISTENCY" value={player.stats.consistency}/>
        <Attribute label="MENTAL" value={player.stats.mental}/>
      </section>

      <section className="coach-roster__financial">
        <span>CONTRATO Y VALOR</span>

        <div>
          <ProfileItem label="SUELDO MENSUAL" value={`$${player.salary.toLocaleString("en-US")}`}/>
          <ProfileItem label="VALOR MERCADO" value={`$${player.marketValue.toLocaleString("en-US")}`}/>
        </div>
      </section>
    </>
  );
}

function PlayerRadar({player}:{player:CoachPlayer}) {
  const stats=[
    {label:"AIM",value:player.stats.aim},
    {label:"GAME",value:player.stats.gameSense},
    {label:"COMMS",value:player.stats.communication},
    {label:"CLUTCH",value:player.stats.clutch},
    {label:"CONS.",value:player.stats.consistency},
    {label:"MENTAL",value:player.stats.mental},
  ];

  const center=150;
  const radius=105;

  const gridLevels=[25,50,75,100];

  const points=stats.map((stat,index)=>{
    const angle=-Math.PI/2+(Math.PI*2*index)/stats.length;
    const distance=radius*(stat.value/100);

    return `${center+Math.cos(angle)*distance},${center+Math.sin(angle)*distance}`;
  }).join(" ");

  return (
    <div className="coach-roster__radar">
      <svg viewBox="0 0 300 300">
        {gridLevels.map(level=>(
          <polygon key={level} className="coach-roster__radar-grid" points={getRadarPolygon(stats.length,center,radius*(level/100))}/>
        ))}

        {stats.map((_,index)=>{
          const angle=-Math.PI/2+(Math.PI*2*index)/stats.length;
          const x=center+Math.cos(angle)*radius;
          const y=center+Math.sin(angle)*radius;

          return <line key={index} className="coach-roster__radar-axis" x1={center} y1={center} x2={x} y2={y}/>;
        })}

        <polygon className="coach-roster__radar-value" points={points}/>

        {stats.map((stat,index)=>{
          const angle=-Math.PI/2+(Math.PI*2*index)/stats.length;
          const labelRadius=radius+27;
          const x=center+Math.cos(angle)*labelRadius;
          const y=center+Math.sin(angle)*labelRadius;

          return (
            <g key={stat.label}>
              <text className="coach-roster__radar-label" x={x} y={y-2} textAnchor="middle">{stat.label}</text>
              <text className="coach-roster__radar-number" x={x} y={y+12} textAnchor="middle">{stat.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Attribute({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-roster__attribute">
      <div>
        <span>{label}</span>
        <strong className={getStatClass(value)}>{value}</strong>
      </div>

      <div className="coach-roster__attribute-bar">
        <span style={{width:`${value}%`}}/>
      </div>
    </div>
  );
}

function ProfileItem({label,value}:{label:string;value:string}) {
  return (
    <div className="coach-roster__profile-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function getRadarPolygon(count:number,center:number,radius:number) {
  return Array.from({length:count},(_,index)=>{
    const angle=-Math.PI/2+(Math.PI*2*index)/count;
    return `${center+Math.cos(angle)*radius},${center+Math.sin(angle)*radius}`;
  }).join(" ");
}

function formatContract(player:CoachPlayer) {
  const years=player.contractSeasonsRemaining??0;
  if(years<=0)return "EXPIRA";
  return `${years} ${years===1?"AÑO":"AÑOS"}`;
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
  if(overall>=90)return "coach-roster__value coach-roster__value--elite";
  if(overall>=85)return "coach-roster__value coach-roster__value--star";
  if(overall>=80)return "coach-roster__value coach-roster__value--good";
  return "coach-roster__value";
}

function getStatClass(value:number) {
  if(value>=90)return "coach-roster__stat coach-roster__stat--elite";
  if(value>=85)return "coach-roster__stat coach-roster__stat--high";
  if(value<70)return "coach-roster__stat coach-roster__stat--low";
  return "coach-roster__stat";
}