import type {CoachCareerState} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachMidseasonRecap.css";

interface CoachMidseasonRecapProps {
  career:CoachCareerState;
  onContinue:()=>void;
}

export function CoachMidseasonRecap({career,onContinue}:CoachMidseasonRecapProps) {
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
              <small>{yourTeam?.name??"Tu club"} · {career.coach.season}</small>
            </div>
          </div>

          <div className="coach-midseason-recap__status">
            <span>VENTANA</span>
            <strong>CERRADA</strong>
          </div>
        </header>

        <section className="coach-midseason-recap__hero">
          <div>
            <span>MID-SEASON TRANSFER WINDOW</span>
            <h1>MERCADO CERRADO</h1>
            <p>La ventana de mitad de temporada ha terminado. Estos son los movimientos confirmados antes de volver a competir.</p>
          </div>

          <div className="coach-midseason-recap__hero-badge">
            <span>{transfers.length}</span>
            <strong>MOVIMIENTOS</strong>
          </div>
        </section>

        <section className="coach-midseason-recap__summary">
          <SummaryCard label="MOVIMIENTOS TOTALES" value={transfers.length}/>
          <SummaryCard label="ALTAS" value={incomingMoves.length}/>
          <SummaryCard label="BAJAS" value={outgoingMoves.length}/>
          <SummaryCard label="GASTADO" value={formatMoney(totalSpent)}/>
          <SummaryCard label="RECIBIDO" value={formatMoney(totalReceived)}/>
        </section>

        <section className="coach-midseason-recap__main-grid">
          <section className="coach-midseason-recap__panel coach-midseason-recap__panel--club">
            <header className="coach-midseason-recap__panel-head">
              <div>
                <span>TU CLUB</span>
                <strong>{yourTeam?.name??"MOVIMIENTOS"}</strong>
              </div>

              <small>{yourMoves.length} MOVIMIENTO{yourMoves.length===1?"":"S"}</small>
            </header>

            <div className="coach-midseason-recap__list">
              {yourMoves.map((transfer,index)=>(
                <TransferRow
                  key={`${transfer.playerId}-${index}`}
                  transfer={transfer}
                  playerTeamId={playerTeamId}
                />
              ))}

              {!yourMoves.length&&(
                <EmptyState
                  title="SIN MOVIMIENTOS"
                  description="Tu club no realizó fichajes ni salidas durante esta ventana."
                />
              )}
            </div>
          </section>

          <section className="coach-midseason-recap__panel">
            <header className="coach-midseason-recap__panel-head">
              <div>
                <span>RESTO DEL VCT</span>
                <strong>TRANSFER ACTIVITY</strong>
              </div>

              <small>{cpuMoves.length} MOVIMIENTO{cpuMoves.length===1?"":"S"}</small>
            </header>

            <div className="coach-midseason-recap__list coach-midseason-recap__list--cpu">
              {cpuMoves.map((transfer,index)=>(
                <TransferRow
                  key={`${transfer.playerId}-${index}`}
                  transfer={transfer}
                  playerTeamId={playerTeamId}
                />
              ))}

              {!cpuMoves.length&&(
                <EmptyState
                  title="MERCADO TRANQUILO"
                  description="No se registraron movimientos entre clubes controlados por la CPU."
                />
              )}
            </div>
          </section>
        </section>

        <footer className="coach-midseason-recap__footer">
          <div>
            <span>PRÓXIMO PASO</span>
            <strong>VOLVER A LA COMPETICIÓN</strong>
          </div>

          <button onClick={onContinue}>
            CONTINUAR TEMPORADA <span>→</span>
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

function TransferRow({transfer,playerTeamId}:{transfer:{
  playerId:string;
  playerName:string;
  fromTeamId:string;
  toTeamId:string;
  salary:number;
  transferFee:number;
};playerTeamId:string}) {
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
          <span>{incoming?"FICHAJE":outgoing?"SALIDA":"TRANSFERENCIA"}</span>
          <strong>{transfer.playerName}</strong>
          <small>{formatMoney(transfer.salary)} / MES</small>
        </div>
      </div>

      <div className="coach-midseason-recap__route">
        <TeamBadge
          name={transfer.fromTeamId==="free-agent"?"FREE AGENT":fromTeam?.shortName??transfer.fromTeamId}
          logo={fromLogo}
        />

        <div className="coach-midseason-recap__route-arrow">
          <span>→</span>
        </div>

        <TeamBadge
          name={transfer.toTeamId==="free-agent"?"FREE AGENT":toTeam?.shortName??transfer.toTeamId}
          logo={toLogo}
        />
      </div>

      <div className="coach-midseason-recap__fee">
        <span>TRANSFER FEE</span>
        <strong>{transfer.transferFee>0?formatMoney(transfer.transferFee):"FREE"}</strong>
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

function formatMoney(value:number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}