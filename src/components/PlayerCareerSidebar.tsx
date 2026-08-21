import type {CareerPlayer} from "../types/career";
import {getPlayerOverall} from "../utils/playerOverall";
import {PlayerRadarChart} from "./PlayerRadarChart";
import {PlayerPhotoUpload} from "./PlayerPhotoUpload";
import "../styles/PlayerCareerSidebar.css";

interface PlayerCareerSidebarProps {
  player:CareerPlayer;
  language:"es"|"en";
  matches:number;
  wins:number;
  losses:number;
  averageRating:number;
  averageACS:number;
  kd:number;
  onUpdatePlayer?:(player:CareerPlayer) => void;
}

export function PlayerCareerSidebar({player,language,matches,wins,losses,averageRating,averageACS,kd,onUpdatePlayer}:PlayerCareerSidebarProps) {
  const overall = getPlayerOverall(player);

  return (
    <aside className="player-career-sidebar">
      <div className="player-career-sidebar__identity">
        <span className="player-career-sidebar__country">{getCountryFlag(player.country)} {player.country.toUpperCase()}</span>

        <div className="player-career-sidebar__name-row">
          <h2>{player.nickname}</h2>

          <div className="player-career-sidebar__overall">
            <strong>{overall}</strong>
            <span>GRL</span>
          </div>
        </div>

        <small>{player.rosterRole.toUpperCase()} · {player.role.toUpperCase()}</small>
      </div>

      {onUpdatePlayer ? (
        <PlayerPhotoUpload photo={player.photo} nickname={player.nickname} onChange={(photo) => onUpdatePlayer({...player,photo})} />
      ) : (
        <div className="player-career-sidebar__photo">
          {player.photo ? (
            <img src={player.photo} alt={player.nickname} />
          ) : (
            <div className="player-career-sidebar__photo-placeholder">
              <div className="player-career-sidebar__photo-head" />
              <div className="player-career-sidebar__photo-body" />
            </div>
          )}
        </div>
      )}

      <div className="player-career-sidebar__radar">
        <PlayerRadarChart player={player} />
      </div>

      <div className="player-career-sidebar__performance">
        <div><span>{language === "es" ? "PARTIDOS" : "MATCHES"}</span><strong>{matches}</strong></div>
        <div><span>W / L</span><strong>{wins} / {losses}</strong></div>
        <div><span>{language === "es" ? "RATING PROM." : "AVG RATING"}</span><strong>{averageRating.toFixed(2)}</strong></div>
        <div><span>{language === "es" ? "ACS PROM." : "AVG ACS"}</span><strong>{averageACS}</strong></div>
        <div><span>K / D</span><strong>{kd.toFixed(2)}</strong></div>
      </div>
    </aside>
  );
}

function getCountryFlag(countryCode:string) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  return countryCode.toUpperCase().replace(/./g,(char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}