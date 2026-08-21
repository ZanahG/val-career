import type {VCTMastersSwissState} from "../types/masters";
import {getTeamById} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";
import "../styles/VCTMasters.css";

interface VCTMastersSwissProps {
  swiss: VCTMastersSwissState;
  playerTeamId?: string;
}

export function VCTMastersSwiss({swiss,playerTeamId}: VCTMastersSwissProps) {
  return (
    <section className="masters-swiss">
      <div className="masters-swiss__header">
        <div>
          <span className="eyebrow">MASTERS</span>
          <h2>SWISS STAGE</h2>
        </div>

        <span className="masters-swiss__note">2 WINS → PLAYOFFS · 2 LOSSES → ELIMINATED</span>
      </div>

      <div className="masters-swiss-table">
        <div className="masters-swiss-table__header">
          <span>TEAM</span>
          <span>W</span>
          <span>L</span>
          <span>MAP</span>
          <span>RND</span>
          <span>Δ</span>
        </div>

        <div className="masters-swiss-table__body">
          {swiss.standings.map((entry,index) => {
            const team = getTeamById(entry.teamId);
            const logo = getTeamLogo(team?.logo);
            const isPlayer = entry.teamId === playerTeamId;
            const roundDiff = entry.roundsWon - entry.roundsLost;

            return (
              <div key={entry.teamId} className={`masters-swiss-row${entry.qualified ? " masters-swiss-row--qualified" : ""}${entry.eliminated ? " masters-swiss-row--eliminated" : ""}${isPlayer ? " masters-swiss-row--player" : ""}`}>
                <div className="masters-swiss-row__team">
                  <span className="masters-swiss-row__seed">{index + 1}</span>

                  {logo ? (
                    <img className="masters-swiss-row__logo" src={logo} alt={team?.name ?? entry.teamId} />
                  ) : (
                    <div className="masters-swiss-row__logo-fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</div>
                  )}

                  <div className="masters-swiss-row__text">
                    <strong>{team?.name ?? entry.teamId}</strong>
                    <small>{team?.country ?? ""}</small>
                  </div>
                </div>

                <strong>{entry.wins}</strong>
                <strong>{entry.losses}</strong>
                <span>{entry.mapsWon}/{entry.mapsLost}</span>
                <span>{entry.roundsWon}/{entry.roundsLost}</span>
                <b className={roundDiff > 0 ? "positive" : roundDiff < 0 ? "negative" : ""}>{roundDiff > 0 ? `+${roundDiff}` : roundDiff}</b>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}