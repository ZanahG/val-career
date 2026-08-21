import type {VCTBracketMatch, VCTBracketState} from "../types/vct";
import {getTeamById} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";
import "../styles/VCTBracket.css";

interface VCTBracketProps {
  bracket: VCTBracketState;
}

export function VCTBracket({bracket}: VCTBracketProps) {
  const sections = ["Upper","Middle","Lower"] as const;

  return (
    <section className="vct-bracket">
      <header className="vct-bracket__header">
        <div><span className="eyebrow">KICKOFF BRACKET</span><strong>TRIPLE ELIMINATION</strong></div>
        <div className="vct-bracket__qualification"><span>MASTERS</span><strong>{bracket.qualifiedTeamIds.length}/3</strong></div>
      </header>

      {sections.map((section) => {
        const sectionMatches = bracket.matches.filter((match) => match.section === section);
        const rounds = [...new Set(sectionMatches.map((match) => match.round))].sort((a,b) => a - b);

        return (
          <section key={section} className="vct-bracket-section">
            <span className="vct-bracket-section__title">{section.toUpperCase()} BRACKET</span>

            <div className="vct-bracket-rounds">
              {rounds.map((round) => {
                const matches = sectionMatches.filter((match) => match.round === round).sort((a,b) => a.order - b.order);

                return (
                  <div key={round} className="vct-bracket-round">
                    <strong className="vct-bracket-round__title">{matches[0]?.roundName}</strong>
                    <div className="vct-bracket-round__matches">{matches.map((match) => <BracketMatch key={match.id} match={match} playerTeamId={bracket.playerTeamId} />)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function BracketMatch({match, playerTeamId}: {match: VCTBracketMatch; playerTeamId: string}) {
  const playerMatch = match.teamAId === playerTeamId || match.teamBId === playerTeamId;

  return (
    <article className={`vct-bracket-match ${playerMatch ? "vct-bracket-match--player" : ""} ${match.status === "Ready" ? "vct-bracket-match--ready" : ""}`}>
      {playerMatch && match.status === "Ready" && <span className="vct-bracket-match__tag">YOUR MATCH</span>}
      <BracketTeam teamId={match.teamAId} score={match.scoreA} winner={match.winnerId === match.teamAId} />
      <BracketTeam teamId={match.teamBId} score={match.scoreB} winner={match.winnerId === match.teamBId} />
    </article>
  );
}

function BracketTeam({teamId, score, winner}: {teamId?: string; score?: number; winner: boolean}) {
  const team = getTeamById(teamId);
  const logo = getTeamLogo(team?.logo);

  return (
    <div className={`vct-bracket-team ${winner ? "vct-bracket-team--winner" : ""}`}>
      <div>{logo && <img src={logo} alt="" />}<span>{team?.name ?? "TBD"}</span></div>
      <strong>{score ?? "-"}</strong>
    </div>
  );
}