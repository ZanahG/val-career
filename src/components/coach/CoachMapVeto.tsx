import {useEffect,useMemo,useState} from "react";
import type {CSSProperties} from "react";
import type {CoachCareerState,CoachMapName,CoachMapVetoState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {createInitialCoachMapPool,getMapScore} from "../../logic/coachMapPool";
import {applyOpponentVetoSelection,applyPlayerVetoSelection,createCoachMapVeto,getCoachVetoSteps,getCurrentVetoStep} from "../../logic/coachMapVeto";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMapVeto.css";

interface CoachMapVetoProps {
  career:CoachCareerState;
  opponentTeamId:string;
  bestOf:3|5;
  onComplete:(veto:CoachMapVetoState)=>void;
  onBack:()=>void;
}

const MAP_IMAGES=import.meta.glob("../../images/maps/*.{png,jpg,jpeg,webp}",{eager:true,query:"?url",import:"default"}) as Record<string,string>;

export function CoachMapVeto({career,opponentTeamId,bestOf,onComplete,onBack}:CoachMapVetoProps) {
  const team=getTeamById(career.team.teamId);
  const opponent=getTeamById(opponentTeamId);
  const teamLogo=getTeamLogo(team?.logo);
  const opponentLogo=getTeamLogo(opponent?.logo);

  const opponentPool=useMemo(()=>opponent?createInitialCoachMapPool(opponent):null,[opponent]);
  const mapNames=useMemo(()=>career.team.mapPool.maps.map(map=>map.map),[career.team.mapPool.maps]);

  const [veto,setVeto]=useState<CoachMapVetoState|null>(()=>opponentTeamId?createCoachMapVeto(opponentTeamId,mapNames,bestOf):null);
  const [hoveredMap,setHoveredMap]=useState<CoachMapName|null>(null);

  useEffect(()=>{
    if(!opponentTeamId)return;

    setVeto(createCoachMapVeto(opponentTeamId,mapNames,bestOf));
    setHoveredMap(null);
  },[opponentTeamId,mapNames,bestOf]);

  useEffect(()=>{
    if(!veto||!opponentPool||veto.completed)return;

    const step=getCurrentVetoStep(veto);
    if(step?.team!=="opponent")return;

    const timer=window.setTimeout(()=>{
      setVeto(current=>{
        if(!current)return current;
        return applyOpponentVetoSelection(current,opponentPool,career.team.mapPool);
      });
    },850);

    return ()=>window.clearTimeout(timer);
  },[veto,opponentPool,career.team.mapPool]);

  const step=veto?getCurrentVetoStep(veto):null;

  const displayMap=
    hoveredMap??
    getDisplayMap(veto,career.team.mapPool,opponentPool);

  const backgroundImage=displayMap?getMapImage(displayMap):undefined;

  const myScore=
    displayMap
      ?getScoreForMap(career.team.mapPool,displayMap)
      :0;

  const oppScore=
    displayMap&&opponentPool
      ?getScoreForMap(opponentPool,displayMap)
      :0;

  const difference=myScore-oppScore;
  const vetoStepCount=veto?getCoachVetoSteps(veto.bestOf).length:0;
  const stepNumber=veto?Math.min(veto.currentStep+1,vetoStepCount+1):1;

  const handleSelectMap=(map:CoachMapName)=>{
    if(!veto||step?.team!=="player")return;

    setHoveredMap(null);
    setVeto(applyPlayerVetoSelection(veto,map));
  };

  const canPick=Boolean(
    veto&&
    !veto.completed&&
    step?.team==="player"
  );

  const title=getMainTitle(
    veto,
    step,
    team?.shortName??"TU EQUIPO",
    opponent?.shortName??"RIVAL",
  );

  const subtitle=getMainSubtitle(veto,step);
  const activeMaps=veto?.availableMaps??[];

  return (
    <main
      className="coach-map-veto"
      style={backgroundImage?{"--map-bg-image":`url("${backgroundImage}")`} as CSSProperties:undefined}
    >
      <div className="coach-map-veto__bg"/>
      <div className="coach-map-veto__overlay"/>

      <button className="coach-map-veto__back" onClick={onBack}>← MENU</button>

      <div className="coach-map-veto__shell">
        <header className="coach-map-veto__topbar">
          <div className="coach-map-veto__team coach-map-veto__team--left">
            <div className="coach-map-veto__team-logo">
              {teamLogo
                ?<img src={teamLogo} alt={team?.name??""}/>
                :<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div className="coach-map-veto__team-copy">
              <strong>{team?.shortName??"TEAM"}</strong>
              <span>{team?.name??"Tu equipo"}</span>
            </div>
          </div>

          <div className="coach-map-veto__center-status">
            <strong>{String(stepNumber).padStart(2,"0")}</strong>
            <span>VOTE MAP · BO{bestOf}</span>
          </div>

          <div className="coach-map-veto__team coach-map-veto__team--right">
            <div className="coach-map-veto__team-copy">
              <strong>{opponent?.shortName??"RIVAL"}</strong>
              <span>{opponent?.name??"Rival"}</span>
            </div>

            <div className="coach-map-veto__team-logo">
              {opponentLogo
                ?<img src={opponentLogo} alt={opponent?.name??""}/>
                :<span>{opponent?.shortName??"TBD"}</span>}
            </div>
          </div>
        </header>

        <section className="coach-map-veto__layout">
          <aside className="coach-map-veto__rail">
            {veto&&Array.from({length:getCoachVetoSteps(veto.bestOf).length+1},(_,index)=>(
              <StepRow
                key={index}
                index={index}
                veto={veto}
                isCurrent={!veto.completed&&index===veto.currentStep}
                playerShortName={team?.shortName??"TEAM"}
                opponentShortName={opponent?.shortName??"RIVAL"}
              />
            ))}
          </aside>

          <section className="coach-map-veto__board">
            <div className="coach-map-veto__heading">
              <h1 className="coach-map-veto__title">{title}</h1>

              <div className={`coach-map-veto__turn${veto?.completed?" coach-map-veto__turn--player":step?.team==="player"?" coach-map-veto__turn--player":" coach-map-veto__turn--opponent"}`}>
                {veto?.completed
                  ?"SERIE LISTA"
                  :step?.team==="player"
                    ?"YOUR TEAM"
                    :"OPPONENT"}
              </div>
            </div>

            <div className="coach-map-veto__subheading">
              <div className="coach-map-veto__subheading-line"/>
              <span>{subtitle}</span>
              <div className="coach-map-veto__subheading-line"/>
            </div>

            {!veto?.completed&&(
              <>
                <div className="coach-map-veto__map-grid">
                  {activeMaps.map(map=>{
                    const myMapScore=getScoreForMap(career.team.mapPool,map);
                    const oppMapScore=opponentPool?getScoreForMap(opponentPool,map):0;
                    const mapDiff=myMapScore-oppMapScore;
                    const image=getMapImage(map);

                    return (
                      <button
                        key={map}
                        className={`coach-map-veto__map-card${mapDiff>=6?" coach-map-veto__map-card--good":mapDiff<=-6?" coach-map-veto__map-card--bad":""}`}
                        onClick={()=>handleSelectMap(map)}
                        onMouseEnter={()=>setHoveredMap(map)}
                        onMouseLeave={()=>setHoveredMap(null)}
                        disabled={!canPick}
                        style={image?{"--map-card-image":`url("${image}")`} as CSSProperties:undefined}
                      >
                        <div className="coach-map-veto__map-image"/>
                        <div className="coach-map-veto__map-fade"/>

                        <div className={`coach-map-veto__map-advantage${mapDiff>0?" coach-map-veto__map-advantage--positive":mapDiff<0?" coach-map-veto__map-advantage--negative":" coach-map-veto__map-advantage--neutral"}`}>
                          <span>{getAdvantageLabel(mapDiff)}</span>
                          <strong>{mapDiff>0?`+${mapDiff}`:mapDiff}</strong>
                        </div>

                        <div className="coach-map-veto__map-name">
                          {map.toUpperCase()}
                        </div>

                        <div className="coach-map-veto__map-scores">
                          <span>{team?.shortName??"YOU"} {myMapScore}</span>
                          <span>{opponent?.shortName??"RIV"} {oppMapScore}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <section className="coach-map-veto__info-bar">
                  <div className="coach-map-veto__info-card">
                    <span>MAPA EN FOCO</span>
                    <strong>{displayMap?.toUpperCase()??"-"}</strong>
                  </div>

                  <div className="coach-map-veto__info-card">
                    <span>{team?.shortName??"YOU"}</span>
                    <strong>{myScore}</strong>
                  </div>

                  <div className={`coach-map-veto__info-card coach-map-veto__info-card--highlight${difference>0?" coach-map-veto__info-card--positive":difference<0?" coach-map-veto__info-card--negative":" coach-map-veto__info-card--neutral"}`}>
                    <span>VENTAJA</span>
                    <strong>{difference>0?`+${difference}`:difference}</strong>
                    <small>{getAdvantageLabel(difference)}</small>
                  </div>

                  <div className="coach-map-veto__info-card">
                    <span>{opponent?.shortName??"RIV"}</span>
                    <strong>{oppScore}</strong>
                  </div>
                </section>

                <div className="coach-map-veto__actions">
                  <button className="coach-map-veto__vote-button" disabled={!canPick}>
                    {step?.team==="player"
                      ?step.action==="ban"
                        ?"BAN MAP"
                        :"CHOOSE MAP"
                      :"ESPERANDO RIVAL"}
                  </button>
                </div>
              </>
            )}

            {veto?.completed&&(
              <SeriesResult
                veto={veto}
                playerShortName={team?.shortName??"TÚ"}
                opponentShortName={opponent?.shortName??"RIVAL"}
                playerPool={career.team.mapPool}
                opponentPool={opponentPool}
                onHover={setHoveredMap}
                onComplete={()=>onComplete(veto)}
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function SeriesResult({
  veto,
  playerShortName,
  opponentShortName,
  playerPool,
  opponentPool,
  onHover,
  onComplete,
}:{
  veto:CoachMapVetoState;
  playerShortName:string;
  opponentShortName:string;
  playerPool:CoachCareerState["team"]["mapPool"];
  opponentPool:ReturnType<typeof createInitialCoachMapPool>|null;
  onHover:(map:CoachMapName|null)=>void;
  onComplete:()=>void;
}) {
  const seriesLength=veto.seriesMaps.length;
  const formatLabel=seriesLength===5?"BEST OF 5":"BEST OF 3";

  return (
    <section className="coach-map-veto__series-final">
      <header className="coach-map-veto__series-final-head">
        <div>
          <span>SERIE DEFINIDA</span>
          <strong>{formatLabel}</strong>
        </div>

        <small>{seriesLength} MAPAS</small>
      </header>

      <div className={`coach-map-veto__series-final-grid coach-map-veto__series-final-grid--${seriesLength}`}>
        {veto.seriesMaps.map((map,index)=>{
          const image=getMapImage(map);

          const selection=veto.selections.find(
            item=>item.map===map&&item.action==="pick",
          );

          const isDecider=!selection;

          const myScore=getScoreForMap(playerPool,map);
          const oppScore=opponentPool?getScoreForMap(opponentPool,map):0;
          const diff=myScore-oppScore;

          return (
            <article
              key={`${map}-${index}`}
              className={`coach-map-veto__series-final-map${isDecider?" coach-map-veto__series-final-map--decider":""}`}
              onMouseEnter={()=>onHover(map)}
              onMouseLeave={()=>onHover(null)}
              style={image?{"--series-map-image":`url("${image}")`} as CSSProperties:undefined}
            >
              <div className="coach-map-veto__series-final-image"/>
              <div className="coach-map-veto__series-final-overlay"/>

              <div className="coach-map-veto__series-final-index">
                {String(index+1).padStart(2,"0")}
              </div>

              <div className={`coach-map-veto__series-final-advantage${diff>0?" coach-map-veto__series-final-advantage--positive":diff<0?" coach-map-veto__series-final-advantage--negative":" coach-map-veto__series-final-advantage--neutral"}`}>
                <span>{getAdvantageLabel(diff)}</span>
                <strong>{diff>0?`+${diff}`:diff}</strong>
              </div>

              <div className="coach-map-veto__series-final-content">
                <span>
                  {isDecider
                    ?"DECIDER"
                    :selection?.team==="player"
                      ?`PICK ${playerShortName}`
                      :`PICK ${opponentShortName}`}
                </span>

                <strong>{map.toUpperCase()}</strong>

                <small>
                  {playerShortName} {myScore} · {opponentShortName} {oppScore}
                </small>
              </div>
            </article>
          );
        })}
      </div>

      <button
        className="coach-map-veto__vote-button coach-map-veto__vote-button--confirm"
        onClick={onComplete}
      >
        JUGAR SERIE
      </button>
    </section>
  );
}

function StepRow({
  index,
  veto,
  isCurrent,
  playerShortName,
  opponentShortName,
}:{
  index:number;
  veto:CoachMapVetoState;
  isCurrent:boolean;
  playerShortName:string;
  opponentShortName:string;
}) {
  const steps=getCoachVetoSteps(veto.bestOf);
  const selection=index<steps.length?veto.selections[index]:null;
  const decider=index===steps.length;

  const actor=
    selection?.team==="player"
      ?playerShortName
      :opponentShortName;

  const image=
    selection
      ?getMapImage(selection.map)
      :undefined;

  const deciderMap=
    veto.completed
      ?veto.seriesMaps[veto.seriesMaps.length-1]
      :undefined;

  return (
    <article
      className={`coach-map-veto__step${isCurrent?" coach-map-veto__step--current":""}${selection?" coach-map-veto__step--done":""}${decider?" coach-map-veto__step--decider":""}`}
      style={image?{"--step-map-image":`url("${image}")`} as CSSProperties:undefined}
    >
      {selection&&<div className="coach-map-veto__step-image"/>}
      {selection&&<div className="coach-map-veto__step-overlay"/>}

      <div className="coach-map-veto__step-number">
        {String(index+1).padStart(2,"0")}
      </div>

      <div className="coach-map-veto__step-content">
        {decider?(
          <>
            <strong>{deciderMap?.toUpperCase()??"DECIDER"}</strong>
            <span>MAPA FINAL</span>
          </>
        ):selection?(
          <>
            <strong>{selection.map.toUpperCase()}</strong>
            <span>
              {actor} · {selection.action==="ban"?"BAN MAP":"CHOOSE MAP"}
            </span>
          </>
        ):isCurrent?(
          <>
            <strong>{getCurrentStepLabel(veto)}</strong>
            <span>TURNO ACTUAL</span>
          </>
        ):(
          <>
            <strong>PENDING</strong>
            <span>EN ESPERA</span>
          </>
        )}
      </div>

      <div className="coach-map-veto__step-tag">
        {decider
          ?"DEC"
          :selection
            ?selection.action==="ban"
              ?"BAN"
              :"PICK"
            :isCurrent
              ?"NOW"
              :"..."}
      </div>
    </article>
  );
}

function getCurrentStepLabel(veto:CoachMapVetoState) {
  const step=getCurrentVetoStep(veto);

  if(!step)return "PENDING";

  return step.action==="ban"
    ?"BAN MAP"
    :"CHOOSE MAP";
}

function getMainTitle(
  veto:CoachMapVetoState|null,
  step:{team:"player"|"opponent";action:"ban"|"pick"}|null|undefined,
  playerShortName:string,
  opponentShortName:string,
) {
  if(veto?.completed)return "SERIE DEFINIDA";
  if(!step)return "MAP VETO";

  if(step.team==="player"){
    return `${playerShortName} ${step.action==="ban"?"BANS A MAP":"CHOOSES A MAP"}`;
  }

  return `${opponentShortName} ${step.action==="ban"?"BANS A MAP":"CHOOSES A MAP"}`;
}

function getMainSubtitle(
  veto:CoachMapVetoState|null,
  step:{team:"player"|"opponent";action:"ban"|"pick"}|null|undefined,
) {
  if(veto?.completed)return "MAP POOL COMPLETADA";
  if(!step)return "PREPARACIÓN";

  if(step.team==="player"){
    return step.action==="ban"
      ?"Selecciona el mapa que quieres eliminar"
      :"Selecciona tu mejor mapa";
  }

  return step.action==="ban"
    ?"El rival está eliminando un mapa"
    :"El rival está eligiendo mapa";
}

function getDisplayMap(
  veto:CoachMapVetoState|null,
  myPool:CoachCareerState["team"]["mapPool"],
  opponentPool:ReturnType<typeof createInitialCoachMapPool>|null,
) {
  if(veto?.completed&&veto.seriesMaps.length){
    return veto.seriesMaps[0];
  }

  if(veto?.selections.length){
    return veto.selections[veto.selections.length-1].map;
  }

  if(!veto||!opponentPool||!veto.availableMaps.length){
    return myPool.maps[0]?.map??null;
  }

  const ranked=[...veto.availableMaps].sort((a,b)=>{
    const diffA=Math.abs(getMapDifference(a,myPool,opponentPool));
    const diffB=Math.abs(getMapDifference(b,myPool,opponentPool));

    return diffB-diffA;
  });

  return ranked[0]??myPool.maps[0]?.map??null;
}

function getScoreForMap(
  pool:{
    maps:{
      map:CoachMapName;
      strength:number;
      attack:number;
      defense:number;
      preparation:number;
    }[];
  },
  map:CoachMapName,
) {
  const target=pool.maps.find(item=>item.map===map);

  return target
    ?getMapScore(target)
    :0;
}

function getMapDifference(
  map:CoachMapName,
  myPool:CoachCareerState["team"]["mapPool"],
  opponentPool:ReturnType<typeof createInitialCoachMapPool>,
) {
  return getScoreForMap(myPool,map)-getScoreForMap(opponentPool,map);
}

function getAdvantageLabel(diff:number) {
  if(diff>=8)return "VENTAJA CLARA";
  if(diff>=3)return "LIGERA VENTAJA";
  if(diff<=-8)return "DESVENTAJA CLARA";
  if(diff<=-3)return "LIGERA DESVENTAJA";

  return "EQUILIBRADO";
}

function getMapImage(map:CoachMapName) {
  const slug=normalizeMapName(map);

  const entry=Object.entries(MAP_IMAGES).find(([path])=>{
    const filename=
      path
        .split("/")
        .pop()
        ?.replace(/\.(png|jpe?g|webp)$/i,"")
      ??"";

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