import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  GameCurrency,
  GameLanguage,
  GameSettings,
} from "../types/settings";

import { translations } from "../data/translations";

interface GameSettingsContextValue
  extends GameSettings {
  setLanguage: (
    language: GameLanguage,
  ) => void;

  setCurrency: (
    currency: GameCurrency,
  ) => void;

  t: (
    key:
      keyof typeof translations.es,
  ) => string;
}

const defaultSettings: GameSettings = {
  language: "es",
  currency: "USD",
};

const GameSettingsContext =
  createContext<
    GameSettingsContextValue | undefined
  >(undefined);

export function GameSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] =
    useState<GameLanguage>(() => {
      const stored =
        localStorage.getItem(
          "tcv-language",
        );

      return stored === "en"
        ? "en"
        : "es";
    });

  const [currency, setCurrency] =
    useState<GameCurrency>(() => {
      const stored =
        localStorage.getItem(
          "tcv-currency",
        );

      return (
        (stored as GameCurrency) ||
        defaultSettings.currency
      );
    });

  useEffect(() => {
    localStorage.setItem(
      "tcv-language",
      language,
    );
  }, [language]);

  useEffect(() => {
    localStorage.setItem(
      "tcv-currency",
      currency,
    );
  }, [currency]);

  const t = (
    key:
      keyof typeof translations.es,
  ) => {
    return translations[language][key];
  };

  return (
    <GameSettingsContext.Provider
      value={{
        language,
        currency,
        setLanguage,
        setCurrency,
        t,
      }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings() {
  const context =
    useContext(
      GameSettingsContext,
    );

  if (!context) {
    throw new Error(
      "useGameSettings must be used inside GameSettingsProvider",
    );
  }

  return context;
}