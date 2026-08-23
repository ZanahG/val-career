import type {ChampionsBracketMatch,ChampionsBracketRound,VCTChampionsBracketState} from "../../types/champions";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/VCTChampions.css";

interface VCTChampionsBracketProps {
  bracket: VCTChampionsBracketState;
  playerTeamId?: string;
}

const UPPER_ROUNDS: ChampionsBracketRound[] = ["Upper Quarterfinals","Upper Semifinals","Upper Final","Grand Final"];
const LOWER_ROUNDS: ChampionsBracketRound[] = ["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"];

export function VCTChampionsBracket({bracket,playerTeamId}: VCTChampionsBracketProps) {
  return (
    <section className="champions-bracket">
      <header className="champions-bracket__header">
        <div>
          <span className="eyebrow">VALORANT CHAMPIONS</span>
          <h2>PLAYOFFS</h2>
        </div>

        <div className="champions-bracket__info">
          <span>DOUBLE ELIMINATION</span>
          <strong>LOWER FINAL + GRAND FINAL · BO5</strong>
        </div>
      </header>

      <BracketSection title="UPPER BRACKET" rounds={UPPER_ROUNDS} bracket={bracket} playerTeamId={playerTeamId} />
      <BracketSection title="LOWER BRACKET" rounds={LOWER_ROUNDS} bracket={bracket} playerTeamId={playerTeamId} />

      {bracket.complete && bracket.championId && (
        <div className="champions-bracket__champion">
          <span>WORLD CHAMPION</span>
          <TeamIdentity teamId={bracket.championId} />
        </div>
      )}
    </section>
  );
}

interface BracketSectionProps {
  title: string;
  rounds: ChampionsBracketRound[];
  bracket: VCTChampionsBracketState;
  playerTeamId?: string;
}

function BracketSection({title,rounds,bracket,playerTeamId}: BracketSectionProps) {
  return (
    <section className="champions-bracket-section">
      <span className="champions-bracket-section__title">{title}</span>

      <div className="champions-bracket-grid">
        {rounds.map((round) => {
          const matches = bracket.matches.filter((match) => match.round === round);

          return (
            <div key={round} className="champions-bracket-column">
              <strong className="champions-bracket-column__title">{round}</strong>

              <div className="champions-bracket-column__matches">
                {matches.length > 0
                  ? matches.map((match) => <BracketMatch key={match.id} match={match} playerTeamId={playerTeamId} />)
                  : <BracketPlaceholder />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BracketMatch({match,playerTeamId}: {match: ChampionsBracketMatch; playerTeamId?: string}) {
  const containsPlayer = match.teamAId === playerTeamId || match.teamBId === playerTeamId;

  return (
    <article className={`champions-bracket-match${containsPlayer ? " champions-bracket-match--player" : ""}`}>
      <TeamRow teamId={match.teamAId} score={match.scoreA} winner={match.winnerId === match.teamAId} />
      <TeamRow teamId={match.teamBId} score={match.scoreB} winner={match.winnerId === match.teamBId} />

      <div className="champions-bracket-match__footer">
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
    <div className={`champions-bracket-team${winner ? " champions-bracket-team--winner" : ""}`}>
      <div>
        {logo ? <img src={logo} alt={team?.name ?? "TBD"} /> : <span className="champions-bracket-team__fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</span>}
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
    <div className="champions-bracket__champion-team">
      {logo ? <img src={logo} alt={team?.name ?? teamId} /> : <span>{team?.shortName ?? "TBD"}</span>}
      <strong>{team?.name ?? teamId}</strong>
    </div>
  );
}

function BracketPlaceholder() {
  return (
    <article className="champions-bracket-match champions-bracket-match--placeholder">
      <div className="champions-bracket-team"><div><span className="champions-bracket-team__fallback">TBD</span><strong>TBD</strong></div><b>-</b></div>
      <div className="champions-bracket-team"><div><span className="champions-bracket-team__fallback">TBD</span><strong>TBD</strong></div><b>-</b></div>
    </article>
  );
}