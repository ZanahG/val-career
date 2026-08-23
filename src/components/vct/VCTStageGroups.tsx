import {getTeamById} from "../../data/teams";
import {getTeamLogo} from "../../utils/teamLogo";
import type {VCTStageGroupsState,VCTStageStanding} from "../../types/stage";
import "../../styles/VCTStageGroups.css";

interface VCTStageGroupsProps {
  groups: VCTStageGroupsState;
  playerTeamId?: string;
}

export function VCTStageGroups({groups,playerTeamId}: VCTStageGroupsProps) {
  return (
    <section className="vct-stage-groups">
      <div className="vct-stage-groups__top">
        <div>
          <span className="eyebrow">GROUP STAGE</span>
          <h2>GROUPS</h2>
        </div>

        <span className="vct-stage-groups__note">TOP 4 → PLAYOFFS</span>
      </div>

      <div className="vct-stage-groups__grid">
        <StageGroupTable title="Group Alpha" standings={groups.groups.Alpha.standings} playerTeamId={playerTeamId} />
        <StageGroupTable title="Group Omega" standings={groups.groups.Omega.standings} playerTeamId={playerTeamId} />
      </div>
    </section>
  );
}

interface StageGroupTableProps {
  title: string;
  standings: VCTStageStanding[];
  playerTeamId?: string;
}

function StageGroupTable({title,standings,playerTeamId}: StageGroupTableProps) {
  return (
    <div className="vct-stage-group-table">
      <div className="vct-stage-group-table__header">
        <span>{title}</span>
        <span>REC</span>
        <span>MAP</span>
        <span>RND</span>
        <span>Δ</span>
      </div>

      <div className="vct-stage-group-table__body">
        {standings.map((entry,index) => {
          const team = getTeamById(entry.teamId);
          const logo = getTeamLogo(team?.logo);
          const isPlayer = entry.teamId === playerTeamId;
          const qualifies = index < 4;
          const roundDiff = entry.roundsWon - entry.roundsLost;

          return (
            <div key={entry.teamId} className={`vct-stage-group-row${isPlayer ? " vct-stage-group-row--player" : ""}${qualifies ? " vct-stage-group-row--qualified" : ""}`}>
              <div className="vct-stage-group-row__team">
                <span className="vct-stage-group-row__seed">{index + 1}</span>

                <div className="vct-stage-group-row__identity">
                  {logo ? (
                    <img className="vct-stage-group-row__logo" src={logo} alt={team?.name ?? entry.teamId} />
                  ) : (
                    <div className="vct-stage-group-row__logo-fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</div>
                  )}

                  <div className="vct-stage-group-row__text">
                    <strong>{team?.name ?? entry.teamId}</strong>
                    <small>{team?.country ?? ""}</small>
                  </div>
                </div>
              </div>

              <div className="vct-stage-group-row__stat">{entry.wins}-{entry.losses}</div>
              <div className="vct-stage-group-row__stat">{entry.mapsWon}/{entry.mapsLost}</div>
              <div className="vct-stage-group-row__stat">{entry.roundsWon}/{entry.roundsLost}</div>
              <div className={`vct-stage-group-row__diff${roundDiff > 0 ? " is-positive" : roundDiff < 0 ? " is-negative" : ""}`}>{roundDiff > 0 ? `+${roundDiff}` : roundDiff}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}