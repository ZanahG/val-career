import type {VCTTransfer} from "../../types/vctRosters";
import {TEAMS} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import {useGameSettings} from "../../context/GameSettingsContext";
import "../../styles/VCTOffseasonMoves.css";

interface VCTOffseasonMovesProps {
  season:number;
  transfers:VCTTransfer[];
  onContinue:()=>void;
}

export function VCTOffseasonMoves({season,transfers,onContinue}:VCTOffseasonMovesProps) {
  const {language}=useGameSettings();
  const seasonTransfers=transfers.filter(transfer=>transfer.season===season);
  const uniqueTeams=new Set(seasonTransfers.flatMap(transfer=>[transfer.from,transfer.to]).filter(Boolean)).size;

  return (
    <main className="vct-offseason-moves">
      <header className="vct-offseason-moves__topbar">
        <div className="vct-offseason-moves__brand">
          <div className="brand-mark brand-mark--small">TCV</div>
          <div>
            <strong>{language==="es"?"MERCADO VCT":"VCT MARKET"}</strong>
            <span>{language==="es"?"TEMPORADA BAJA":"OFFSEASON"}</span>
          </div>
        </div>

        <div className="vct-offseason-moves__season">
          <span>{language==="es"?"TEMPORADA":"SEASON"}</span>
          <strong>{season}</strong>
        </div>
      </header>

      <div className="vct-offseason-moves__content">
        <section className="vct-offseason-moves__hero">
          <div>
            <span className="eyebrow">VCT OFFSEASON</span>
            <h1>{season} {language==="es"?"MOVIMIENTOS DE MERCADO":"MARKET MOVES"}</h1>
            <p>
              {language==="es"
                ?"Revisa los principales cambios de plantilla antes de comenzar tu siguiente temporada."
                :"Review the key roster changes before starting your next season."}
            </p>
          </div>

          <div className="vct-offseason-moves__summary">
            <div>
              <span>{language==="es"?"FICHAJES":"MOVES"}</span>
              <strong>{seasonTransfers.length}</strong>
            </div>

            <div>
              <span>{language==="es"?"EQUIPOS":"TEAMS"}</span>
              <strong>{uniqueTeams}</strong>
            </div>
          </div>
        </section>

        <section className="vct-offseason-moves__panel">
          <header className="vct-offseason-moves__panel-header">
            <div>
              <span className="eyebrow">{language==="es"?"RESUMEN DE MERCADO":"MARKET RECAP"}</span>
              <h2>{language==="es"?"FICHAJES CONFIRMADOS":"CONFIRMED MOVES"}</h2>
            </div>

            <span className="vct-offseason-moves__count">
              {seasonTransfers.length} {language==="es"?"MOVIMIENTOS":"MOVES"}
            </span>
          </header>

          {seasonTransfers.length?(
            <div className="vct-offseason-moves__list">
              {seasonTransfers.map((transfer,index)=>{
                const fromTeam=getTeamByName(transfer.from);
                const toTeam=getTeamByName(transfer.to);
                const fromLogo=getTeamLogo(fromTeam?.logo);
                const toLogo=getTeamLogo(toTeam?.logo);

                return (
                  <article key={`${transfer.season}-${transfer.player}-${index}`} className="vct-offseason-move">
                    <div className="vct-offseason-move__index">{String(index+1).padStart(2,"0")}</div>

                    <div className="vct-offseason-move__player">
                      <span>{language==="es"?"JUGADOR":"PLAYER"}</span>
                      <strong>{transfer.player}</strong>
                    </div>

                    <div className="vct-offseason-move__route">
                      <div className="vct-offseason-move__team">
                        <div className="vct-offseason-move__logo">
                          {fromLogo?<img src={fromLogo} alt={fromTeam?.name??transfer.from}/>:<span>{fromTeam?.shortName??"FA"}</span>}
                        </div>

                        <div>
                          <strong>{transfer.from}</strong>
                        </div>
                      </div>

                      <div className="vct-offseason-move__arrow">
                        <span>→</span>
                      </div>

                      <div className="vct-offseason-move__team vct-offseason-move__team--destination">
                        <div className="vct-offseason-move__logo">
                          {toLogo?<img src={toLogo} alt={toTeam?.name??transfer.to}/>:<span>{toTeam?.shortName??"FA"}</span>}
                        </div>

                        <div>
                          <strong>{transfer.to}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ):(
            <div className="vct-offseason-moves__empty">
              <div className="vct-offseason-moves__empty-icon">—</div>
              <div>
                <strong>{language==="es"?"PLANTILLAS ESTABLES":"ROSTERS STABLE"}</strong>
                <span>{language==="es"?"No hubo movimientos importantes durante esta temporada baja.":"No major transfers were completed this offseason."}</span>
              </div>
            </div>
          )}
        </section>

        <footer className="vct-offseason-moves__footer">
          <div>
            <span>{language==="es"?"SIGUIENTE PASO":"NEXT STEP"}</span>
            <strong>{language==="es"?"DECIDE TU FUTURO":"DECIDE YOUR FUTURE"}</strong>
          </div>

          <button className="vct-offseason-moves__continue" onClick={onContinue}>
            <span>{language==="es"?"CONTINUAR AL MERCADO":"CONTINUE TO MARKET"}</span>
            <b>→</b>
          </button>
        </footer>
      </div>
    </main>
  );
}

function getTeamByName(name:string) {
  return TEAMS.find(team=>team.name===name);
}