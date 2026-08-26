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

const MAP_IMAGES=import.meta.glob("../../images/maps/*.{png,jpg,jpeg,webp}",{eager:true,query:"?url",import:"default"}) as Record<string,string>;

export function CoachMapPool({career,onUpdateCareer,onBack,onOpenVeto}:CoachMapPoolProps) {
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);
  const maps=getBestCoachMaps(career.team.mapPool);
  const bestMap=maps[0];

  const averageRating=maps.length
    ?Math.round(maps.reduce((total,map)=>total+getMapScore(map),0)/maps.length)
    :0;

  const preparedMaps=maps.filter(map=>map.preparation>=80).length;

  const trainMap=(map:CoachMapName)=>{
    if(career.team.trainingSessions<=0)return;

    const trainedMaps=career.team.trainedMapsThisPeriod??[];

    onUpdateCareer({
      ...career,
      team:{
        ...career.team,
        trainingSessions:career.team.trainingSessions-1,
        trainedMapsThisPeriod:trainedMaps.includes(map)?trainedMaps:[...trainedMaps,map],
        mapPool:trainCoachMap(career.team.mapPool,map),
      },
    });
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
              <span>COACH CAREER</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-map-pool__back" onClick={onBack}>← MENU</button>
        </header>

        <section className="coach-map-pool__hero">
          <div>
            <span className="coach-map-pool__eyebrow">PREPARACIÓN COMPETITIVA</span>
            <h1>MAP POOL</h1>
            <p>Gestiona la preparación de cada mapa, desarrolla las fortalezas del roster y construye una ventaja para los próximos vetos.</p>
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
          <div className="coach-map-pool__rotation">
            <span>MAP POOL ACTUAL</span>
            <strong>{maps.length} MAPAS EN ROTACIÓN</strong>
          </div>

          <div className={`coach-map-pool__training${career.team.trainingSessions<=0?" coach-map-pool__training--empty":""}`}>
            <div className="coach-map-pool__training-copy">
              <span>ENTRENAMIENTO SEMANAL</span>
              <strong>{career.team.trainingSessions} DE 3 SESIONES DISPONIBLES</strong>
              <small>Se renuevan al comenzar una nueva Week o ronda competitiva.</small>
            </div>

            <div className="coach-map-pool__training-slots">
              {[0,1,2].map(index=>(
                <span key={index} className={index<career.team.trainingSessions?"coach-map-pool__training-slot coach-map-pool__training-slot--active":"coach-map-pool__training-slot"}>
                  <b>{index<career.team.trainingSessions?"✓":"×"}</b>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="coach-map-pool__grid">
          {maps.map((map,index)=>(
            <MapCard
              key={map.map}
              map={map}
              rank={index+1}
              best={index===0}
              trainingSessions={career.team.trainingSessions}
              onTrain={()=>trainMap(map.map)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function MapCard({map,rank,best,trainingSessions,onTrain}:{
  map:CoachCareerState["team"]["mapPool"]["maps"][number];
  rank:number;
  best:boolean;
  trainingSessions:number;
  onTrain:()=>void;
}) {
  const rating=getMapScore(map);
  const ready=map.preparation>=80;
  const mapImage=getMapImage(map.map);

  return (
    <article className={`coach-map-card${best?" coach-map-card--best":""}`}>
      <div
        className="coach-map-card__visual"
        style={mapImage?{"--map-image":`url("${mapImage}")`} as React.CSSProperties:undefined}
      >
        <div className="coach-map-card__image"/>
        <div className="coach-map-card__image-overlay"/>

        <div className="coach-map-card__rank">
          <span>MAP RANK</span>
          <strong>#{rank}</strong>
        </div>

        {best&&<div className="coach-map-card__badge">★ MEJOR MAPA</div>}

        <div className="coach-map-card__title">
          <span>{ready?"PREPARADO":"EN DESARROLLO"}</span>
          <h2>{map.map.toUpperCase()}</h2>
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

        <div className="coach-map-card__overall">
          <div>
            <span>RENDIMIENTO GLOBAL</span>
            <strong>{rating}/100</strong>
          </div>

          <div className="coach-map-card__rating-bar">
            <span style={{width:`${rating}%`}}/>
          </div>
        </div>

        <footer className="coach-map-card__footer">
          <div>
            <span>ESTADO</span>
            <strong className={ready?"coach-map-card__ready":"coach-map-card__developing"}>
              {map.preparation>=95
                ?"PREPARACIÓN ÉLITE"
                :ready
                  ?"LISTO PARA COMPETIR"
                  :"REQUIERE TRABAJO"}
            </strong>
          </div>

          <button disabled={map.preparation>=95||trainingSessions<=0} onClick={onTrain}>
            {map.preparation>=95
              ?"PREPARACIÓN ÉLITE"
              :trainingSessions<=0
                ?"SIN SESIONES"
                :"ENTRENAR MAPA"}
          </button>
        </footer>
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

function getMapImage(map:CoachMapName) {
  const slug=normalizeMapName(map);

  const entry=Object.entries(MAP_IMAGES).find(([path])=>{
    const filename=path.split("/").pop()?.replace(/\.(png|jpe?g|webp)$/i,"")??"";
    return normalizeMapName(filename)===slug;
  });

  return entry?.[1];
}

function normalizeMapName(value:string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]/g,"");
}