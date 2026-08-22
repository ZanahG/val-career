import type {CareerPlayer} from "../types/career";
import {PLAYER_BANNERS,PLAYER_TITLES,isPlayerBannerUnlocked,isPlayerTitleUnlocked} from "../data/cosmetics";
import {useGameSettings} from "../context/GameSettingsContext";
import "../styles/PlayerCardEditor.css";

interface PlayerCardEditorProps {
  player:CareerPlayer;
  onEquipBanner:(id:string) => void;
  onEquipTitle:(id:string) => void;
  onClose:() => void;
}

export function PlayerCardEditor({player,onEquipBanner,onEquipTitle,onClose}:PlayerCardEditorProps) {
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
          <h3>BANNERS</h3>

          <div className="banner-grid">
            {PLAYER_BANNERS.map((banner) => {
              const unlocked = isPlayerBannerUnlocked(banner,player);
              const equipped = player.equippedBannerId === banner.id;

              return (
                <button
                  key={banner.id}
                  disabled={!unlocked}
                  className={`banner-option ${equipped ? "banner-option--equipped" : ""} ${!unlocked ? "banner-option--locked" : ""}`}
                  onClick={() => unlocked && onEquipBanner(banner.id)}
                >
                  <div className="banner-option__image">
                    {banner.image && <img src={banner.image} alt={banner.name[language]} />}
                    {!unlocked && <span className="banner-option__lock">🔒</span>}
                  </div>

                  <strong>{banner.name[language]}</strong>

                  <span>
                    {unlocked
                      ? equipped
                        ? (language === "es" ? "EQUIPADO" : "EQUIPPED")
                        : banner.rarity.toUpperCase()
                      : (language === "es" ? "BLOQUEADO" : "LOCKED")}
                  </span>

                  {!unlocked && <small>{banner.unlock.description[language]}</small>}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3>{language === "es" ? "TÍTULOS" : "TITLES"}</h3>

          <div className="title-grid">
            {PLAYER_TITLES.map((title) => {
              const unlocked = isPlayerTitleUnlocked(title,player);
              const equipped = player.equippedTitleId === title.id;

              return (
                <button
                  key={title.id}
                  disabled={!unlocked}
                  className={`title-option ${equipped ? "title-option--equipped" : ""} ${!unlocked ? "title-option--locked" : ""}`}
                  onClick={() => unlocked && onEquipTitle(title.id)}
                >
                  <div className="title-option__content">
                    <strong>{title.name[language]}</strong>
                    {!unlocked && <span className="title-option__lock">🔒</span>}
                  </div>

                  <span>
                    {unlocked
                      ? equipped
                        ? (language === "es" ? "EQUIPADO" : "EQUIPPED")
                        : title.rarity.toUpperCase()
                      : (language === "es" ? "BLOQUEADO" : "LOCKED")}
                  </span>

                  {!unlocked && <small>{title.unlock.description[language]}</small>}
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}