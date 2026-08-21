import type {VCTStageBracketMatch,VCTStageBracketRound,VCTStageBracketState} from "../types/stage";
import {getTeamById} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";
import "../styles/VCTStage.css";

interface VCTStageBracketProps {
  bracket:VCTStageBracketState;
  playerTeamId?:string;
}

const UPPER:VCTStageBracketRound[] = ["Upper Round 1","Upper Semifinals","Upper Final","Grand Final"];
const LOWER:VCTStageBracketRound[] = ["Lower Round 1","Lower Round 2","Lower Round 3","Lower Final"];

export function VCTStageBracket({bracket,playerTeamId}:VCTStageBracketProps) {
  return (
    <section className="vct-stage-format">
      <header className="vct-stage-format__header">
        <div><span className="eyebrow">PLAYOFFS</span><h2>DOUBLE ELIMINATION</h2></div>
        <span>GRAND FINAL · BO5</span>
      </header>

      <BracketArea title="UPPER BRACKET" rounds={UPPER} bracket={bracket} playerTeamId={playerTeamId} />
      <BracketArea title="LOWER BRACKET" rounds={LOWER} bracket={bracket} playerTeamId={playerTeamId} />
    </section>
  );
}

function BracketArea({title,rounds,bracket,playerTeamId}:{title:string;rounds:VCTStageBracketRound[];bracket:VCTStageBracketState;playerTeamId?:string}) {
  return (
    <section className="vct-stage-bracket-area">
      <span>{title}</span>

      <div className="vct-stage-bracket-grid">
        {rounds.map((round) => (
          <div key={round} className="vct-stage-bracket-column">
            <strong>{round}</strong>
            {bracket.matches.filter((match) => match.round === round).map((match) => <BracketMatch key={match.id} match={match} playerTeamId={playerTeamId} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

function BracketMatch({match,playerTeamId}:{match:VCTStageBracketMatch;playerTeamId?:string}) {
  const playerMatch = match.teamAId === playerTeamId || match.teamBId === playerTeamId;

  return (
    <article className={`vct-stage-bracket-match ${playerMatch ? "vct-stage-bracket-match--player" : ""}`}>
      <TeamRow teamId={match.teamAId} score={match.scoreA} winner={Boolean(match.winnerId && match.winnerId === match.teamAId)} />
      <TeamRow teamId={match.teamBId} score={match.scoreB} winner={Boolean(match.winnerId && match.winnerId === match.teamBId)} />
    </article>
  );
}

function TeamRow({teamId,score,winner}:{teamId?:string;score?:number;winner:boolean}) {
  const team = getTeamById(teamId);
  const logo = getTeamLogo(team?.logo);

  return (
    <div className={winner ? "winner" : ""}>
      <div className="vct-stage-bracket-team">
        {logo ? <img src={logo} alt={team?.name ?? ""} /> : <span className="vct-stage-bracket-team__fallback">TBD</span>}
        <strong>{team?.shortName ?? "TBD"}</strong>
      </div>

      <span>{score ?? "-"}</span>
    </div>
  );
}