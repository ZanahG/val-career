import type {CoachCareerState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import {useGameSettings} from "../../context/GameSettingsContext";
import "../../styles/CoachProfile.css";

interface CoachProfileProps {
  career:CoachCareerState;
  onBack:()=>void;
}

export function CoachProfile({career,onBack}:CoachProfileProps) {
  const {language}=useGameSettings();
  const es=language==="es";

  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);

  const achieved=career.board.objectives.filter(objective=>objective.status==="Achieved").length;
  const total=career.board.objectives.length;

  return (
    <main className="coach-profile">
      <div className="coach-profile__shell">
        <header className="coach-profile__topbar">
          <div>
            <span>COACH CAREER</span>
            <strong>{es?"PERFIL DEL ENTRENADOR":"COACH PROFILE"}</strong>
          </div>

          <button onClick={onBack}>← {es?"VOLVER":"BACK"}</button>
        </header>

        <section className="coach-profile__hero">
          <div className="coach-profile__identity">
            <div className="coach-profile__logo">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TCV"}</span>}
            </div>

            <div>
              <span>HEAD COACH</span>
              <h1>{career.coach.name}</h1>
              <p>{career.coach.nationality} · {career.coach.age} {es?"años":"years"}</p>
            </div>
          </div>

          <div className="coach-profile__status-panel">
            <div className="coach-profile__stats">
              <ProfileStat label={es?"REPUTACIÓN":"REPUTATION"} value={career.coach.reputation}/>
              <ProfileStat label={es?"CONFIANZA":"CONFIDENCE"} value={career.board.confidence}/>

              <div className={`coach-profile__stat coach-profile__security coach-profile__security--${career.board.jobSecurity.toLowerCase().replace(/\s+/g,"-")}`}>
                <span>{es?"SEGURIDAD":"JOB SECURITY"}</span>
                <strong>{getJobSecurityLabel(career.board.jobSecurity,language)}</strong>
              </div>
            </div>

            <div className="coach-profile__confidence">
              <div className="coach-profile__confidence-head">
                <span>{es?"CONFIANZA DE LA DIRECTIVA":"BOARD CONFIDENCE"}</span>
                <strong>{career.board.confidence}/100</strong>
              </div>

              <div className="coach-profile__confidence-track">
                <div
                  className={`coach-profile__confidence-fill coach-profile__confidence-fill--${getConfidenceLevel(career.board.confidence)}`}
                  style={{width:`${career.board.confidence}%`}}
                />
              </div>

              <div className="coach-profile__confidence-labels">
                <span>CRITICAL</span>
                <span>PRESSURE</span>
                <span>STABLE</span>
                <span>SECURE</span>
              </div>
            </div>
          </div>
        </section>

        <section className="coach-profile__board-message">
          <div>
            <span>{es?"EVALUACIÓN DE LA DIRECTIVA":"BOARD EVALUATION"}</span>
            <strong>{getBoardEvaluationTitle(career,language)}</strong>
          </div>
        </section>

        <section className="coach-profile__grid">
          <section className="coach-profile__card">
            <header>
              <div>
                <span>{es?"DIRECTIVA":"BOARD"}</span>
                <strong>{es?"OBJETIVOS DE TEMPORADA":"SEASON OBJECTIVES"}</strong>
              </div>

              <small>{achieved}/{total}</small>
            </header>

            <div className="coach-profile__objectives">
              {career.board.objectives.map(objective=>(
                <div key={objective.id} className={`coach-profile__objective coach-profile__objective--${objective.status.toLowerCase()}`}>
                  <span>{getObjectiveIcon(objective.status)}</span>

                  <div>
                    <strong>{getObjectiveLabel(objective.type,language)}</strong>
                    <small>{getObjectiveStatusLabel(objective.status,language)}</small>
                  </div>

                  <div className="coach-profile__objective-impact">
                    <span>{es?"CONFIANZA":"CONFIDENCE"}</span>
                    <b>{objective.status==="Failed"?"-":"+"}{objective.confidenceImpact}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="coach-profile__card">
            <header>
              <div>
                <span>{es?"CARRERA":"CAREER"}</span>
                <strong>{es?"RESUMEN":"SUMMARY"}</strong>
              </div>
            </header>

            <div className="coach-profile__career-stats">
              <ProfileStat label={es?"TEMPORADAS":"SEASONS"} value={career.coach.careerHistory.length}/>
              <ProfileStat label={es?"TROFEOS":"TROPHIES"} value={career.coach.trophies.length}/>
              <ProfileStat label={es?"TEMPORADA ACTUAL":"CURRENT SEASON"} value={career.coach.season}/>
            </div>

            <div className="coach-profile__career-details">
              <CareerDetail label={es?"CLUB ACTUAL":"CURRENT CLUB"} value={team?.name??"-"}/>
              <CareerDetail label={es?"CIRCUITO":"CIRCUIT"} value={career.coach.circuit}/>
              <CareerDetail label={es?"ETAPA":"STAGE"} value={career.coach.stage}/>
              <CareerDetail label={es?"ESTADO":"STATUS"} value={getEmploymentStatusLabel(career,language)}/>
            </div>
          </section>
        </section>

        <section className="coach-profile__card">
          <header>
            <div>
              <span>{es?"HISTORIAL":"HISTORY"}</span>
              <strong>{es?"TRAYECTORIA":"CAREER HISTORY"}</strong>
            </div>
          </header>

          {career.coach.careerHistory.length?(
            <div className="coach-profile__history">
              {[...career.coach.careerHistory].reverse().map(entry=>(
                <div key={`${entry.season}-${entry.teamId}`} className="coach-profile__history-row">
                  <span>{entry.season}</span>
                  <strong>{entry.teamName}</strong>
                  <small>{entry.wins}W · {entry.losses}L</small>
                  <small>{entry.trophies.length} {es?"trofeos":"trophies"}</small>
                </div>
              ))}
            </div>
          ):(
            <div className="coach-profile__empty">
              {es?"Todavía no hay temporadas completadas.":"No completed seasons yet."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileStat({label,value}:{label:string;value:string|number}) {
  return (
    <div className="coach-profile__stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CareerDetail({label,value}:{label:string;value:string|number}) {
  return (
    <div className="coach-profile__career-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getObjectiveIcon(status:"Active"|"Achieved"|"Failed") {
  if(status==="Achieved")return "✓";
  if(status==="Failed")return "×";

  return "○";
}

function getObjectiveStatusLabel(status:"Active"|"Achieved"|"Failed",language:"es"|"en") {
  if(language==="en"){
    if(status==="Achieved")return "Achieved";
    if(status==="Failed")return "Failed";

    return "In progress";
  }

  if(status==="Achieved")return "Cumplido";
  if(status==="Failed")return "Fallido";

  return "En progreso";
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

function getBoardEvaluationTitle(career:CoachCareerState,language:"es"|"en") {
  const status=career.board.jobSecurity;

  if(language==="en"){
    if(status==="Secure")return "THE BOARD FULLY SUPPORTS YOU";
    if(status==="Stable")return "THE BOARD IS SATISFIED";
    if(status==="Under Pressure")return "RESULTS MUST IMPROVE";

    return "YOUR POSITION IS AT SERIOUS RISK";
  }

  if(status==="Secure")return "LA DIRECTIVA CONFÍA PLENAMENTE EN TI";
  if(status==="Stable")return "LA DIRECTIVA ESTÁ SATISFECHA";
  if(status==="Under Pressure")return "LOS RESULTADOS DEBEN MEJORAR";

  return "TU PUESTO ESTÁ EN SERIO RIESGO";
}

function getBoardEvaluationText(career:CoachCareerState,language:"es"|"en") {
  const status=career.board.jobSecurity;
  const active=career.board.objectives.filter(objective=>objective.status==="Active").length;
  const failed=career.board.objectives.filter(objective=>objective.status==="Failed").length;

  if(language==="en"){
    if(status==="Secure"){
      return "Your recent work has earned strong support from the board. Continue meeting the club's ambitions.";
    }

    if(status==="Stable"){
      return active>0
        ?"Your position is stable, but the board still expects progress toward the remaining objectives."
        :"The board considers your work satisfactory.";
    }

    if(status==="Under Pressure"){
      return failed>0
        ?"Failed objectives have increased pressure on your position. Upcoming results will be important."
        :"The board expects a stronger run of results.";
    }

    return "Confidence in your management is extremely low. Another poor evaluation could end your tenure.";
  }

  if(status==="Secure"){
    return "Tu trabajo reciente te ha dado un respaldo importante de la directiva. Mantén el nivel y cumple las ambiciones del club.";
  }

  if(status==="Stable"){
    return active>0
      ?"Tu puesto es estable, aunque la directiva todavía espera avances en los objetivos pendientes."
      :"La directiva considera satisfactorio tu trabajo.";
  }

  if(status==="Under Pressure"){
    return failed>0
      ?"Los objetivos incumplidos han aumentado la presión sobre tu puesto. Los próximos resultados serán importantes."
      :"La directiva espera una mejora clara en los resultados.";
  }

  return "La confianza en tu gestión es extremadamente baja. Una nueva evaluación negativa podría terminar tu etapa en el club.";
}

function getObjectiveLabel(type:CoachCareerState["board"]["objectives"][number]["type"],language:"es"|"en") {
  if(language==="en")return type;

  if(type==="Reach Stage Playoffs")return "Alcanzar Playoffs de Stage";
  if(type==="Reach Masters")return "Clasificar a Masters";
  if(type==="Reach Champions")return "Clasificar a Champions";
  if(type==="Reach Champions Playoffs")return "Alcanzar Playoffs de Champions";
  if(type==="Win Regional Event")return "Ganar evento regional";
  if(type==="Win International Event")return "Ganar evento internacional";

  return type;
}

function getEmploymentStatusLabel(career:CoachCareerState,language:"es"|"en") {
  if(language==="en"){
    return career.board.employmentStatus==="Dismissed"?"DISMISSED":"EMPLOYED";
  }

  return career.board.employmentStatus==="Dismissed"?"DESTITUIDO":"CONTRATADO";
}