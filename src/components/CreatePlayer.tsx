import {useMemo,useState} from "react";
import type {CareerPlayer,PlayerRegion,PlayerRole} from "../types/career";
import {GameSettingsControls} from "./GameSettingsControls";
import {useGameSettings} from "../context/GameSettingsContext";
import {CountrySelect} from "./CountrySelect";
import {PlayerRadarChart} from "./PlayerRadarChart";
import "../styles/CreatePlayer.css";

const ROLES: PlayerRole[] = ["Duelist","Initiator","Controller","Sentinel","Flex"];
const REGIONS: PlayerRegion[] = ["LATAM","Brazil","North America","Europe","MENA","Turkey","CIS","Korea","Japan","Southeast Asia","South Asia","Oceania","China"];

const AGENTS_BY_ROLE: Record<PlayerRole,string[]> = {
  Duelist: ["Jett","Raze","Neon","Yoru","Phoenix"],
  Initiator: ["Sova","Fade","Breach","KAY/O","Gekko"],
  Controller: ["Omen","Viper","Astra","Brimstone","Clove"],
  Sentinel: ["Killjoy","Cypher","Sage","Chamber","Deadlock"],
  Flex: ["Jett","Omen","Sova","Killjoy","KAY/O"],
};

const ROLE_BASE_STATS: Record<PlayerRole,CareerPlayer["stats"]> = {
  Duelist: {aim: 80,gameSense: 67,communication: 61,clutch: 74,consistency: 68,mental: 69},
  Initiator: {aim: 69,gameSense: 76,communication: 78,clutch: 64,consistency: 72,mental: 71},
  Controller: {aim: 66,gameSense: 74,communication: 73,clutch: 62,consistency: 80,mental: 75},
  Sentinel: {aim: 68,gameSense: 75,communication: 69,clutch: 70,consistency: 78,mental: 74},
  Flex: {aim: 72,gameSense: 72,communication: 70,clutch: 70,consistency: 72,mental: 72},
};

interface CreatePlayerProps {
  onCreate: (player: CareerPlayer) => void;
  onContinue?: () => void;
  hasSave?: boolean;
}

export function CreatePlayer({onCreate,onContinue,hasSave = false}: CreatePlayerProps) {
  const {language,t} = useGameSettings();
  const [nickname,setNickname] = useState("");
  const [country,setCountry] = useState("Country");
  const [region,setRegion] = useState<PlayerRegion>("LATAM");
  const [age,setAge] = useState(16);
  const [role,setRole] = useState<PlayerRole>("Duelist");
  const [mainAgent,setMainAgent] = useState("Jett");

  const agents = useMemo(() => AGENTS_BY_ROLE[role],[role]);
  const roleStats = useMemo(() => ROLE_BASE_STATS[role],[role]);

  const previewPlayer = useMemo<CareerPlayer>(() => ({
    nickname: nickname.trim() || "Rookie",
    country,
    region,
    age,
    role,
    mainAgent,
    stats: roleStats,
    reputationStats: {reputation: 8,popularity: 4,professionalism: 55,teamwork: 55,toxicity: 5},
    followers: 123,
    earnings: 0,
    currentTeam: "Free Agent",
    currentStage: "Ranked",
    rosterRole: "Starter",
    salary: 0,
    contractSeasonsRemaining: 0,
    season: 2026,
    careerPoints: 0,
    history: [],
    trophies: [],
    vctEligible: false,
    equippedBannerId: "rookie",
    equippedTitleId: "unknown-prospect",
    unlockedBannerIds: ["rookie"],
    unlockedTitleIds: ["unknown-prospect"],
  }),[nickname,country,region,age,role,mainAgent,roleStats]);

  const handleRoleChange = (nextRole: PlayerRole) => {
    setRole(nextRole);
    setMainAgent(AGENTS_BY_ROLE[nextRole][0]);
  };

  const createPlayer = () => onCreate(previewPlayer);

  return (
    <main className="create-screen">
      <section className="create-panel">
        <div className="create-topbar">
          <div className="brand-mark">TCV</div>
          <GameSettingsControls />
        </div>

        <div className="create-copy">
          <span className="eyebrow">{t("buildLegacy")}</span>
          <h1>{language === "es" ? <>TU CARRERA<br />VALORANT</> : <>YOUR VALORANT<br />CAREER</>}</h1>
          <p>{language === "es" ? "Empieza como un jugador desconocido y construye una carrera mundial a través de ranked, fichajes, torneos, decisiones y rivalidades." : "Start as an unknown player and build a worldwide career through ranked, contracts, tournaments, decisions and rivalries."}</p>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>{t("nickname")}</span>
            <input value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} />
          </label>

          <div className="field">
            <span>{t("country")}</span>
            <CountrySelect value={country} language={language} onChange={setCountry} />
          </div>

          <label className="field">
            <span>{language === "es" ? "REGIÓN" : "REGION"}</span>
            <select value={region} onChange={(e) => setRegion(e.target.value as PlayerRegion)}>
              {REGIONS.map((item) => <option key={item} value={item}>{getRegionLabel(item,language)}</option>)}
            </select>
          </label>

          <label className="field">
            <span>{t("startingAge")}</span>
            <input type="number" min={16} max={24} value={age} onChange={(e) => setAge(Number(e.target.value))} />
          </label>

          <label className="field">
            <span>{t("role")}</span>
            <select value={role} onChange={(e) => handleRoleChange(e.target.value as PlayerRole)}>
              {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <div className="field">
            <span>{language === "es" ? "CIRCUITO INICIAL" : "STARTING CIRCUIT"}</span>
            <div className="region-preview">
              <strong>{getCircuitLabel(region)}</strong>
              <small>{getCircuitDescription(region,language)}</small>
            </div>
          </div>

          <div className="field field--wide">
            <span>{t("mainAgent")}</span>
            <div className="agent-list">
              {agents.map((agent) => <button key={agent} type="button" className={agent === mainAgent ? "agent-chip agent-chip--active" : "agent-chip"} onClick={() => setMainAgent(agent)}>{agent}</button>)}
            </div>
          </div>
        </div>

        <div className="create-actions">
          <button className="primary-button" onClick={createPlayer}>{t("beginCareer")}<span>→</span></button>
          {hasSave && onContinue && <button className="continue-career-button" onClick={onContinue}>{language === "es" ? "CONTINUAR CARRERA" : "CONTINUE CAREER"}<span>→</span></button>}
        </div>
      </section>

      <aside className="create-visual">
        <div className="visual-number">01</div>

        <div className="create-role-preview">
          <span className="eyebrow">{language === "es" ? "PERFIL INICIAL" : "STARTING PROFILE"}</span>
          <h3>{role.toUpperCase()}</h3>

          <div className="create-role-preview__radar">
            <PlayerRadarChart player={previewPlayer} />
          </div>

          <div className="create-role-preview__summary">
            <div><span>AIM</span><strong>{roleStats.aim}</strong></div>
            <div><span>GAME SENSE</span><strong>{roleStats.gameSense}</strong></div>
            <div><span>COMMUNICATION</span><strong>{roleStats.communication}</strong></div>
            <div><span>CLUTCH</span><strong>{roleStats.clutch}</strong></div>
            <div><span>CONSISTENCY</span><strong>{roleStats.consistency}</strong></div>
            <div><span>MENTAL</span><strong>{roleStats.mental}</strong></div>
          </div>
        </div>

        <div className="visual-card">
          <span>{language === "es" ? "MODO CARRERA MUNDIAL" : "WORLD CAREER MODE"}</span>
          <strong>{language === "es" ? <>DE RANKED<br />A CHAMPIONS.</> : <>FROM RANKED<br />TO CHAMPIONS.</>}</strong>
          <p>{language === "es" ? "Tu región determina dónde comienza tu historia. Tú decides dónde termina." : "Your region determines where your story begins. You decide where it ends."}</p>
        </div>
      </aside>
    </main>
  );
}

