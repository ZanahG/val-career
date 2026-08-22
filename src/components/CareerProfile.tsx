import type {CareerPlayer} from "../types/career";
import {GameSettingsControls} from "./GameSettingsControls";
import {useGameSettings} from "../context/GameSettingsContext";
import {formatCurrency} from "../utils/currency";
import {getTeamById} from "../data/teams";
import {PlayerRadarChart} from "./PlayerRadarChart";
import {PlayerCard} from "./PlayerCard";
import {useRef,useState} from "react";
import {toPng} from "html-to-image";
import {CareerShareCard} from "./CareerShareCard";
import "../styles/CareerProfile.css";

interface CareerProfileProps {
  player:CareerPlayer;
  onBack:() => void;
  onEditPlayerCard:() => void;
}


export function CareerProfile({player,onBack,onEditPlayerCard}:CareerProfileProps) {
  const {language,currency} = useGameSettings();
  const currentTeam = getTeamById(player.currentTeamId);

  const totalWins = player.history.reduce((total,season) => total + season.wins,0);
  const totalLosses = player.history.reduce((total,season) => total + season.losses,0);
  const bestPlacement = player.history.length > 0 ? Math.min(...player.history.map((season) => season.placement)) : null;

  const shareCardRef = useRef<HTMLDivElement>(null);
  const [exporting,setExporting] = useState(false);
  const [sharePreview,setSharePreview] = useState<string|null>(null);

  const generateCareerPreview = async () => {
    if (!shareCardRef.current || exporting) return;

    setExporting(true);

    try {
      await document.fonts.ready;

      const dataUrl = await toPng(shareCardRef.current,{width:1200,height:675,pixelRatio:1,cacheBust:true});

      setSharePreview(dataUrl);
    } finally {
      setExporting(false);
    }
  };

  const downloadCareerImage = () => {
    if (!sharePreview) return;

    const link = document.createElement("a");

    link.download = `${player.nickname}-career.png`;
    link.href = sharePreview;
    link.click();
  };

  const shareCareerOnX = () => {
    if (!sharePreview) return;

    const link = document.createElement("a");
    link.download = `${player.nickname}-career.png`;
    link.href = sharePreview;
    link.click();

    const text = `${player.nickname} · ${player.currentStage.toUpperCase()} · ${totalWins}-${totalLosses} 🏆 ${player.trophies.length}\n\nMi carrera en TuCarreraValorant`;

    window.setTimeout(() => {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer");
    },250);
  };

  return (
    <main className="profile-screen">
      <header className="profile-topbar">
        <div className="profile-topbar__left">
          <button className="profile-back" onClick={onBack}>←</button>
          <div className="brand-mark brand-mark--small">TCV</div>
          <div><strong>{language === "es" ? "PERFIL DE CARRERA" : "CAREER PROFILE"}</strong><span>{player.nickname}</span></div>
        </div>

        <GameSettingsControls />
      </header>

      <section className="profile-content">
        <div className="profile-layout">
          <aside className="profile-player-card-column">
            <div className="profile-player-card-heading">
              <span className="eyebrow">{language === "es" ? "IDENTIDAD" : "IDENTITY"}</span>
              <h2>PLAYER CARD</h2>
            </div>

            <PlayerCard player={player} onEdit={onEditPlayerCard} />
          </aside>

          <div className="profile-main-content">

            <div className="profile-share-actions">
              <button className="profile-share-actions__primary" onClick={generateCareerPreview} disabled={exporting}>
                {exporting ? (language === "es" ? "GENERANDO..." : "GENERATING...") : language === "es" ? "COMPARTIR CARRERA ↗" : "SHARE CAREER ↗"}
              </button>
            </div>
            <header className="profile-hero">
              <div>
                <span className="eyebrow">{player.currentStage.toUpperCase()}</span>
                <h1>{player.nickname}</h1>
                <p>{player.country} · {player.age} {language === "es" ? "años" : "years old"} · {player.role}</p>
              </div>

              <div className="profile-current-team">
                <span>{language === "es" ? "EQUIPO ACTUAL" : "CURRENT TEAM"}</span>
                <strong>{currentTeam?.name ?? player.currentTeam}</strong>
                <small>{player.currentTeamId ? `${player.rosterRole} · ${player.mainAgent}` : language === "es" ? "Agente libre" : "Free Agent"}</small>
              </div>
            </header>

            <section className="profile-summary">
              <div><span>{language === "es" ? "TEMPORADAS" : "SEASONS"}</span><strong>{player.history.length}</strong></div>
              <div><span>{language === "es" ? "RÉCORD" : "RECORD"}</span><strong>{totalWins}-{totalLosses}</strong></div>
              <div><span>{language === "es" ? "GANANCIAS" : "EARNINGS"}</span><strong>{formatCurrency(player.earnings,currency)}</strong></div>
              <div><span>{language === "es" ? "TROFEOS" : "TROPHIES"}</span><strong>{player.trophies.length}</strong></div>
              <div><span>{language === "es" ? "MEJOR POSICIÓN" : "BEST FINISH"}</span><strong>{bestPlacement ? `#${bestPlacement}` : "-"}</strong></div>
              <div><span>{language === "es" ? "SEGUIDORES" : "FOLLOWERS"}</span><strong>{player.followers.toLocaleString()}</strong></div>
            </section>

            <div className="profile-columns">
              <section className="profile-panel">
                <div className="profile-panel__title">
                  <div><span className="eyebrow">{language === "es" ? "TRAYECTORIA" : "JOURNEY"}</span><h2>{language === "es" ? "Historial de carrera" : "Career history"}</h2></div>
                  <strong>{player.history.length}</strong>
                </div>

                <div className="career-history">
                  {player.history.length === 0 && <div className="profile-empty">{language === "es" ? "Completa tu primera temporada para comenzar tu historial." : "Complete your first season to start building your career history."}</div>}

                  {[...player.history].reverse().map((season) => (
                    <article key={`${season.season}-${season.teamId}`} className="career-history-row">
                      <div className="career-history-year"><span>{season.season}</span></div>

                      <div className="career-history-team">
                        <strong>{season.teamName}</strong>
                        <span>{season.rosterRole}</span>
                        {season.ascensionQualified && <small className={season.ascensionWon ? "career-history-ascension career-history-ascension--win" : "career-history-ascension"}>ASCENSION {season.ascensionWins ?? 0}-{season.ascensionLosses ?? 0}</small>}
                      </div>

                      <div className="career-history-record"><span>W/L</span><strong>{season.wins}-{season.losses}</strong></div>
                      <div className="career-history-placement"><span>{language === "es" ? "POS." : "FINISH"}</span><strong>#{season.placement}</strong></div>
                      <div className="career-history-salary"><span>{language === "es" ? "SUELDO" : "SALARY"}</span><strong>{formatCurrency(season.salary,currency)}</strong></div>
                      <div className="career-history-trophy">{season.ascensionWon ? "⬆" : season.trophies.length > 0 ? "🏆" : ""}</div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="profile-side">
                <section className="profile-panel">
                  <div className="profile-panel__title">
                    <div><span className="eyebrow">{language === "es" ? "PALMARÉS" : "HONOURS"}</span><h2>{language === "es" ? "Trofeos" : "Trophies"}</h2></div>
                  </div>

                  <div className="trophy-list">
                    {player.trophies.length === 0 && <div className="profile-empty">{language === "es" ? "Todavía no has ganado títulos." : "You haven't won any trophies yet."}</div>}

                    {[...player.trophies].reverse().map((trophy,index) => (
                      <div key={`${trophy}-${index}`} className="trophy-row"><span>🏆</span><strong>{trophy}</strong></div>
                    ))}
                  </div>
                </section>

                <PlayerRadarChart player={player} />

                <section className="profile-panel profile-personality">
                  <div className="profile-panel__title">
                    <div><span className="eyebrow">{language === "es" ? "REPUTACIÓN" : "REPUTATION"}</span><h2>{language === "es" ? "Perfil profesional" : "Professional profile"}</h2></div>
                  </div>

                  <div className="profile-reputation">
                    <div><span>{language === "es" ? "REPUTACIÓN" : "REPUTATION"}</span><strong>{player.reputationStats.reputation}</strong></div>
                    <div><span>{language === "es" ? "PROFESIONALISMO" : "PROFESSIONALISM"}</span><strong>{player.reputationStats.professionalism}</strong></div>
                    <div><span>TEAMWORK</span><strong>{player.reputationStats.teamwork}</strong></div>
                    <div><span>{language === "es" ? "POPULARIDAD" : "POPULARITY"}</span><strong>{player.reputationStats.popularity}</strong></div>
                    <div><span>TOXICITY</span><strong>{player.reputationStats.toxicity}</strong></div>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {sharePreview && (
        <div className="career-share-preview-backdrop" onClick={() => setSharePreview(null)}>
          <section className="career-share-preview" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span className="eyebrow">{language === "es" ? "VISTA PREVIA" : "PREVIEW"}</span>
                <h2>{language === "es" ? "COMPARTE TU CARRERA" : "SHARE YOUR CAREER"}</h2>
              </div>

              <button onClick={() => setSharePreview(null)}>×</button>
            </header>

            <div className="career-share-preview__image">
              <img src={sharePreview} alt={language === "es" ? "Vista previa de carrera" : "Career preview"} />
            </div>

            <footer>
              <button onClick={() => setSharePreview(null)}>{language === "es" ? "CANCELAR" : "CANCEL"}</button>
              <button onClick={downloadCareerImage}>↓ {language === "es" ? "DESCARGAR PNG" : "DOWNLOAD PNG"}</button>
              <button className="career-share-preview__share" onClick={shareCareerOnX}>{language === "es" ? "COMPARTIR EN X" : "SHARE ON X"} ↗</button>
            </footer>
          </section>
        </div>
      )}

      <div className="career-share-export-layer">
        <div ref={shareCardRef}><CareerShareCard player={player} /></div>
      </div>
    </main>
  );
}