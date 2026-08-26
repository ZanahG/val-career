import {useEffect,useMemo,useState} from "react";
import type {CoachCareerState,CoachMapName,CoachMapVetoState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {createInitialCoachMapPool,getMapScore} from "../../logic/coachMapPool";
import {applyOpponentVetoSelection,applyPlayerVetoSelection,createCoachMapVeto,getCurrentVetoStep} from "../../logic/coachMapVeto";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMapVeto.css";

interface CoachMapVetoProps {
  career:CoachCareerState;
  opponentTeamId:string;
  onComplete:(veto:CoachMapVetoState)=>void;
  onBack:()=>void;
}

export function CoachMapVeto({career,opponentTeamId,onComplete,onBack}:CoachMapVetoProps) {
  const team=getTeamById(career.team.teamId);
  const teamLogo=getTeamLogo(team?.logo);
  const opponent=getTeamById(opponentTeamId);
  const opponentLogo=getTeamLogo(opponent?.logo);

  const opponentPool=useMemo(
    ()=>opponent?createInitialCoachMapPool(opponent):null,
    [opponent],
  );

  const mapNames=useMemo(
    ()=>career.team.mapPool.maps.map(map=>map.map),
    [career.team.mapPool.maps],
  );

  const [veto,setVeto]=useState<CoachMapVetoState|null>(
    ()=>opponentTeamId?createCoachMapVeto(opponentTeamId,mapNames):null,
  );

  useEffect(()=>{
    if(!opponentTeamId)return;
    setVeto(createCoachMapVeto(opponentTeamId,mapNames));
  },[opponentTeamId,mapNames]);

  useEffect(()=>{
    if(!veto||!opponentPool||veto.completed)return;

    const step=getCurrentVetoStep(veto);
    if(step?.team!=="opponent")return;

    const timer=window.setTimeout(()=>{
      setVeto(current=>{
        if(!current)return current;
        return applyOpponentVetoSelection(current,opponentPool,career.team.mapPool);
      });
    },650);

    return ()=>window.clearTimeout(timer);
  },[veto,opponentPool,career.team.mapPool]);

  const selectMap=(map:CoachMapName)=>{
    if(!veto)return;
    setVeto(applyPlayerVetoSelection(veto,map));
  };

  const step=veto?getCurrentVetoStep(veto):null;
  const currentStepNumber=veto?Math.min(veto.currentStep+1,6):1;

  return (
    <main className="coach-veto">
      <div className="coach-veto__bg"/>
      <div className="coach-veto__overlay"/>

      <div className="coach-veto__shell">
        <header className="coach-veto__topbar">
          <div className="coach-veto__club">
            <div className="coach-veto__club-logo">
              {teamLogo?<img src={teamLogo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>PREPARACIÓN DE PARTIDO</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>{team?.circuit} · {team?.marketRegion}</small>
            </div>
          </div>

          <button className="coach-veto__back" onClick={onBack}>← VOLVER</button>
        </header>

        <section className="coach-veto__hero">
          <div>
            <span className="coach-veto__eyebrow">MATCH PREPARATION</span>
            <h1>MAP VETO</h1>
            <p>Construye la serie eliminando los mapas más peligrosos y seleccionando las mejores condiciones para tu equipo.</p>
          </div>

          <div className="coach-veto__matchup">
            <TeamBadge logo={teamLogo} shortName={team?.shortName??"TÚ"} name={team?.name??"Tu equipo"}/>

            <div className="coach-veto__versus">
              <span>BO3</span>
              <strong>VS</strong>
            </div>

            <TeamBadge logo={opponentLogo} shortName={opponent?.shortName??"RIVAL"} name={opponent?.name??"Rival"} reverse/>
          </div>
        </section>

        {veto&&!veto.completed&&(
          <section className="coach-veto__progress">
            <div className="coach-veto__progress-head">
              <div>
                <span>PASO {currentStepNumber}/6</span>
                <strong>
                  {step?.team==="player"
                    ? `${step.action==="ban"?"BANEA":"ELIGE"} UN MAPA`
                    : `${opponent?.shortName??"RIVAL"} ESTÁ ${step?.action==="ban"?"BANEANDO":"ELIGIENDO"}`
                  }
                </strong>
              </div>

              <span className={`coach-veto__turn ${step?.team==="player"?"coach-veto__turn--player":"coach-veto__turn--opponent"}`}>
                {step?.team==="player"?"TU TURNO":"TURNO RIVAL"}
              </span>
            </div>

            <VetoProgress currentStep={veto.currentStep}/>
          </section>
        )}

        <div className="coach-veto__layout">
          <section className="coach-veto__maps-panel">
            <header className="coach-veto__section-head">
              <div>
                <span>MAP POOL</span>
                <strong>MAPAS DISPONIBLES</strong>
              </div>

              <span>{veto?.availableMaps.length??0} DISPONIBLES</span>
            </header>

            <div className="coach-veto__maps">
              {veto?.availableMaps.map(map=>{
                const yours=career.team.mapPool.maps.find(item=>item.map===map);
                const theirs=opponentPool?.maps.find(item=>item.map===map);

                const yourScore=yours?getMapScore(yours):0;
                const rivalScore=theirs?getMapScore(theirs):0;
                const difference=yourScore-rivalScore;

                return (
                  <button
                    key={map}
                    disabled={step?.team!=="player"}
                    className={`coach-veto-map ${difference>=8?"coach-veto-map--strong":difference<=-8?"coach-veto-map--danger":""}`}
                    onClick={()=>selectMap(map)}
                  >
                    <div className="coach-veto-map__top">
                      <div>
                        <span>{getAdvantageLabel(difference)}</span>
                        <strong>{map}</strong>
                      </div>

                      <div className={`coach-veto-map__difference ${difference>=0?"positive":"negative"}`}>
                        {difference>=0?"+":""}{difference}
                      </div>
                    </div>

                    <div className="coach-veto-map__comparison">
                      <div>
                        <span>{team?.shortName??"TÚ"}</span>
                        <strong>{yourScore}</strong>
                      </div>

                      <div className="coach-veto-map__versus-line">
                        <span/>
                      </div>

                      <div>
                        <span>{opponent?.shortName??"RIVAL"}</span>
                        <strong>{rivalScore}</strong>
                      </div>
                    </div>

                    <div className="coach-veto-map__bar">
                      <span className="coach-veto-map__bar-player" style={{width:`${Math.max(0,Math.min(100,yourScore))}%`}}/>
                      <span className="coach-veto-map__bar-rival" style={{width:`${Math.max(0,Math.min(100,rivalScore))}%`}}/>
                    </div>

                    <small>
                      {step?.team==="player"
                        ? step.action==="ban"?"SELECCIONAR PARA BAN":"SELECCIONAR COMO PICK"
                        : "ESPERANDO AL RIVAL"}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="coach-veto__sidebar">
            <section className="coach-veto__history">
              <header className="coach-veto__section-head">
                <div>
                  <span>SECUENCIA</span>
                  <strong>HISTORIAL DEL VETO</strong>
                </div>
              </header>

              {!veto?.selections.length?(
                <div className="coach-veto__history-empty">
                  <span>NINGUNA SELECCIÓN</span>
                  <p>Los bans y picks aparecerán aquí a medida que avance el veto.</p>
                </div>
              ):(
                <div className="coach-veto__history-list">
                  {veto.selections.map((selection,index)=>(
                    <article key={`${selection.map}-${index}`} className={`coach-veto__history-item coach-veto__history-item--${selection.action}`}>
                      <span>{String(index+1).padStart(2,"0")}</span>

                      <div>
                        <small>{selection.team==="player"?team?.shortName??"TÚ":opponent?.shortName??"RIVAL"}</small>
                        <strong>{selection.map}</strong>
                      </div>

                      <b>{selection.action==="ban"?"BAN":"PICK"}</b>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {veto?.completed&&(
              <section className="coach-veto__result">
                <header className="coach-veto__section-head">
                  <div>
                    <span>SERIE DEFINIDA</span>
                    <strong>MAPAS DEL BO3</strong>
                  </div>
                </header>

                <div className="coach-veto__series">
                  {veto.seriesMaps.map((map,index)=>(
                    <article key={`${map}-${index}`}>
                      <span>MAPA {index+1}</span>
                      <strong>{map}</strong>
                      <small>{index===2?"DECIDER":getPickOwner(veto,map,team?.shortName??"TÚ",opponent?.shortName??"RIVAL")}</small>
                    </article>
                  ))}
                </div>

                <button className="coach-veto__play" onClick={()=>onComplete(veto)}>
                  <span>
                    <small>VETO COMPLETADO</small>
                    JUGAR SERIE
                  </span>
                  <b>→</b>
                </button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function TeamBadge({logo,shortName,name,reverse=false}:{logo?:string;shortName:string;name:string;reverse?:boolean}) {
  return (
    <div className={`coach-veto__team-badge${reverse?" coach-veto__team-badge--reverse":""}`}>
      <div className="coach-veto__team-logo">
        {logo?<img src={logo} alt={name}/>:<span>{shortName}</span>}
      </div>

      <div>
        <strong>{name}</strong>
        <span>{shortName}</span>
      </div>
    </div>
  );
}

function VetoProgress({currentStep}:{currentStep:number}) {
  const labels=["BAN","BAN","PICK","PICK","BAN","BAN"];

  return (
    <div className="coach-veto__steps">
      {labels.map((label,index)=>{
        const done=index<currentStep;
        const active=index===currentStep;

        return (
          <div key={`${label}-${index}`} className={`coach-veto__step${done?" coach-veto__step--done":""}${active?" coach-veto__step--active":""}`}>
            <span>{String(index+1).padStart(2,"0")}</span>
            <strong>{label}</strong>
          </div>
        );
      })}

      <div className="coach-veto__step coach-veto__step--decider">
        <span>07</span>
        <strong>DECIDER</strong>
      </div>
    </div>
  );
}

function getAdvantageLabel(difference:number) {
  if(difference>=8)return "VENTAJA CLARA";
  if(difference>=1)return "LIGERA VENTAJA";
  if(difference<=-8)return "RIESGO ALTO";
  if(difference<0)return "LIGERA DESVENTAJA";
  return "EQUILIBRADO";
}

function getPickOwner(veto:CoachMapVetoState,map:CoachMapName,player:string,opponent:string) {
  const selection=veto.selections.find(item=>item.map===map&&item.action==="pick");

  if(!selection)return "SELECCIONADO";
  return selection.team==="player"?`PICK ${player}`:`PICK ${opponent}`;
}