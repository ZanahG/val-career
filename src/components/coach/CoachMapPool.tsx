import type {CoachCareerState,CoachMapName} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getBestCoachMaps,getMapScore,trainCoachMap} from "../../logic/coachMapPool";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMapPool.css";

interface CoachMapPoolProps {
  career:CoachCareerState;
  onUpdateCareer:(career:CoachCareerState)=>void;
  onOpenVeto:()=>void;
  onBack:()=>void;
}

export function CoachMapPool({career,onUpdateCareer,onBack,onOpenVeto}:CoachMapPoolProps) {
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);
  const maps=getBestCoachMaps(career.team.mapPool);
  const bestMap=maps[0];
  const averageRating=maps.length?Math.round(maps.reduce((total,map)=>total+getMapScore(map),0)/maps.length):0;
  const preparedMaps=maps.filter(map=>map.preparation>=80).length;

  const trainMap=(map:CoachMapName)=>{
    onUpdateCareer({...career,team:{...career.team,mapPool:trainCoachMap(career.team.mapPool,map)}});
  };

  return (
    <main className="coach-map-pool">
      <div className="coach-map-pool__bg"/>
      <div className="coach-map-pool__overlay"/>

      <div className="coach-map-pool__shell">
        <header className="coach-map-pool__topbar">
          <div className="coach-map-pool__club">
            <div className="coach-map-pool__club-logo">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>PREPARACIÓN COMPETITIVA</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-map-pool__back" onClick={onBack}>← DASHBOARD</button>
        </header>

        <section className="coach-map-pool__hero">
          <div>
            <span className="coach-map-pool__eyebrow">MAP ANALYSIS</span>
            <h1>MAP POOL</h1>
            <p>Gestiona las fortalezas de tu equipo, mejora la preparación y construye una ventaja para futuros vetos.</p>
          </div>

          <div className="coach-map-pool__summary">
            <SummaryStat label="MEDIA MAP POOL" value={averageRating}/>
            <SummaryStat label="MAPAS PREPARADOS" value={preparedMaps}/>
            <div className="coach-map-pool__best-summary">
              <span>MEJOR MAPA</span>
              <strong>{bestMap?.map??"-"}</strong>
              <small>{bestMap?`${getMapScore(bestMap)} RATING`:"SIN DATOS"}</small>
            </div>
          </div>
        </section>

        <section className="coach-map-pool__control-bar">
          <div>
            <span>MAP POOL ACTUAL</span>
            <strong>{maps.length} MAPAS</strong>
          </div>
        </section>

        <section className="coach-map-pool__grid">
          {maps.map((map,index)=>(
            <MapCard key={map.map} map={map} rank={index+1} best={index===0} onTrain={()=>trainMap(map.map)}/>
          ))}
        </section>
      </div>
    </main>
  );
}

function MapCard({map,rank,best,onTrain}:{map:CoachCareerState["team"]["mapPool"]["maps"][number];rank:number;best:boolean;onTrain:()=>void}) {
  const rating=getMapScore(map);
  const ready=map.preparation>=80;

  return (
    <article className={`coach-map-card${best?" coach-map-card--best":""}`}>
      <div className="coach-map-card__visual">
        <div className="coach-map-card__rank">#{rank}</div>

        {best&&<div className="coach-map-card__badge">MEJOR MAPA</div>}

        <div className="coach-map-card__title">
          <span>{ready?"PREPARADO":"EN DESARROLLO"}</span>
          <h2>{map.map}</h2>
        </div>

        <div className="coach-map-card__rating">
          <strong>{rating}</strong>
          <span>RATING</span>
        </div>
      </div>

      <div className="coach-map-card__body">
        <div className="coach-map-card__stats">
          <MapStat label="FUERZA" value={map.strength}/>
          <MapStat label="ATAQUE" value={map.attack}/>
          <MapStat label="DEFENSA" value={map.defense}/>
          <MapStat label="PREPARACIÓN" value={map.preparation}/>
        </div>

        <div className="coach-map-card__rating-bar">
          <span style={{width:`${rating}%`}}/>
        </div>

        <div className="coach-map-card__footer">
          <div>
            <span>ESTADO</span>
            <strong className={ready?"coach-map-card__ready":"coach-map-card__developing"}>
              {ready?"LISTO PARA COMPETIR":"REQUIERE TRABAJO"}
            </strong>
          </div>

          <button disabled={map.preparation>=100} onClick={onTrain}>
            {map.preparation>=100?"PREPARACIÓN MÁXIMA":"ENTRENAR MAPA"}
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryStat({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-map-pool__summary-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MapStat({label,value}:{label:string;value:number}) {
  return (
    <div className="coach-map-card__stat">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="coach-map-card__stat-bar">
        <span style={{width:`${value}%`}}/>
      </div>
    </div>
  );
}