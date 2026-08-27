import {useMemo,useState} from "react";
import type {CoachCareerState,CoachPlayer} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {formatCurrency} from "../../utils/currency";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachRoster.css";

interface CoachRosterProps {
  career:CoachCareerState;
  onBack:()=>void;
}

export function CoachRoster({career,onBack}:CoachRosterProps) {
  const {language,currency}=useGameSettings();
  const es=language==="es";

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
              <strong>{es?"CENTRO DE PLANTILLA":"ROSTER HUB"}</strong>
              <small>{team?.name??(es?"Equipo":"Team")} · {team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <div className="coach-roster__topbar-actions">
            <GameSettingsControls/>
            <button className="coach-roster__back" onClick={onBack}>← {es?"MENÚ":"MENU"}</button>
          </div>
        </header>

        <section className="coach-roster__navigation">
          <div>
            <span>{es?"PRIMER EQUIPO":"FIRST TEAM"}</span>
            <strong>{es?"PLANTILLA":"ROSTER"}</strong>
          </div>

          <div className="coach-roster__nav-summary">
            <SummaryStat label={es?"JUGADORES":"PLAYERS"} value={roster.length}/>
            <SummaryStat label={es?"TITULARES":"STARTERS"} value={starters}/>
            <SummaryStat label={es?"OVR MEDIO":"AVG OVR"} value={averageOverall}/>
            <SummaryStat label={es?"MEJOR OVR":"BEST OVR"} value={highestOverall}/>
          </div>
        </section>

        <div className="coach-roster__layout">
          <section className="coach-roster__list-panel">
            <header className="coach-roster__list-head">
              <div>
                <span>{es?"ROSTER ACTUAL":"CURRENT ROSTER"}</span>
                <strong>{roster.length} {es?"JUGADORES":"PLAYERS"}</strong>
              </div>

              <div>
                <span>{es?"NÓMINA":"PAYROLL"}</span>
                <strong>{formatCurrency(payroll,currency)}</strong>
              </div>
            </header>

            <div className="coach-roster__table-head">
              <span>{es?"ESTADO":"STATUS"}</span>
              <span>{es?"NOMBRE":"NAME"}</span>
              <span>{es?"ROL":"ROLE"}</span>
              <span>OVR</span>
              <span>{es?"EDAD":"AGE"}</span>
              <span>{es?"CONTRATO":"CONTRACT"}</span>
            </div>

            <div className="coach-roster__players">
              {roster.map(player=>(
                <PlayerRow
                  key={player.id}
                  player={player}
                  selected={selectedPlayer?.id===player.id}
                  language={language}
                  currency={currency}
                  onClick={()=>setSelectedPlayerId(player.id)}
                />
              ))}
            </div>
          </section>

          <aside className="coach-roster__detail-panel">
            {selectedPlayer?(
              <PlayerDetail player={selectedPlayer} language={language} currency={currency}/>
            ):(
              <div className="coach-roster__empty">
                <strong>{es?"SIN JUGADORES":"NO PLAYERS"}</strong>
                <span>{es?"No hay jugadores registrados en la plantilla.":"There are no players registered in the roster."}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function PlayerRow({player,selected,language,currency,onClick}:{
  player:CoachPlayer;
  selected:boolean;
  language:"es"|"en";
  currency:Parameters<typeof formatCurrency>[1];
  onClick:()=>void;
}) {
  const es=language==="es";

  return (
    <button className={`coach-roster__player-row${selected?" coach-roster__player-row--selected":""}`} onClick={onClick}>
      <div className="coach-roster__status">
        <span className={player.starter?"coach-roster__status-dot coach-roster__status-dot--starter":"coach-roster__status-dot"}/>
      </div>

      <div className="coach-roster__player-name">
        <div className="coach-roster__avatar">{player.ign.slice(0,1).toUpperCase()}</div>

        <div>
          <strong>{player.ign}</strong>
          <small>{formatCurrency(player.salary,currency)} / {es?"MES":"MONTH"}</small>
        </div>
      </div>

      <span>{getRoleLabel(player.role,language)}{player.isIGL?" · IGL":""}</span>
      <strong className={getOverallClass(player.overall)}>{player.overall}</strong>
      <span>{player.age}</span>
      <span>{formatContract(player,language)}</span>
    </button>
  );
}

function PlayerDetail({player,language,currency}:{
  player:CoachPlayer;
  language:"es"|"en";
  currency:Parameters<typeof formatCurrency>[1];
}) {
  const es=language==="es";

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
            <span>{getRoleLabel(player.role,language)}{player.isIGL?" · IGL":""}</span>
            <h2>{player.ign}</h2>
            <small>{player.starter?(es?"TITULAR":"STARTER"):(es?"SUPLENTE":"SUBSTITUTE")} · {player.age} {es?"AÑOS":"YEARS OLD"}</small>
          </div>
        </div>

        <div className="coach-roster__detail-overall">
          <strong className={getOverallClass(player.overall)}>{player.overall}</strong>
          <span>OVR</span>
        </div>
      </header>

      <section className="coach-roster__profile-grid">
        <ProfileItem label={es?"POTENCIAL":"POTENTIAL"} value={String(player.potential)}/>
        <ProfileItem label={es?"EDAD":"AGE"} value={String(player.age)}/>
        <ProfileItem label={es?"ROL":"ROLE"} value={`${getRoleLabel(player.role,language)}${player.isIGL?" · IGL":""}`}/>
        <ProfileItem label={es?"CONTRATO":"CONTRACT"} value={formatContract(player,language)}/>
      </section>

      <section className="coach-roster__radar-section">
        <header>
          <div>
            <span>PLAYER PROFILE</span>
            <strong>{es?"ATRIBUTOS":"ATTRIBUTES"}</strong>
          </div>

          <div>
            <span>{es?"MEDIA":"AVERAGE"}</span>
            <strong>{averageStats}</strong>
          </div>
        </header>

        <PlayerRadar player={player} language={language}/>
      </section>

      <section className="coach-roster__attribute-list">
        <Attribute label="AIM" value={player.stats.aim}/>
        <Attribute label="GAME SENSE" value={player.stats.gameSense}/>
        <Attribute label={es?"COMUNICACIÓN":"COMMUNICATION"} value={player.stats.communication}/>
        <Attribute label="CLUTCH" value={player.stats.clutch}/>
        <Attribute label={es?"CONSISTENCIA":"CONSISTENCY"} value={player.stats.consistency}/>
        <Attribute label="MENTAL" value={player.stats.mental}/>
      </section>

      <section className="coach-roster__financial">
        <span>{es?"CONTRATO Y VALOR":"CONTRACT & VALUE"}</span>

        <div>
          <ProfileItem label={es?"SUELDO MENSUAL":"MONTHLY SALARY"} value={formatCurrency(player.salary,currency)}/>
          <ProfileItem label={es?"VALOR MERCADO":"MARKET VALUE"} value={formatCurrency(player.marketValue,currency)}/>
        </div>
      </section>
    </>
  );
}

function PlayerRadar({player,language}:{player:CoachPlayer;language:"es"|"en"}) {
  const stats=[
    {label:"AIM",value:player.stats.aim},
    {label:"GAME",value:player.stats.gameSense},
    {label:language==="es"?"COMMS":"COMMS",value:player.stats.communication},
    {label:"CLUTCH",value:player.stats.clutch},
    {label:language==="es"?"CONS.":"CONS.",value:player.stats.consistency},
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

function formatContract(player:CoachPlayer,language:"es"|"en") {
  const years=player.contractSeasonsRemaining??0;

  if(years<=0)return language==="es"?"EXPIRA":"EXPIRES";

  if(language==="es")return `${years} ${years===1?"AÑO":"AÑOS"}`;
  return `${years} ${years===1?"YEAR":"YEARS"}`;
}

function getRoleLabel(role:CoachPlayer["role"],language:"es"|"en") {
  if(language==="en")return role.toUpperCase();

  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";

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