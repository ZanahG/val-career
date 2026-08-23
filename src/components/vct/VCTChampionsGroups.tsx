import type {ChampionsGroup,ChampionsGroupMatch,VCTChampionsGroupsState} from "../../types/champions";
import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/VCTChampions.css";

interface VCTChampionsGroupsProps {
  state: VCTChampionsGroupsState;
  playerTeamId?: string;
}

export function VCTChampionsGroups({state,playerTeamId}: VCTChampionsGroupsProps) {
  return (
    <section className="champions-groups">
      <header className="champions-groups__header">
        <div>
          <span className="eyebrow">VALORANT CHAMPIONS</span>
          <h2>GROUP STAGE</h2>
        </div>

        <span className="champions-groups__note">2 TEAMS PER GROUP → PLAYOFFS</span>
      </header>

      <div className="champions-groups__grid">
        <ChampionsGroupCard group={state.groups.A} playerTeamId={playerTeamId} />
        <ChampionsGroupCard group={state.groups.B} playerTeamId={playerTeamId} />
        <ChampionsGroupCard group={state.groups.C} playerTeamId={playerTeamId} />
        <ChampionsGroupCard group={state.groups.D} playerTeamId={playerTeamId} />
      </div>
    </section>
  );
}

function ChampionsGroupCard({group,playerTeamId}: {group: ChampionsGroup; playerTeamId?: string}) {
  const opening = group.matches.filter((match) => match.round === "Opening");
  const winners = group.matches.find((match) => match.round === "Winners");
  const elimination = group.matches.find((match) => match.round === "Elimination");
  const decider = group.matches.find((match) => match.round === "Decider");

  return (
    <section className="champions-group">
      <header className="champions-group__title">
        <span>GROUP {group.id}</span>
        {group.complete && <strong>COMPLETE</strong>}
      </header>

      <div className="champions-group__bracket">
        <div className="champions-group-column champions-group-column--opening">
          <span className="champions-group-column__title">Opening</span>
          {opening.map((match) => <ChampionsMatch key={match.id} match={match} playerTeamId={playerTeamId} />)}
        </div>

        <div className="champions-group-column champions-group-column--middle">
          <div>
            <span className="champions-group-column__title">Winners</span>
            {winners && <ChampionsMatch match={winners} playerTeamId={playerTeamId} />}
          </div>

          <div>
            <span className="champions-group-column__title">Elimination</span>
            {elimination && <ChampionsMatch match={elimination} playerTeamId={playerTeamId} />}
          </div>
        </div>

        <div className="champions-group-column champions-group-column--decider">
          <div>
            <span className="champions-group-column__title">Qualified</span>
            <QualifiedTeam teamId={group.qualifiedTeamIds[0]} />
          </div>

          <div>
            <span className="champions-group-column__title">Decider</span>
            {decider && <ChampionsMatch match={decider} playerTeamId={playerTeamId} />}
          </div>

          <div>
            <span className="champions-group-column__title">Qualified</span>
            <QualifiedTeam teamId={group.qualifiedTeamIds[1]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChampionsMatch({match,playerTeamId}: {match: ChampionsGroupMatch; playerTeamId?: string}) {
  const containsPlayer = match.teamAId === playerTeamId || match.teamBId === playerTeamId;

  return (
    <article className={`champions-group-match${containsPlayer ? " champions-group-match--player" : ""}`}>
      <TeamRow teamId={match.teamAId} score={match.scoreA} winner={match.winnerId === match.teamAId} />
      <TeamRow teamId={match.teamBId} score={match.scoreB} winner={match.winnerId === match.teamBId} />

      <div className="champions-group-match__footer">
        <span>BO3</span>
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
    <div className={`champions-group-team${winner ? " champions-group-team--winner" : ""}`}>
      <div>
        {logo ? <img src={logo} alt={team?.name ?? "TBD"} /> : <span className="champions-group-team__fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</span>}
        <strong>{team?.name ?? "TBD"}</strong>
      </div>

      <b>{score ?? "-"}</b>
    </div>
  );
}

function QualifiedTeam({teamId}: {teamId?: string}) {
  const team = getTeamById(teamId);
  const logo = getTeamLogo(team?.logo);

  return (
    <div className={`champions-qualified${teamId ? " champions-qualified--active" : ""}`}>
      <div>
        {logo ? <img src={logo} alt={team?.name ?? "TBD"} /> : <span className="champions-qualified__fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</span>}
        <strong>{team?.name ?? "TBD"}</strong>
      </div>

      <b>{teamId ? "✓" : "-"}</b>
    </div>
  );
}