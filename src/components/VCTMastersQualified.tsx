import type {MastersQualifiedTeam} from "../types/masters";
import type {CompetitiveCircuit} from "../types/career";
import {getTeamById} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";
import "../styles/VCTMasters.css";

interface VCTMastersQualifiedProps {
  teams: MastersQualifiedTeam[];
  playerTeamId?: string;
}

const CIRCUITS: CompetitiveCircuit[] = ["Americas","EMEA","Pacific","China"];

export function VCTMastersQualified({teams,playerTeamId}: VCTMastersQualifiedProps) {
  return (
    <section className="masters-qualified">
      <header className="masters-qualified__header">
        <div>
          <span className="eyebrow">MASTERS</span>
          <h2>QUALIFIED TEAMS</h2>
        </div>

        <span className="masters-qualified__note">12 TEAMS · 4 REGIONS</span>
      </header>

      <div className="masters-qualified__grid">
        {CIRCUITS.map((circuit) => {
          const circuitTeams = teams.filter((team) => team.circuit === circuit).sort((a,b) => a.seed - b.seed);

          return (
            <section key={circuit} className="masters-qualified-region">
              <header>
                <span>{circuit.toUpperCase()}</span>
              </header>

              <div className="masters-qualified-region__teams">
                {circuitTeams.map((entry) => {
                  const team = getTeamById(entry.teamId);
                  const logo = getTeamLogo(team?.logo);
                  const isPlayer = entry.teamId === playerTeamId;
                  const direct = entry.seed === 1;

                  return (
                    <div key={entry.teamId} className={`masters-qualified-team${isPlayer ? " masters-qualified-team--player" : ""}`}>
                      <span className="masters-qualified-team__seed">#{entry.seed}</span>

                      <div className="masters-qualified-team__identity">
                        {logo ? (
                          <img src={logo} alt={team?.name ?? entry.teamId} />
                        ) : (
                          <span className="masters-qualified-team__fallback">{team?.shortName?.slice(0,3) ?? "TBD"}</span>
                        )}

                        <div>
                          <strong>{team?.name ?? entry.teamId}</strong>
                          <small>{team?.country ?? ""}</small>
                        </div>
                      </div>

                      <span className={`masters-qualified-team__status${direct ? " masters-qualified-team__status--playoffs" : ""}`}>{direct ? "PLAYOFFS" : "SWISS"}</span>
                    </div>
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