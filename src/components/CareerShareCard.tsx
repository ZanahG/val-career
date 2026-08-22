import type {CareerPlayer} from "../types/career";
import {getTeamById} from "../data/teams";
import {getPlayerBanner,getPlayerTitle} from "../data/cosmetics";
import {getPlayerOverall} from "../utils/playerOverall";
import "../styles/CareerShareCard.css";

interface CareerShareCardProps {
  player:CareerPlayer;
}

export function CareerShareCard({player}:CareerShareCardProps) {
  const team = getTeamById(player.currentTeamId);
  const banner = getPlayerBanner(player.equippedBannerId);
  const title = getPlayerTitle(player.equippedTitleId);
  const totalWins = player.history.reduce((total,season) => total + season.wins,0);
  const totalLosses = player.history.reduce((total,season) => total + season.losses,0);
  const bestPlacement = player.history.length > 0 ? Math.min(...player.history.map((season) => season.placement)) : null;
  const latestTrophies = [...player.trophies].reverse().slice(0,3);

  return (
    <div id="career-share-card" className="career-share-card">
      <div className="career-share-card__top">
        <div><strong>TCV</strong><span>TuCarreraValorant</span></div>
        <span>{player.currentStage.toUpperCase()}</span>
      </div>

      <div className="career-share-card__body">
        <div className="career-share-card__banner">
          {banner?.image ? <img src={banner.image} alt="" /> : <div className="career-share-card__banner-fallback">V</div>}
          <div><span>PLAYER CARD</span><strong>{title?.name.es ?? "Rookie"}</strong></div>
        </div>

        <div className="career-share-card__content">
          <div className="career-share-card__identity">
            <div><span>{team?.name ?? "FREE AGENT"}</span><h1>{player.nickname}</h1><p>{player.country} · {player.age} AÑOS · {player.role.toUpperCase()}</p></div>
            <div className="career-share-card__grl"><strong>{getPlayerOverall(player)}</strong><span>GRL</span></div>
          </div>

          <div className="career-share-card__summary">
            <div><span>TEMPORADAS</span><strong>{player.history.length}</strong></div>
            <div><span>RÉCORD</span><strong>{totalWins}-{totalLosses}</strong></div>
            <div><span>TROFEOS</span><strong>{player.trophies.length}</strong></div>
            <div><span>MEJOR POS.</span><strong>{bestPlacement ? `#${bestPlacement}` : "-"}</strong></div>
          </div>

          <div className="career-share-card__bottom">
            <div className="career-share-card__stats">
              <ShareStat name="AIM" value={player.stats.aim} />
              <ShareStat name="GAME SENSE" value={player.stats.gameSense} />
              <ShareStat name="COMMUNICATION" value={player.stats.communication} />
              <ShareStat name="CLUTCH" value={player.stats.clutch} />
              <ShareStat name="CONSISTENCY" value={player.stats.consistency} />
              <ShareStat name="MENTAL" value={player.stats.mental} />
            </div>

            <div className="career-share-card__trophies">
              <span>CAREER HIGHLIGHTS</span>
              {latestTrophies.length > 0 ? latestTrophies.map((trophy,index) => <strong key={`${trophy}-${index}`}>🏆 {trophy}</strong>) : <small>La carrera acaba de comenzar.</small>}
            </div>
          </div>
        </div>
      </div>

      <div className="career-share-card__footer"><span>VALORANT CAREER SIMULATOR</span><strong>TuCarreraValorant</strong></div>
    </div>
  );
}

function ShareStat({name,value}:{name:string;value:number}) {
  return (
    <div className="career-share-stat">
      <span>{name}</span>
      <div><i style={{width:`${value}%`}} /></div>
      <strong>{value}</strong>
    </div>
  );
}