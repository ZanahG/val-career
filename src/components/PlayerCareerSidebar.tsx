import type {CareerPlayer} from "../types/career";
import {getPlayerOverall} from "../utils/playerOverall";
import {PlayerRadarChart} from "./PlayerRadarChart";
import {PlayerPhotoUpload} from "./PlayerPhotoUpload";
import {COUNTRIES} from "../data/countries";
import "../styles/PlayerCareerSidebar.css";

interface PlayerCareerSidebarProps {
  player:CareerPlayer;
  language:"es"|"en";
  matches?:number;
  wins?:number;
  losses?:number;
  averageRating?:number;
  averageACS?:number;
  kd?:number;
  onUpdatePlayer?:(player:CareerPlayer) => void;
  showPerformance?:boolean;
}

export function PlayerCareerSidebar({player,language,matches=0,wins=0,losses=0,averageRating=0,averageACS=0,kd=0,onUpdatePlayer,showPerformance=true}:PlayerCareerSidebarProps) {
  const overall = getPlayerOverall(player);

  return (
    <aside className="player-career-sidebar">
      <div className="player-career-sidebar__identity">
        <span className="player-career-sidebar__country">
          {getCountryCode(player.country) && <img className="player-career-sidebar__country-flag" src={`https://flagcdn.com/${getCountryCode(player.country)!.toLowerCase()}.svg`} alt="" />}
          <strong>{player.country.toUpperCase()}</strong>
          <i>·</i>
          <small>{player.age} {language === "es" ? "AÑOS" : "Y.O."}</small>
        </span>

        <div className="player-career-sidebar__name-row">
          <h2>{player.nickname}</h2>

          <div className="player-career-sidebar__overall">
            <strong>{overall}</strong>
            <span>GRL</span>
          </div>
        </div>
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

      {showPerformance && (
        <div className="player-career-sidebar__performance">
          <div><span>{language === "es" ? "PARTIDOS" : "MATCHES"}</span><strong>{matches}</strong></div>
          <div><span>W / L</span><strong>{wins} / {losses}</strong></div>
          <div><span>{language === "es" ? "RATING PROM." : "AVG RATING"}</span><strong>{averageRating.toFixed(2)}</strong></div>
          <div><span>{language === "es" ? "ACS PROM." : "AVG ACS"}</span><strong>{averageACS}</strong></div>
          <div><span>K / D</span><strong>{kd.toFixed(2)}</strong></div>
        </div>
      )}
    </aside>
  );
}

function getCountryCode(country:string) {
  return COUNTRIES.find((item) => item.name.en === country || item.name.es === country)?.code;
}