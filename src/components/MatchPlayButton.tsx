import "../styles/MatchPlayButton.css";
interface MatchPlayButtonProps {
  opponentName?:string;
  opponentShortName?:string;
  opponentLogo?:string;
  language:"es"|"en";
  onClick:() => void;
  disabled?:boolean;
  mode?:"match"|"simulate";
  simulateLabel?:string;
}

export function MatchPlayButton({opponentName,opponentShortName,opponentLogo,language,onClick,disabled=false,mode="match",simulateLabel}:MatchPlayButtonProps) {
  const label = mode === "simulate"
    ? (simulateLabel ?? (language === "es" ? "SIMULAR" : "SIMULATE"))
    : (language === "es" ? "JUGAR PARTIDO" : "PLAY MATCH");

  return (
    <button className="match-play-button" onClick={onClick} disabled={disabled}>
      {mode === "match" && (
        <span className="match-play-button__opponent">
          {opponentLogo
            ? <img src={opponentLogo} alt={opponentName ?? ""} />
            : <span className="match-play-button__fallback">{opponentShortName ?? "TBD"}</span>}
        </span>
      )}

      <strong>{label}</strong>
    </button>
  );
}