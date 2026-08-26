import type {CoachCareerState,CoachOffseasonTransfer} from "../../types/coach";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import type {ReactNode} from "react";
import "../../styles/CoachOffseasonRecap.css";

interface CoachOffseasonRecapProps {
  career:CoachCareerState;
  onContinue:()=>void;
}

export function CoachOffseasonRecap({career,onContinue}:CoachOffseasonRecapProps) {
  const offseason=career.offseason;
  const team=getTeamById(career.team.teamId);
  const logo=getTeamLogo(team?.logo);

  if(!offseason)return null;

  const playerTeamId=career.team.teamId;

  const signings=offseason.transfers.filter(transfer=>transfer.toTeamId===playerTeamId);
  const departures=offseason.transfers.filter(transfer=>transfer.fromTeamId===playerTeamId);
  const cpuTransfers=offseason.transfers.filter(transfer=>transfer.fromTeamId!==playerTeamId&&transfer.toTeamId!==playerTeamId);

  return (
    <main className="coach-offseason-recap">
      <div className="coach-offseason-recap__bg"/>
      <div className="coach-offseason-recap__overlay"/>

      <div className="coach-offseason-recap__shell">
        <header className="coach-offseason-recap__topbar">
          <div className="coach-offseason-recap__club">
            <div>
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TBD"}</span>}
            </div>

            <div>
              <span>OFFSEASON {offseason.season}</span>
              <strong>{team?.name??"Equipo"}</strong>
              <small>PREPARACIÓN TEMPORADA {offseason.season+1}</small>
            </div>
          </div>

          <span className="coach-offseason-recap__status">MERCADO CERRADO</span>
        </header>

        <section className="coach-offseason-recap__hero">
          <div>
            <span className="coach-offseason-recap__eyebrow">OFFSEASON REPORT</span>
            <h1>MOVIMIENTOS DEL MERCADO</h1>
            <p>La ventana de transferencias ha finalizado. Revisa cómo cambió tu plantilla y los movimientos realizados por los clubes VCT.</p>
          </div>

          <div className="coach-offseason-recap__summary">
            <SummaryStat label="FICHAJES" value={signings.length}/>
            <SummaryStat label="SALIDAS" value={departures.length}/>
            <SummaryStat label="RENOVACIONES" value={offseason.renewals.length}/>
          </div>
        </section>

        <section className="coach-offseason-recap__grid">
          <div className="coach-offseason-recap__column">
            <RecapSection title="TU EQUIPO" subtitle="RENOVACIONES">
              {offseason.renewals.length?(
                offseason.renewals.map(renewal=>(
                  <article key={renewal.playerId} className="coach-offseason-recap__renewal">
                    <div className="coach-offseason-recap__player-avatar">{renewal.playerName.slice(0,1).toUpperCase()}</div>

                    <div>
                      <strong>{renewal.playerName}</strong>
                      <span>RENOVACIÓN</span>
                    </div>

                    <div>
                      <strong>{renewal.seasons} {renewal.seasons===1?"AÑO":"AÑOS"}</strong>
                      <span>${renewal.salary.toLocaleString("en-US")} / MES</span>
                    </div>
                  </article>
                ))
              ):(
                <EmptyState text="No realizaste renovaciones."/>
              )}
            </RecapSection>

            <RecapSection title="TU EQUIPO" subtitle="FICHAJES">
              {signings.length?(
                signings.map(transfer=><TransferRow key={`${transfer.playerId}-${transfer.toTeamId}`} transfer={transfer}/>)
              ):(
                <EmptyState text="No realizaste fichajes."/>
              )}
            </RecapSection>

            <RecapSection title="TU EQUIPO" subtitle="SALIDAS">
              {departures.length?(
                departures.map(transfer=><TransferRow key={`${transfer.playerId}-${transfer.toTeamId}`} transfer={transfer}/>)
              ):(
                <EmptyState text="No hubo salidas durante la offseason."/>
              )}
            </RecapSection>
          </div>

          <div className="coach-offseason-recap__column">
            <RecapSection title="VCT" subtitle="TRANSFERENCIAS">
              {cpuTransfers.length?(
                <div className="coach-offseason-recap__transfer-feed">
                  {cpuTransfers.map((transfer,index)=><TransferRow key={`${transfer.playerId}-${transfer.fromTeamId}-${transfer.toTeamId}-${index}`} transfer={transfer}/>)}
                </div>
              ):(
                <EmptyState text="No se registraron movimientos entre los demás equipos."/>
              )}
            </RecapSection>

            <FinalRoster career={career}/>
          </div>
        </section>

        <button className="coach-offseason-recap__continue" onClick={onContinue}>
          CONTINUAR <span>→</span>
        </button>
      </div>
    </main>
  );
}

