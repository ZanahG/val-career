import type {MastersBracketMatch,MastersBracketRound,VCTMastersBracketState} from "../../types/masters";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/VCTMasters.css";

interface VCTMastersBracketProps {
  bracket: VCTMastersBracketState;
  playerTeamId?: string;
}

const UPPER_ROUNDS: MastersBracketRound[] = ["Upper Quarterfinals","Upper Semifinals","Upper Final","Grand Final"];
const LOWER_ROUNDS: MastersBracketRound[] = ["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"];

export function VCTMastersBracket({bracket,playerTeamId}: VCTMastersBracketProps) {
  return (
    <section className="masters-bracket">
      <header className="masters-bracket__header">
        <div>
          <span className="eyebrow">MASTERS PLAYOFFS</span>
          <h2>DOUBLE ELIMINATION</h2>
        </div>

        <div className="masters-bracket__info">
          <span>BO3</span>
          <strong>LOWER FINAL + GRAND FINAL · BO5</strong>
        </div>
      </header>

      <BracketSection title="UPPER BRACKET" rounds={UPPER_ROUNDS} bracket={bracket} playerTeamId={playerTeamId} />
      <BracketSection title="LOWER BRACKET" rounds={LOWER_ROUNDS} bracket={bracket} playerTeamId={playerTeamId} />

      {bracket.complete && bracket.championId && (
        <div className="masters-bracket__champion">
          <span>MASTERS CHAMPION</span>
          <TeamIdentity teamId={bracket.championId} />
        </div>
      )}
    </section>
  );
}

interface BracketSectionProps {
  title: string;
  rounds: MastersBracketRound[];
  bracket: VCTMastersBracketState;
  playerTeamId?: string;
}

function BracketSection({title,rounds,bracket,playerTeamId}: BracketSectionProps) {
  return (
    <section className="masters-bracket-section">
      <span className="masters-bracket-section__title">{title}</span>

      <div className={`masters-bracket-grid masters-bracket-grid--${rounds.length}`}>
        {rounds.map((round) => {
          const matches = bracket.matches.filter((match) => match.round === round);

          return (
            <div key={round} className={`masters-bracket-column masters-bracket-column--${getRoundSlug(round)}`}>
              <strong className="masters-bracket-column__title">{round}</strong>

              <div className="masters-bracket-column__matches">
                {matches.length > 0 ? (
                  matches.map((match) => <BracketMatch key={match.id} match={match} playerTeamId={playerTeamId} />)
                ) : (
                  <BracketPlaceholder />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BracketMatch({match,playerTeamId}: {match: MastersBracketMatch; playerTeamId?: string}) {
  const containsPlayer = match.teamAId === playerTeamId || match.teamBId === playerTeamId;

  return (
    <article className={`masters-bracket-match${containsPlayer ? " masters-bracket-match--player" : ""}`}>
      <TeamRow teamId={match.teamAId} score={match.scoreA} winner={match.winnerId === match.teamAId} />
      <TeamRow teamId={match.teamBId} score={match.scoreB} winner={match.winnerId === match.teamBId} />

      <div className="masters-bracket-match__footer">
        <span>{match.bestOf === 5 ? "BO5" : "BO3"}</span>
        {containsPlayer && !match.played && <strong>YOUR MATCH</strong>}
        {match.played && <strong>FINAL</strong>}
      </div>
    </article>
  );
}

function TeamRow({teamId,score,winner}: {teamId?: string; score?: number; winner: boolean}) {
  const team = getTeamById(teamId);
  const logo = getTeamLogo(team?.logo);

  return (
    <div className={`masters-bracket-team${winner ? " masters-bracket-team--winner" : ""}`}>
      <div>
        {logo ? <img src={logo} alt={team?.name ?? "TBD"} /> : <span className="masters-bracket-team__fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</span>}
        <strong>{team?.name ?? "TBD"}</strong>
      </div>

      <b>{score ?? "-"}</b>
    </div>
  );
}

function TeamIdentity({teamId}: {teamId: string}) {
  const team = getTeamById(teamId);
  const logo = getTeamLogo(team?.logo);

  return (
    <div className="masters-bracket__champion-team">
      {logo ? <img src={logo} alt={team?.name ?? teamId} /> : <span>{team?.shortName ?? "TBD"}</span>}
      <strong>{team?.name ?? teamId}</strong>
    </div>
  );
}

function BracketPlaceholder() {
  return (
    <article className="masters-bracket-match masters-bracket-match--placeholder">
      <div className="masters-bracket-team"><div><span className="masters-bracket-team__fallback">TBD</span><strong>TBD</strong></div><b>-</b></div>
      <div className="masters-bracket-team"><div><span className="masters-bracket-team__fallback">TBD</span><strong>TBD</strong></div><b>-</b></div>
    </article>
  );
}

function getRoundSlug(round: MastersBracketRound) {
  return round.toLowerCase().replaceAll(" ","-");
}