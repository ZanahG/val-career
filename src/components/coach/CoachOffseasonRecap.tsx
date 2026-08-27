import type {ReactNode} from "react";
import type {CoachCareerState,CoachOffseasonTransfer,CoachPlayer} from "../../types/coach";
import type {GameCurrency} from "../../types/settings";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import {formatCurrency} from "../../utils/currency";
import {useGameSettings} from "../../context/GameSettingsContext";
import {GameSettingsControls} from "../shared/GameSettingsControls";
import "../../styles/CoachOffseasonRecap.css";

interface CoachOffseasonRecapProps {
  career:CoachCareerState;
  onContinue:()=>void;
}

type Language="es"|"en";

export function CoachOffseasonRecap({career,onContinue}:CoachOffseasonRecapProps) {
  const {language,currency}=useGameSettings();
  const es=language==="es";
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
          <div className="coach-offseason-recap__brand">
            <div className="coach-offseason-recap__brand-mark">
              {logo?<img src={logo} alt={team?.name??""}/>:<span>{team?.shortName??"TCV"}</span>}
            </div>

            <div>
              <span>COACH CAREER · OFFSEASON {offseason.season}</span>
              <strong>{team?.name??"TEAM"}</strong>
            </div>
          </div>

          <div className="coach-offseason-recap__topbar-right">
            <div className="coach-offseason-recap__status">
              <i/>
              <span>{es?"MERCADO CERRADO":"WINDOW CLOSED"}</span>
            </div>

            <GameSettingsControls/>
          </div>
        </header>

        <section className="coach-offseason-recap__hero">
          <div className="coach-offseason-recap__hero-copy">
            <span className="coach-offseason-recap__eyebrow">{es?"INFORME DE OFFSEASON":"OFFSEASON REPORT"}</span>

            <h1>{es?"VENTANA DE TRANSFERENCIAS":"TRANSFER WINDOW"}</h1>

            <p>
              {es
                ?`La preparación para la temporada ${offseason.season+1} ha finalizado. Revisa los cambios de tu plantilla y los principales movimientos del mercado.`
                :`Preparation for the ${offseason.season+1} season is complete. Review your roster changes and the biggest moves across the market.`}
            </p>
          </div>

          <div className="coach-offseason-recap__summary">
            <SummaryStat index="01" label={es?"FICHAJES":"SIGNINGS"} value={signings.length}/>
            <SummaryStat index="02" label={es?"SALIDAS":"DEPARTURES"} value={departures.length}/>
            <SummaryStat index="03" label={es?"RENOVACIONES":"RENEWALS"} value={offseason.renewals.length}/>
          </div>
        </section>

        <div className="coach-offseason-recap__section-label">
          <span>01</span>
          <strong>{es?"TU CLUB":"YOUR CLUB"}</strong>
          <i/>
        </div>

        <section className="coach-offseason-recap__club-grid">
          <RecapSection title={es?"RENOVACIONES":"RENEWALS"} count={offseason.renewals.length}>
            {offseason.renewals.length?(
              offseason.renewals.map(renewal=>(
                <article key={renewal.playerId} className="coach-offseason-recap__renewal">
                  <PlayerAvatar name={renewal.playerName}/>

                  <div className="coach-offseason-recap__renewal-player">
                    <span>{es?"RENOVACIÓN":"RENEWAL"}</span>
                    <strong>{renewal.playerName}</strong>
                  </div>

                  <div className="coach-offseason-recap__renewal-contract">
                    <span>{formatYears(renewal.seasons,language)}</span>
                    <strong>{formatCurrency(renewal.salary,currency)} <small>/ {es?"MES":"MONTH"}</small></strong>
                  </div>
                </article>
              ))
            ):(
              <EmptyState text={es?"No realizaste renovaciones.":"No contract renewals were completed."}/>
            )}
          </RecapSection>

          <RecapSection title={es?"FICHAJES":"SIGNINGS"} count={signings.length}>
            {signings.length?(
              signings.map((transfer,index)=>(
                <TransferRow key={`${transfer.playerId}-${transfer.toTeamId}-${index}`} transfer={transfer} language={language} currency={currency}/>
              ))
            ):(
              <EmptyState text={es?"No realizaste fichajes.":"No players were signed."}/>
            )}
          </RecapSection>

          <RecapSection title={es?"SALIDAS":"DEPARTURES"} count={departures.length}>
            {departures.length?(
              departures.map((transfer,index)=>(
                <TransferRow key={`${transfer.playerId}-${transfer.toTeamId}-${index}`} transfer={transfer} language={language} currency={currency}/>
              ))
            ):(
              <EmptyState text={es?"No hubo salidas.":"No players left the club."}/>
            )}
          </RecapSection>
        </section>

        <div className="coach-offseason-recap__section-label">
          <span>02</span>
          <strong>{es?"MERCADO GLOBAL":"GLOBAL MARKET"}</strong>
          <i/>
        </div>

        <section className="coach-offseason-recap__world-grid">
          <RecapSection title={es?"TRANSFERENCIAS VCT":"VCT TRANSFERS"} count={cpuTransfers.length} large>
            {cpuTransfers.length?(
              <div className="coach-offseason-recap__transfer-feed">
                {cpuTransfers.map((transfer,index)=>(
                  <TransferRow key={`${transfer.playerId}-${transfer.fromTeamId}-${transfer.toTeamId}-${index}`} transfer={transfer} language={language} currency={currency}/>
                ))}
              </div>
            ):(
              <EmptyState text={es?"No hubo movimientos entre otros clubes.":"No moves were recorded between other clubs."}/>
            )}
          </RecapSection>

          <FinalRoster career={career} language={language} currency={currency}/>
        </section>

        <footer className="coach-offseason-recap__footer">
          <div>
            <span>{es?"PRÓXIMO":"NEXT"}</span>
            <strong>{es?`TEMPORADA ${offseason.season+1}`:`SEASON ${offseason.season+1}`}</strong>
          </div>

          <button className="coach-offseason-recap__continue" onClick={onContinue}>
            <span>{es?"CONTINUAR":"CONTINUE"}</span>
            <b>→</b>
          </button>
        </footer>
      </div>
    </main>
  );
}

