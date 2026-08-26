import "../../styles/GameModeSelect.css";

interface GameModeSelectProps {
  onPlayerCareer:()=>void;
  onCoachCareer:()=>void;
  onContinueCoachCareer:()=>void;
  hasCoachSave:boolean;
}

export function GameModeSelect({onPlayerCareer,onCoachCareer,onContinueCoachCareer,hasCoachSave}:GameModeSelectProps) {
  return (
    <main className="game-mode-screen">
      <section className="game-mode-header">
        <div className="brand-mark">TCV</div>
        <span>TuCarreraValorant</span>
        <h1>ELIGE TU CARRERA</h1>
        <p>Construye tu legado dentro del competitivo de VALORANT.</p>
      </section>

      <section className="game-mode-grid">
        <button className="game-mode-card" onClick={onPlayerCareer}>
          <span className="game-mode-card__eyebrow">PLAYER CAREER</span>
          <strong>CONVIÉRTETE EN PRO</strong>
          <p>Empieza desde ranked, consigue contratos, compite en Challengers y alcanza VCT.</p>
          <b>JUGAR COMO PLAYER →</b>
        </button>

        <article className="game-mode-card game-mode-card--coach">
          <span className="game-mode-card__eyebrow">COACH MODE</span>
          <strong>CONSTRUYE TU EQUIPO</strong>
          <p>Gestiona el roster, ficha jugadores, prepara mapas y dirige tu camino hacia Champions.</p>

          {hasCoachSave?(
            <div className="game-mode-card__actions">
              <button className="game-mode-card__action game-mode-card__action--primary" onClick={onContinueCoachCareer}>CONTINUAR CARRERA →</button>
              <button className="game-mode-card__action" onClick={onCoachCareer}>NUEVA CARRERA</button>
            </div>
          ):(
            <button className="game-mode-card__action game-mode-card__action--primary" onClick={onCoachCareer}>DIRIGIR EQUIPO →</button>
          )}
        </article>
      </section>
    </main>
  );
}