function getRegionLabel(region: PlayerRegion, language: "es" | "en") {
  const labels: Record<PlayerRegion,{es: string; en: string}> = {
    LATAM: {es: "Latinoamérica",en: "Latin America"},
    Brazil: {es: "Brasil",en: "Brazil"},
    "North America": {es: "Norteamérica",en: "North America"},
    Europe: {es: "Europa",en: "Europe"},
    MENA: {es: "MENA",en: "MENA"},
    Turkey: {es: "Turquía",en: "Turkey"},
    CIS: {es: "CIS",en: "CIS"},
    Korea: {es: "Corea",en: "Korea"},
    Japan: {es: "Japón",en: "Japan"},
    "Southeast Asia": {es: "Sudeste Asiático",en: "Southeast Asia"},
    "South Asia": {es: "Asia del Sur",en: "South Asia"},
    Oceania: {es: "Oceanía",en: "Oceania"},
    China: {es: "China",en: "China"},
  };

  return labels[region][language];
}

function getCircuitLabel(region: PlayerRegion) {
  const circuits: Record<PlayerRegion,string> = {
    LATAM: "Americas",
    Brazil: "Americas",
    "North America": "Americas",
    Europe: "EMEA",
    MENA: "EMEA",
    Turkey: "EMEA",
    CIS: "EMEA",
    Korea: "Pacific",
    Japan: "Pacific",
    "Southeast Asia": "Pacific",
    "South Asia": "Pacific",
    Oceania: "Pacific",
    China: "China",
  };

  return circuits[region];
}

function getCircuitDescription(region: PlayerRegion, language: "es" | "en") {
  const circuit = getCircuitLabel(region);

  if (language === "es") {
    if (circuit === "Americas") return "Tu camino profesional comienza dentro del ecosistema de Americas.";
    if (circuit === "EMEA") return "Tu camino profesional comienza dentro del ecosistema de EMEA.";
    if (circuit === "Pacific") return "Tu camino profesional comienza dentro del ecosistema de Pacific.";
    return "Tu camino profesional comienza dentro del ecosistema competitivo de China.";
  }

  if (circuit === "Americas") return "Your professional path starts inside the Americas ecosystem.";
  if (circuit === "EMEA") return "Your professional path starts inside the EMEA ecosystem.";
  if (circuit === "Pacific") return "Your professional path starts inside the Pacific ecosystem.";
  return "Your professional path starts inside the Chinese competitive ecosystem.";
}