function RecapSection({title,count,children,large=false}:{title:string;count:number;children:ReactNode;large?:boolean}) {
  return (
    <section className={`coach-offseason-recap__section${large?" coach-offseason-recap__section--large":""}`}>
      <header>
        <strong>{title}</strong>
        <span>{String(count).padStart(2,"0")}</span>
      </header>

      <div className="coach-offseason-recap__section-content">
        {children}
      </div>
    </section>
  );
}

function TransferRow({transfer,language,currency}:{transfer:CoachOffseasonTransfer;language:Language;currency:GameCurrency}) {
  const es=language==="es";
  const fromTeam=getTeamById(transfer.fromTeamId);
  const toTeam=getTeamById(transfer.toTeamId);
  const fromLogo=getTeamLogo(fromTeam?.logo);
  const toLogo=getTeamLogo(toTeam?.logo);

  return (
    <article className="coach-offseason-recap__transfer">
      <PlayerAvatar name={transfer.playerName}/>

      <div className="coach-offseason-recap__transfer-player">
        <strong>{transfer.playerName}</strong>
        <span>{formatCurrency(transfer.salary,currency)} / {es?"MES":"MONTH"}</span>
      </div>

      <TeamBadge teamId={transfer.fromTeamId} logo={fromLogo} shortName={fromTeam?.shortName}/>

      <div className="coach-offseason-recap__transfer-arrow">→</div>

      <TeamBadge teamId={transfer.toTeamId} logo={toLogo} shortName={toTeam?.shortName}/>
    </article>
  );
}

function TeamBadge({teamId,logo,shortName}:{teamId:string;logo?:string;shortName?:string}) {
  const freeAgent=teamId==="free-agent";

  return (
    <div className="coach-offseason-recap__team-badge">
      <div className="coach-offseason-recap__team-logo">
        {!freeAgent&&logo?<img src={logo} alt=""/>:<span>{freeAgent?"FA":shortName?.slice(0,2)??"?"}</span>}
      </div>

      <strong>{freeAgent?"FREE AGENT":shortName??"TBD"}</strong>
    </div>
  );
}

function FinalRoster({career,language,currency}:{career:CoachCareerState;language:Language;currency:GameCurrency}) {
  const es=language==="es";
  const roster=[...career.team.roster].sort((a,b)=>b.overall-a.overall);

  return (
    <section className="coach-offseason-recap__section coach-offseason-recap__roster-section">
      <header>
        <strong>{es?"PLANTILLA FINAL":"FINAL ROSTER"}</strong>
        <span>{roster.length}/5</span>
      </header>

      <div className="coach-offseason-recap__roster">
        {roster.map((player,index)=>(
          <article key={player.id}>
            <span className="coach-offseason-recap__roster-index">{String(index+1).padStart(2,"0")}</span>

            <PlayerAvatar name={player.ign}/>

            <div className="coach-offseason-recap__roster-player">
              <strong>{player.ign}</strong>
              <span>{getRoleLabel(player,language)}</span>
            </div>

            <div className="coach-offseason-recap__roster-overall">
              <span>OVR</span>
              <strong>{player.overall}</strong>
            </div>

            <div className="coach-offseason-recap__roster-contract">
              <span>{es?"CONTRATO":"CONTRACT"}</span>
              <strong>{formatYears(player.contractSeasonsRemaining??0,language)}</strong>
            </div>

            <div className="coach-offseason-recap__roster-salary">
              <span>{es?"SALARIO":"SALARY"}</span>
              <strong>{formatCurrency(player.salary,currency)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlayerAvatar({name}:{name:string}) {
  return <div className="coach-offseason-recap__player-avatar">{name.slice(0,1).toUpperCase()}</div>;
}

function SummaryStat({index,label,value}:{index:string;label:string;value:number}) {
  return (
    <div className="coach-offseason-recap__summary-stat">
      <span>{index}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EmptyState({text}:{text:string}) {
  return (
    <div className="coach-offseason-recap__empty">
      <span>—</span>
      <strong>{text}</strong>
    </div>
  );
}

function getRoleLabel(player:CoachPlayer,language:Language) {
  const role=
    language==="es"
      ?player.role==="Duelist"?"DUELISTA"
        :player.role==="Initiator"?"INICIADOR"
          :player.role==="Controller"?"CONTROLADOR"
            :player.role==="Sentinel"?"CENTINELA"
              :"FLEX"
      :player.role.toUpperCase();

  return `${role}${player.isIGL?" · IGL":""}`;
}

function formatYears(years:number,language:Language) {
  if(language==="es")return `${years} ${years===1?"AÑO":"AÑOS"}`;
  return `${years} ${years===1?"YEAR":"YEARS"}`;
}