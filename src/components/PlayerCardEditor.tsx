import type {CareerPlayer} from "../types/career";
import {PLAYER_BANNERS, PLAYER_TITLES} from "../data/cosmetics";
import {useGameSettings} from "../context/GameSettingsContext";
import "../styles/PlayerCardEditor.css";

interface PlayerCardEditorProps {
  player: CareerPlayer;
  onEquipBanner: (id: string) => void;
  onEquipTitle: (id: string) => void;
  onClose: () => void;
}

export function PlayerCardEditor({player,onEquipBanner,onEquipTitle,onClose}: PlayerCardEditorProps) {
  const {language} = useGameSettings();

  return (
    <div className="player-card-editor-backdrop" onClick={onClose}>
      <section className="player-card-editor" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="eyebrow">{language === "es" ? "PERSONALIZACIÓN" : "CUSTOMIZATION"}</span>
            <h2>{language === "es" ? "TARJETA DE JUGADOR" : "PLAYER CARD"}</h2>
          </div>

          <button onClick={onClose}>×</button>
        </header>

        <section>
          <h3>{language === "es" ? "BANNERS" : "BANNERS"}</h3>

          <div className="banner-grid">
            {PLAYER_BANNERS.map((banner) => {
              const unlocked = player.unlockedBannerIds.includes(banner.id);
              const equipped = player.equippedBannerId === banner.id;

              return (
                <button key={banner.id} disabled={!unlocked} className={`banner-option ${equipped ? "banner-option--equipped" : ""} ${!unlocked ? "banner-option--locked" : ""}`} onClick={() => onEquipBanner(banner.id)}>
                  <div>{banner.image && <img src={banner.image} alt="" />}</div>
                  <strong>{banner.name[language]}</strong>
                  <span>{unlocked ? equipped ? (language === "es" ? "EQUIPADO" : "EQUIPPED") : (language === "es" ? "DESBLOQUEADO" : "UNLOCKED") : "LOCKED"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3>{language === "es" ? "TÍTULOS" : "TITLES"}</h3>

          <div className="title-grid">
            {PLAYER_TITLES.map((title) => {
              const unlocked = player.unlockedTitleIds.includes(title.id);
              const equipped = player.equippedTitleId === title.id;

              return (
                <button key={title.id} disabled={!unlocked} className={`${equipped ? "title-option title-option--equipped" : "title-option"} ${!unlocked ? "title-option--locked" : ""}`} onClick={() => onEquipTitle(title.id)}>
                  <strong>{title.name[language]}</strong>
                  <span>{unlocked ? equipped ? "EQUIPPED" : title.rarity.toUpperCase() : "LOCKED"}</span>
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}