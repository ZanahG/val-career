import {useState} from "react";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {useGameSettings} from "../../context/GameSettingsContext";
import playerCareer from "../../images/game-modes/player-career.png";
import playerSide from "../../images/game-modes/player-side.png";
import coachCareer from "../../images/game-modes/coach-career.png";
import coachSide from "../../images/game-modes/coach-side.png";
import "../../styles/GameModeSelect.css";

interface GameModeSelectProps {
  onPlayerCareer:()=>void;
  onCoachCareer:()=>void;
  onContinueCoachCareer:()=>void;
  hasCoachSave:boolean;
}

type GameMode="player"|"coach";

const MODE_ART={
  player:{feature:playerCareer,side:playerSide},
  coach:{feature:coachCareer,side:coachSide},
};

export function GameModeSelect({onPlayerCareer,onCoachCareer,onContinueCoachCareer,hasCoachSave}:GameModeSelectProps) {
  const {language}=useGameSettings();
  const [selectedMode,setSelectedMode]=useState<GameMode>("player");
  const isPlayer=selectedMode==="player";
  const art=MODE_ART[selectedMode];

  const playSelected=()=>{
    if(isPlayer)return onPlayerCareer();
    if(hasCoachSave)return onContinueCoachCareer();
    onCoachCareer();
  };

  return (
    <main className={`game-mode-screen game-mode-screen--${selectedMode}`}>
      <div className="game-mode-screen__bg"/>
      <div className="game-mode-screen__overlay"/>

      <div className="game-mode-shell">
        <header className="game-mode-topbar">
          <div className="game-mode-brand">
            <div className="game-mode-brand__mark">TCV</div>

            <div>
              <strong>TheCareerValorant</strong>
              <span>COMPETITIVE CAREER SIMULATOR</span>
            </div>
          </div>

          <div className="game-mode-topbar__right">
            <GameSettingsControls/>
            <span className="game-mode-topbar__version">{language==="es"?"MODO CARRERA":"CAREER MODE"}</span>
          </div>
        </header>

        <section className="game-mode-feature">
          <div className="game-mode-feature__content" style={{"--feature-image":`url("${art.feature}")`} as React.CSSProperties}>
            <div className="game-mode-feature__art"/>
            <div className="game-mode-feature__shade"/>

            <div className="game-mode-feature__inner">
              <span className="game-mode-feature__eyebrow">{isPlayer?"PLAYER CAREER":"COACH CAREER"}</span>

              <h1>
                {isPlayer
                  ?language==="es"?"CONVIÉRTETE EN PRO":"BECOME A PRO"
                  :language==="es"?"CONSTRUYE TU LEGADO":"BUILD YOUR LEGACY"}
              </h1>

              <p>
                {isPlayer
                  ?language==="es"
                    ?"Empieza desde ranked, consigue contratos, compite en Challengers, llega al VCT y lucha por convertirte en campeón mundial."
                    :"Start in ranked, earn contracts, compete in Challengers, reach the VCT and fight to become a world champion."
                  :language==="es"
                    ?"Gestiona tu roster, desarrolla jugadores, prepara mapas, domina el mercado y dirige a tu equipo hacia Champions."
                    :"Manage your roster, develop players, prepare maps, master the market and lead your team toward Champions."}
              </p>

              <button className="game-mode-feature__play" onClick={playSelected}>
                {isPlayer
                  ?language==="es"?"INICIAR PLAYER CAREER":"START PLAYER CAREER"
                  :hasCoachSave
                    ?language==="es"?"CONTINUAR COACH CAREER":"CONTINUE COACH CAREER"
                    :language==="es"?"INICIAR COACH CAREER":"START COACH CAREER"}
                <b>→</b>
              </button>

              {!isPlayer&&hasCoachSave&&(
                <button className="game-mode-feature__secondary" onClick={onCoachCareer}>
                  {language==="es"?"NUEVA CARRERA":"NEW CAREER"}
                </button>
              )}
            </div>
          </div>

          <div className="game-mode-feature__visual" style={{"--side-image":`url("${art.side}")`} as React.CSSProperties}>
            <div className="game-mode-feature__visual-art"/>
            <div className="game-mode-feature__visual-shade"/>

            <div className="game-mode-feature__visual-label">
              <span>{isPlayer?"BECOME THE PLAYER":"BECOME THE COACH"}</span>
              <strong>{isPlayer?"PRO":"CHAMPION"}</strong>
            </div>
          </div>
        </section>

        <nav className="game-mode-nav">
          <button
            className={selectedMode==="player"?"game-mode-nav__item game-mode-nav__item--active":"game-mode-nav__item"}
            onMouseEnter={()=>setSelectedMode("player")}
            onClick={()=>setSelectedMode("player")}
          >
            <span>01</span>

            <div>
              <small>{language==="es"?"MODO CARRERA":"CAREER MODE"}</small>
              <strong>PLAYER CAREER</strong>
            </div>
          </button>

          <button
            className={selectedMode==="coach"?"game-mode-nav__item game-mode-nav__item--active":"game-mode-nav__item"}
            onMouseEnter={()=>setSelectedMode("coach")}
            onClick={()=>setSelectedMode("coach")}
          >
            <span>02</span>

            <div>
              <small>{language==="es"?"GESTIÓN":"MANAGEMENT"}</small>
              <strong>COACH CAREER</strong>
            </div>
          </button>

          {hasCoachSave&&(
            <button className="game-mode-nav__item game-mode-nav__item--continue" onClick={onContinueCoachCareer}>
              <span>▶</span>

              <div>
                <small>{language==="es"?"CARRERA GUARDADA":"SAVED CAREER"}</small>
                <strong>{language==="es"?"CONTINUAR":"CONTINUE"}</strong>
              </div>
            </button>
          )}
        </nav>
      </div>
    </main>
  );
}