import type {CoachCareerState} from "../../types/coach";
import type {GameCurrency} from "../../types/settings";
import {getTeamById} from "../../data/teams";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import {formatCurrency} from "../../utils/currency";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMidseasonRecap.css";

interface CoachMidseasonRecapProps {
  career:CoachCareerState;
  onContinue:()=>void;
}

type Language="es"|"en";

export function CoachMidseasonRecap({career,onContinue}:CoachMidseasonRecapProps) {
  const {language,currency}=useGameSettings();
  const es=language==="es";

  const market=career.midseasonMarket;
  const transfers=market?.transfers??[];
  const playerTeamId=career.team.teamId;
  const yourTeam=getTeamById(playerTeamId);
  const yourTeamLogo=getTeamLogo(yourTeam?.logo);

  const yourMoves=transfers.filter(transfer=>
    transfer.fromTeamId===playerTeamId||
    transfer.toTeamId===playerTeamId
  );

  const cpuMoves=transfers.filter(transfer=>
    transfer.fromTeamId!==playerTeamId&&
    transfer.toTeamId!==playerTeamId
  );

  const incomingMoves=yourMoves.filter(transfer=>transfer.toTeamId===playerTeamId);
  const outgoingMoves=yourMoves.filter(transfer=>transfer.fromTeamId===playerTeamId);
  const totalSpent=incomingMoves.reduce((total,transfer)=>total+transfer.transferFee,0);
  const totalReceived=outgoingMoves.reduce((total,transfer)=>total+transfer.transferFee,0);

  return (
    <main className="coach-midseason-recap">
      <div className="coach-midseason-recap__bg"/>
      <div className="coach-midseason-recap__overlay"/>

      <div className="coach-midseason-recap__shell">
        <header className="coach-midseason-recap__topbar">
          <div className="coach-midseason-recap__brand">
            <div className="coach-midseason-recap__brand-logo">
              {yourTeamLogo?<img src={yourTeamLogo} alt={yourTeam?.name??""}/>:<span>{yourTeam?.shortName??"TCV"}</span>}
            </div>

            <div>
              <span>TRANSFER NETWORK</span>
              <strong>MID-SEASON REPORT</strong>
              <small>{yourTeam?.name??(es?"Tu club":"Your club")} · {career.coach.season}</small>
            </div>
          </div>

          <div className="coach-midseason-recap__topbar-actions">
            <GameSettingsControls/>

            <div className="coach-midseason-recap__status">
              <span>{es?"VENTANA":"WINDOW"}</span>
              <strong>{es?"CERRADA":"CLOSED"}</strong>
            </div>
          </div>
        </header>

        <section className="coach-midseason-recap__hero">
          <div>
            <span>MID-SEASON TRANSFER WINDOW</span>
            <h1>{es?"MERCADO CERRADO":"TRANSFER WINDOW CLOSED"}</h1>
            <p>
              {es
                ?"La ventana de mitad de temporada ha terminado. Estos son los movimientos confirmados antes de volver a competir."
                :"The mid-season transfer window has ended. These are the confirmed moves before returning to competition."}
            </p>
          </div>

          <div className="coach-midseason-recap__hero-badge">
            <span>{transfers.length}</span>
            <strong>{es?"MOVIMIENTOS":"MOVES"}</strong>
          </div>
        </section>

        <section className="coach-midseason-recap__summary">
          <SummaryCard label={es?"MOVIMIENTOS TOTALES":"TOTAL MOVES"} value={transfers.length}/>
          <SummaryCard label={es?"ALTAS":"ARRIVALS"} value={incomingMoves.length}/>
          <SummaryCard label={es?"BAJAS":"DEPARTURES"} value={outgoingMoves.length}/>
          <SummaryCard label={es?"GASTADO":"SPENT"} value={formatCurrency(totalSpent,currency)}/>
          <SummaryCard label={es?"RECIBIDO":"RECEIVED"} value={formatCurrency(totalReceived,currency)}/>
        </section>

        <section className="coach-midseason-recap__main-grid">
          <section className="coach-midseason-recap__panel coach-midseason-recap__panel--club">
            <header className="coach-midseason-recap__panel-head">
              <div>
                <span>{es?"TU CLUB":"YOUR CLUB"}</span>
                <strong>{yourTeam?.name??(es?"MOVIMIENTOS":"MOVES")}</strong>
              </div>

              <small>{formatMoveCount(yourMoves.length,language)}</small>
            </header>

            <div className="coach-midseason-recap__list">
              {yourMoves.map((transfer,index)=>(
                <TransferRow
                  key={`${transfer.playerId}-${index}`}
                  transfer={transfer}
                  playerTeamId={playerTeamId}
                  language={language}
                  currency={currency}
                />
              ))}

              {!yourMoves.length&&(
                <EmptyState
                  title={es?"SIN MOVIMIENTOS":"NO MOVES"}
                  description={es?"Tu club no realizó fichajes ni salidas durante esta ventana.":"Your club made no signings or departures during this window."}
                />
              )}
            </div>
          </section>

          <section className="coach-midseason-recap__panel">
            <header className="coach-midseason-recap__panel-head">
              <div>
                <span>{es?"RESTO DEL VCT":"REST OF VCT"}</span>
                <strong>TRANSFER ACTIVITY</strong>
              </div>

              <small>{formatMoveCount(cpuMoves.length,language)}</small>
            </header>

            <div className="coach-midseason-recap__list coach-midseason-recap__list--cpu">
              {cpuMoves.map((transfer,index)=>(
                <TransferRow
                  key={`${transfer.playerId}-${index}`}
                  transfer={transfer}
                  playerTeamId={playerTeamId}
                  language={language}
                  currency={currency}
                />
              ))}

              {!cpuMoves.length&&(
                <EmptyState
                  title={es?"MERCADO TRANQUILO":"QUIET MARKET"}
                  description={es?"No se registraron movimientos entre clubes controlados por la CPU.":"No transfers were recorded between CPU-controlled clubs."}
                />
              )}
            </div>
          </section>
        </section>

        <footer className="coach-midseason-recap__footer">
          <div>
            <span>{es?"PRÓXIMO PASO":"NEXT STEP"}</span>
            <strong>{es?"VOLVER A LA COMPETICIÓN":"RETURN TO COMPETITION"}</strong>
          </div>

          <button onClick={onContinue}>
            {es?"CONTINUAR TEMPORADA":"CONTINUE SEASON"} <span>→</span>
          </button>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({label,value}:{label:string;value:string|number}) {
  return (
    <article className="coach-midseason-recap__summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TransferRow({transfer,playerTeamId,language,currency}:{transfer:{
  playerId:string;
  playerName:string;
  fromTeamId:string;
  toTeamId:string;
  salary:number;
  transferFee:number;
};playerTeamId:string;language:Language;currency:GameCurrency}) {
  const es=language==="es";

  const fromTeam=getTeamById(transfer.fromTeamId);
  const toTeam=getTeamById(transfer.toTeamId);
  const fromLogo=getTeamLogo(fromTeam?.logo);
  const toLogo=getTeamLogo(toTeam?.logo);

  const incoming=transfer.toTeamId===playerTeamId;
  const outgoing=transfer.fromTeamId===playerTeamId;

  return (
    <article className={`coach-midseason-recap__transfer${incoming?" coach-midseason-recap__transfer--incoming":outgoing?" coach-midseason-recap__transfer--outgoing":""}`}>
      <div className="coach-midseason-recap__player">
        <div className="coach-midseason-recap__avatar">{transfer.playerName.slice(0,1).toUpperCase()}</div>

        <div>
          <span>
            {incoming
              ?es?"FICHAJE":"SIGNING"
              :outgoing
                ?es?"SALIDA":"DEPARTURE"
                :es?"TRANSFERENCIA":"TRANSFER"}
          </span>

          <strong>{transfer.playerName}</strong>
          <small>{formatCurrency(transfer.salary,currency)} / {es?"MES":"MONTH"}</small>
        </div>
      </div>

      <div className="coach-midseason-recap__route">
        <TeamBadge
          name={transfer.fromTeamId==="free-agent"?(es?"AGENTE LIBRE":"FREE AGENT"):fromTeam?.shortName??transfer.fromTeamId}
          logo={fromLogo}
        />

        <div className="coach-midseason-recap__route-arrow">
          <span>→</span>
        </div>

        <TeamBadge
          name={transfer.toTeamId==="free-agent"?(es?"AGENTE LIBRE":"FREE AGENT"):toTeam?.shortName??transfer.toTeamId}
          logo={toLogo}
        />
      </div>

      <div className="coach-midseason-recap__fee">
        <span>TRANSFER FEE</span>
        <strong>{transfer.transferFee>0?formatCurrency(transfer.transferFee,currency):(es?"GRATIS":"FREE")}</strong>
      </div>
    </article>
  );
}

function TeamBadge({name,logo}:{name:string;logo?:string}) {
  return (
    <div className="coach-midseason-recap__team">
      <div className="coach-midseason-recap__team-logo">
        {logo?<img src={logo} alt=""/>:<span>{name.slice(0,2)}</span>}
      </div>

      <strong>{name}</strong>
    </div>
  );
}

function EmptyState({title,description}:{title:string;description:string}) {
  return (
    <div className="coach-midseason-recap__empty">
      <div>—</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function formatMoveCount(count:number,language:Language) {
  if(language==="es")return `${count} ${count===1?"MOVIMIENTO":"MOVIMIENTOS"}`;
  return `${count} ${count===1?"MOVE":"MOVES"}`;
}