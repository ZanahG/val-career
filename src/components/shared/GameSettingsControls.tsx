import type {GameCurrency,GameLanguage,} from "../../types/settings";
import { CURRENCIES } from "../../data/currencies";
import { useGameSettings } from "../../context/GameSettingsContext";
import "../../styles/GameSettingsControls.css";

export function GameSettingsControls() {
  const {
    language,
    currency,
    setLanguage,
    setCurrency,
  } = useGameSettings();

  return (
    <div className="game-settings-controls">
      <div className="game-setting-control">
        <span className="game-setting-icon">
          🌐
        </span>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(
              e.target.value as GameLanguage,
            )
          }
          aria-label={
            language === "es"
              ? "Idioma"
              : "Language"
          }
        >
          <option value="es">
            ES
          </option>

          <option value="en">
            EN
          </option>
        </select>
      </div>

      <div className="game-setting-control">
        <span className="game-setting-icon">
          💰
        </span>

        <select
          value={currency}
          onChange={(e) =>
            setCurrency(
              e.target.value as GameCurrency,
            )
          }
          aria-label={
            language === "es"
              ? "Moneda"
              : "Currency"
          }
        >
          {CURRENCIES.map(
            (item) => (
              <option
                key={item.code}
                value={item.code}
              >
                {item.code}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
}