import type {ChampionsQualifiedTeam} from "../types/champions";
import {getTeamById} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";

import "../styles/VCTChampions.css";

interface VCTChampionsQualifiedProps {
  teams: ChampionsQualifiedTeam[];
  playerTeamId?: string;
}

const CIRCUITS = ["Americas","EMEA","Pacific","China"] as const;

export function VCTChampionsQualified({teams,playerTeamId}: VCTChampionsQualifiedProps) {
  return (
    <section className="champions-qualified-list">
      <header className="champions-qualified-list__header">
        <div><span className="eyebrow">VALORANT CHAMPIONS</span><h2>QUALIFIED TEAMS</h2></div>
        <span>16 TEAMS · 4 PER CIRCUIT</span>
      </header>

      <div className="champions-qualified-list__grid">
        {CIRCUITS.map((circuit) => {
          const circuitTeams = teams.filter((entry) => entry.circuit === circuit).sort((a,b) => a.seed - b.seed);

          return (
            <section key={circuit} className="champions-qualified-region">
              <header><strong>{circuit.toUpperCase()}</strong><span>4 TEAMS</span></header>

              <div>
                {circuitTeams.map((entry) => {
                  const team = getTeamById(entry.teamId);
                  const logo = getTeamLogo(team?.logo);
                  const isPlayer = entry.teamId === playerTeamId;

                  return (
                    <article key={entry.teamId} className={`champions-qualified-team${isPlayer ? " champions-qualified-team--player" : ""}`}>
                      <span className="champions-qualified-team__seed">#{entry.seed}</span>
                      <div className="champions-qualified-team__identity">
                        {logo ? <img src={logo} alt={team?.name ?? entry.teamId} /> : <span className="champions-qualified-team__fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</span>}
                        <strong>{team?.name ?? entry.teamId}</strong>
                      </div>
                      {isPlayer && <b>YOU</b>}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}