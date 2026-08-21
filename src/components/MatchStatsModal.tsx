import {useState} from "react";
import type {MatchBoxScore, MatchPlayerStats} from "../types/matchStats";
import {getTeamById} from "../data/teams";
import {getTeamLogo} from "../utils/teamLogo";
import {getAgentIcon} from "../utils/agentIcons";
import "../styles/MatchStatsModal.css";

interface MatchStatsModalProps {
  match: MatchBoxScore;
  playerTeamId?: string;
  onClose: () => void;
}

export function MatchStatsModal({match, playerTeamId, onClose}: MatchStatsModalProps) {
  const [selectedMap,setSelectedMap] = useState<number | "all">("all");

  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);
  const teamALogo = getTeamLogo(teamA?.logo);
  const teamBLogo = getTeamLogo(teamB?.logo);

  const map = selectedMap === "all" ? undefined : match.maps.find((item) => item.mapNumber === selectedMap);
  const displayedPlayers = map?.players ?? match.players;

  const teamAPlayers = displayedPlayers.filter((player) => player.teamId === match.teamAId).sort((a,b) => b.rating - a.rating);
  const teamBPlayers = displayedPlayers.filter((player) => player.teamId === match.teamBId).sort((a,b) => b.rating - a.rating);

  const scoreA = map?.scoreA ?? match.scoreA;
  const scoreB = map?.scoreB ?? match.scoreB;

  return (
    <div className="match-modal-backdrop" onClick={onClose}>
      <section className="match-modal" onClick={(event) => event.stopPropagation()}>
        <header className="match-modal__header">
          <div className="match-modal-team">
            {teamALogo && <img src={teamALogo} alt="" />}
            <strong>{teamA?.name}</strong>
          </div>

          <div className="match-modal-score">
            <span>{map ? map.mapName.toUpperCase() : `FINAL · BO${match.bestOf}`}</span>
            <strong>{scoreA} <small>:</small> {scoreB}</strong>
          </div>

          <div className="match-modal-team match-modal-team--right">
            <strong>{teamB?.name}</strong>
            {teamBLogo && <img src={teamBLogo} alt="" />}
          </div>

          <button className="match-modal-close" onClick={onClose}>×</button>
        </header>

        <nav className="match-modal-tabs">
          <button className={selectedMap === "all" ? "active" : ""} onClick={() => setSelectedMap("all")}>ALL MAPS</button>

          {match.maps.map((item) => (
            <button key={item.mapNumber} className={selectedMap === item.mapNumber ? "active" : ""} onClick={() => setSelectedMap(item.mapNumber)}>
              <sup>{item.mapNumber}</sup> {item.mapName}
              <small>{item.scoreA}-{item.scoreB}</small>
            </button>
          ))}
        </nav>

        <div className="match-table">
          <TeamHeading teamId={match.teamAId} score={scoreA} />
          <TableHeader />
          {teamAPlayers.map((player) => <PlayerRow key={player.id} player={player} highlighted={player.id === "career-player" && player.teamId === playerTeamId} showAllMaps={selectedMap === "all"} />)}

          <div className="match-table-divider" />

          <TeamHeading teamId={match.teamBId} score={scoreB} />
          <TableHeader />
          {teamBPlayers.map((player) => <PlayerRow key={player.id} player={player} highlighted={player.id === "career-player" && player.teamId === playerTeamId} showAllMaps={selectedMap === "all"} />)}
        </div>

        <footer className="match-modal__footer">
          <div className="match-modal-map-summary">
            {match.maps.map((item) => <span key={item.mapNumber}>{item.mapName} <strong>{item.scoreA}-{item.scoreB}</strong></span>)}
          </div>

          <button className="primary-button" onClick={onClose}>CONTINUAR <span>→</span></button>
        </footer>
      </section>
    </div>
  );
}

function TeamHeading({teamId, score}: {teamId: string; score: number}) {
  const team = getTeamById(teamId);
  const logo = getTeamLogo(team?.logo);

  return (
    <div className="match-table-team">
      <div>{logo && <img src={logo} alt="" />}<strong>{team?.name}</strong></div>
      <span>{score}</span>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="match-table-row match-table-row--header">
      <span>PLAYER</span>
      <span>R</span>
      <span>ACS</span>
      <span>K</span>
      <span>D</span>
      <span>A</span>
      <span>+/-</span>
      <span>KAST</span>
      <span>ADR</span>
      <span>HS%</span>
      <span>FK</span>
      <span>FD</span>
    </div>
  );
}

function PlayerRow({player, highlighted, showAllMaps}: {player: MatchPlayerStats; highlighted: boolean; showAllMaps: boolean}) {
  const differential = player.kills - player.deaths;
  const shownAgents = showAllMaps ? player.agents ?? (player.agent ? [player.agent] : []) : player.agent ? [player.agent] : [];

  return (
    <div className={`match-table-row ${highlighted ? "match-table-row--player" : ""}`}>
      <div className="match-player-cell">
        <div className="match-player-agents">
          {shownAgents.map((agent,index) => {
            const icon = getAgentIcon(agent);

            return icon
              ? <img key={`${player.id}-${agent}-${index}`} className="match-player-agent" src={icon} alt={agent} title={agent} />
              : <span key={`${player.id}-${agent}-${index}`} className="match-player-agent match-player-agent--fallback" title={agent}>{agent.slice(0,1)}</span>;
          })}
        </div>

        <strong>{player.name}</strong>
      </div>

      <span>{player.rating.toFixed(2)}</span>
      <span>{player.acs}</span>
      <span>{player.kills}</span>
      <span>{player.deaths}</span>
      <span>{player.assists}</span>
      <span className={differential > 0 ? "positive" : differential < 0 ? "negative" : ""}>{differential > 0 ? "+" : ""}{differential}</span>
      <span>{player.kast}%</span>
      <span>{player.adr}</span>
      <span>{player.headshot}%</span>
      <span>{player.firstKills}</span>
      <span>{player.firstDeaths}</span>
    </div>
  );
}