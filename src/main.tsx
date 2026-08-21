import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import { GameSettingsProvider } from "./context/GameSettingsContext";

import "./styles/global.css";

createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <GameSettingsProvider>
      <App />
    </GameSettingsProvider>
  </StrictMode>,
);