function RecapSection({title,subtitle,children}:{title:string;subtitle:string;children:ReactNode}) {
  return (
    <section className="coach-offseason-recap__section">
      <header>
        <span>{title}</span>
        <strong>{subtitle}</strong>
      </header>

      <div className="coach-offseason-recap__section-content">
        {children}
      </div>
    </section>
  );
}

function TransferRow({transfer}:{transfer:CoachOffseasonTransfer}) {
  const fromTeam=getTeamById(transfer.fromTeamId);
  const toTeam=getTeamById(transfer.toTeamId);
  const fromLogo=getTeamLogo(fromTeam?.logo);
  const toLogo=getTeamLogo(toTeam?.logo);

  return (
    <article className="coach-offseason-recap__transfer">
      <div className="coach-offseason-recap__player-avatar">{transfer.playerName.slice(0,1).toUpperCase()}</div>

      <div className="coach-offseason-recap__transfer-player">
        <strong>{transfer.playerName}</strong>
        <span>${transfer.salary.toLocaleString("en-US")} / MES</span>
      </div>

      <TeamBadge teamId={transfer.fromTeamId} logo={fromLogo} shortName={fromTeam?.shortName}/>

      <span className="coach-offseason-recap__arrow">→</span>

      <TeamBadge teamId={transfer.toTeamId} logo={toLogo} shortName={toTeam?.shortName}/>
    </article>
  );
}

function TeamBadge({teamId,logo,shortName}:{teamId:string;logo?:string;shortName?:string}) {
  const freeAgent=teamId==="free-agent";

  return (
    <div className="coach-offseason-recap__team-badge">
      <div>{!freeAgent&&logo?<img src={logo} alt=""/>:<span>{freeAgent?"FA":shortName?.slice(0,2)??"?"}</span>}</div>
      <strong>{freeAgent?"FREE AGENT":shortName??"TBD"}</strong>
    </div>
  );
}

function FinalRoster({career}:{career:CoachCareerState}) {
  const roster=[...career.team.roster].sort((a,b)=>b.overall-a.overall);

  return (
    <section className="coach-offseason-recap__section">
      <header>
        <span>{career.coach.season+1}</span>
        <strong>PLANTILLA FINAL</strong>
      </header>

      <div className="coach-offseason-recap__roster">
        {roster.map(player=>(
          <article key={player.id}>
            <div className="coach-offseason-recap__player-avatar">{player.ign.slice(0,1).toUpperCase()}</div>

            <div>
              <strong>{player.ign}</strong>
              <span>{getRoleLabel(player.role)}</span>
            </div>

            <strong className="coach-offseason-recap__overall">{player.overall}</strong>

            <div>
              <strong>{player.contractSeasonsRemaining??"-"}A</strong>
              <span>CONTRATO</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SummaryStat({label,value}:{label:string;value:number}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({text}:{text:string}) {
  return <div className="coach-offseason-recap__empty">{text}</div>;
}

function getRoleLabel(role:string) {
  if(role==="Duelist")return "DUELISTA";
  if(role==="Initiator")return "INICIADOR";
  if(role==="Controller")return "CONTROLADOR";
  if(role==="Sentinel")return "CENTINELA";
  if(role==="IGL")return "IGL";
  return "FLEX";
}