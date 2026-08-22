import type {VCTTransfer} from "../types/vctRosters";
import {TEAMS} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";
import "../styles/VCTOffseasonMoves.css";

interface VCTOffseasonMovesProps {
  season:number;
  transfers:VCTTransfer[];
  onContinue:() => void;
}

export function VCTOffseasonMoves({season,transfers,onContinue}:VCTOffseasonMovesProps) {
  const seasonTransfers = transfers.filter((transfer) => transfer.season === season);

  return (
    <main className="vct-offseason-moves">
      <header className="vct-offseason-moves__header">
        <div>
          <span className="eyebrow">VCT OFFSEASON</span>
          <h1>{season} MARKET MOVES</h1>
        </div>

        <button className="vct-offseason-moves__continue" onClick={onContinue}>CONTINUE TO MARKET →</button>
      </header>

      <section className="vct-offseason-moves__list">
        {seasonTransfers.length ? seasonTransfers.map((transfer,index) => {
          const fromTeam = getTeamByName(transfer.from);
          const toTeam = getTeamByName(transfer.to);
          const fromLogo = getTeamLogo(fromTeam?.logo);
          const toLogo = getTeamLogo(toTeam?.logo);

          return (
            <article key={`${transfer.season}-${transfer.player}-${index}`} className="vct-offseason-move">
              <strong className="vct-offseason-move__player">{transfer.player}</strong>

              <div className="vct-offseason-move__team">
                {fromLogo ? <img src={fromLogo} alt={fromTeam?.name ?? transfer.from} /> : <span>{fromTeam?.shortName ?? "FA"}</span>}
                <small>{transfer.from}</small>
              </div>

              <span className="vct-offseason-move__arrow">→</span>

              <div className="vct-offseason-move__team">
                {toLogo ? <img src={toLogo} alt={toTeam?.name ?? transfer.to} /> : <span>{toTeam?.shortName ?? "FA"}</span>}
                <small>{transfer.to}</small>
              </div>
            </article>
          );
        }) : (
          <div className="vct-offseason-moves__empty">
            <strong>ROSTERS STABLE</strong>
            <span>No major transfers this offseason.</span>
          </div>
        )}
      </section>
    </main>
  );
}

function getTeamByName(name:string) {
  return TEAMS.find((team) => team.name === name);
}