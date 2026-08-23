import type {CareerPlayer} from "../../types/career";
import {getPlayerBanner, getPlayerTitle} from "../../data/cosmetics";
import {useGameSettings} from "../../context/GameSettingsContext";
import "../../styles/PlayerCard.css";

interface PlayerCardProps {
  player: CareerPlayer;
  onEdit: () => void;
}

export function PlayerCard({player,onEdit}: PlayerCardProps) {
  const {language} = useGameSettings();
  const banner = getPlayerBanner(player.equippedBannerId);
  const title = getPlayerTitle(player.equippedTitleId);

  return (
    <button className="player-card" onClick={onEdit}>
      <div className="player-card__image">
        {banner?.image ? <img src={banner.image} alt="" /> : <div className="player-card__fallback">V</div>}

        <div className="player-card__overlay">
          <span>{language === "es" ? "TARJETA DE JUGADOR" : "PLAYER CARD"}</span>
          <strong>{player.nickname}</strong>
        </div>
      </div>

      <div className="player-card__title">
        <span>{language === "es" ? "TÍTULO" : "TITLE"}</span>
        <strong>{title?.name[language] ?? "—"}</strong>
      </div>

      <div className="player-card__edit">
        <span>{language === "es" ? "EDITAR TARJETA" : "EDIT PLAYER CARD"}</span>
        <b>→</b>
      </div>
    </button>
  );
}