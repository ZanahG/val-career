import type {CareerPlayer} from "../../types/career";
import {getTeamById} from "../../data/teams";
import {getPlayerBanner,getPlayerTitle} from "../../data/cosmetics";
import {getPlayerOverall} from "../../utils/playerOverall";
import {getTeamLogo} from "../../utils/teamLogo";
import {getTrophyPresentation,isPalmaresTrophy} from "../../data/trophies";
import "../../styles/CareerShareCard.css";

interface CareerShareCardProps {
  player:CareerPlayer;
}

export function CareerShareCard({player}:CareerShareCardProps) {
  const team = getTeamById(player.currentTeamId);
  const banner = getPlayerBanner(player.equippedBannerId);
  const title = getPlayerTitle(player.equippedTitleId);
  const overall = getPlayerOverall(player);

  const totalWins = player.history.reduce((total,season) => total + season.wins,0);
  const totalLosses = player.history.reduce((total,season) => total + season.losses,0);
  const bestPlacement = player.history.length ? Math.min(...player.history.map((season) => season.placement)) : null;

  const palmaresTrophies = player.trophies.filter(isPalmaresTrophy);
  const allGroupedTrophies = groupPalmaresTrophies(palmaresTrophies);
  const groupedTrophies = allGroupedTrophies.slice(0,4);
  const hiddenTrophies = Math.max(0,allGroupedTrophies.length - groupedTrophies.length);

  const teamLogo = getTeamLogo(team?.logo);

  return (
    <div className="career-share-card">
      <div className="career-share-card__topbar">
        <div className="career-share-card__brand">
          <div className="career-share-card__brand-mark">TCV</div>
        </div>

        <span className="career-share-card__stage">{player.currentStage.toUpperCase()}</span>
      </div>

      <div className="career-share-card__main">
        <aside className="career-share-card__player-card">
          <div className="career-share-card__banner">
            {banner?.image ? <img src={banner.image} alt="" draggable={false} /> : <div className="career-share-card__banner-fallback" />}
          </div>

          <div className="career-share-card__player-card-footer">
            <strong>{title?.name.es ?? "Promesa desconocida"}</strong>
          </div>
        </aside>

        <section className="career-share-card__content">
          <header className="career-share-card__hero">
            <div className="career-share-card__identity">
              <div className="career-share-card__team-line">
                {teamLogo ? <img src={teamLogo} alt={team?.name ?? ""} draggable={false} /> : <span>{team?.shortName ?? "FA"}</span>}
                <strong>{team?.shortName ?? player.currentTeam ?? "FA"}</strong>
              </div>

              <h1>{player.nickname}</h1>
              <p>{player.country} · {player.age} AÑOS · {player.role.toUpperCase()}</p>
            </div>

            <div className="career-share-card__overall">
              <strong>{overall}</strong>
              <span>GRL</span>
            </div>
          </header>

          <section className="career-share-card__summary">
            <div><span>TEMPORADAS</span><strong>{player.history.length}</strong></div>
            <div><span>RÉCORD</span><strong>{totalWins}-{totalLosses}</strong></div>
            <div><span>TROFEOS</span><strong>{palmaresTrophies.length}</strong></div>
            <div><span>MEJOR POS.</span><strong>{bestPlacement ? `#${bestPlacement}` : "-"}</strong></div>
          </section>

          <div className="career-share-card__bottom">
            <section className="career-share-card__stats">
              <StatRow label="AIM" value={player.stats.aim} />
              <StatRow label="GAME SENSE" value={player.stats.gameSense} />
              <StatRow label="COMMUNICATION" value={player.stats.communication} />
              <StatRow label="CLUTCH" value={player.stats.clutch} />
              <StatRow label="CONSISTENCY" value={player.stats.consistency} />
              <StatRow label="MENTAL" value={player.stats.mental} />
            </section>

            <section className="career-share-card__palmares">
              <div className="career-share-card__palmares-title">
                <span>PALMARÉS</span>
                {hiddenTrophies > 0 && <small>+{hiddenTrophies} MÁS</small>}
              </div>

              {groupedTrophies.length === 0 ? (
                <div className="career-share-card__palmares-empty">Aún sin títulos oficiales</div>
              ) : (
                <div className="career-share-card__trophy-grid">
                  {groupedTrophies.map((item,index) => (
                    <article key={`${item.key}-${index}`} className={`career-share-card__trophy career-share-card__trophy--${item.category.toLowerCase()}`}>
                      <div className="career-share-card__trophy-glow" />

                      <div className="career-share-card__trophy-image">
                        <img src={item.image} alt={item.name} draggable={false} />
                      </div>

                      <div className="career-share-card__trophy-content">
                        <span>{item.label}</span>
                        <strong>{item.name}</strong>
                        <small>{item.latestYear}{item.count > 1 ? ` · x${item.count}` : ""}</small>
                      </div>

                      {item.count > 1 && <div className="career-share-card__trophy-count">x{item.count}</div>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      <div className="career-share-card__footer">
        <span>VALORANT CAREER SIMULATOR</span>
      </div>
    </div>
  );
}

function StatRow({label,value}:{label:string;value:number}) {
  return (
    <div className="career-share-card__stat-row">
      <span>{label}</span>

      <div className="career-share-card__stat-bar">
        <div className="career-share-card__stat-fill" style={{width:`${value}%`}} />
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function getTrophyYear(trophy:string) {
  return trophy.match(/\b(20\d{2})\b/)?.[1] ?? "";
}

function getTrophyDisplayName(trophy:string) {
  return trophy.replace(/^\d{4}\s+/,"").replace(/\s+World Champion$/," Champions").replace(/\s+Champion$/,"");
}

function getCompactTrophyName(trophy:string) {
  return getTrophyDisplayName(trophy)
    .replace(/^VCT\s+/,"")
    .replace(/^Valorant\s+/i,"")
    .replace(/\s+Champion$/,"")
    .trim();
}

function getTrophyCategoryLabel(category:string) {
  if (category === "Kickoff") return "KICKOFF";
  if (category === "Challengers") return "CHALLENGERS";
  if (category === "Stage") return "VCT";
  if (category === "Masters") return "MASTERS";
  if (category === "Champions") return "CHAMPIONS";
  return category.toUpperCase();
}

interface GroupedPalmaresTrophy {
  key:string;
  name:string;
  label:string;
  image:string;
  category:string;
  count:number;
  latestYear:number;
}

function groupPalmaresTrophies(trophies:string[]):GroupedPalmaresTrophy[] {
  const map = new Map<string,GroupedPalmaresTrophy>();

  for (const trophy of trophies) {
    const presentation = getTrophyPresentation(trophy);
    if (!presentation) continue;

    const category = presentation.category;
    const year = Number(getTrophyYear(trophy) || 0);
    const key = getGroupedTrophyKey(trophy,category);
    const name = getGroupedTrophyName(trophy,category);
    const label = getTrophyCategoryLabel(category);

    const existing = map.get(key);

    if (existing) {
      existing.count += 1;
      existing.latestYear = Math.max(existing.latestYear,year);
      continue;
    }

    map.set(key,{
      key,
      name,
      label,
      image:presentation.image,
      category,
      count:1,
      latestYear:year,
    });
  }

  return [...map.values()].sort((a,b) => {
    if (b.latestYear !== a.latestYear) return b.latestYear - a.latestYear;
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });
}

function getGroupedTrophyKey(trophy:string,category:string) {
  const normalized = trophy.replace(/^\d{4}\s+/,"").trim();

  if (category === "Masters") return "masters";
  if (category === "Champions") return "champions";

  if (category === "Stage") {
    const region = getStageRegion(normalized);
    return `stage-${region}`;
  }

  if (category === "Kickoff") {
    const region = getKickoffRegion(normalized);
    return `kickoff-${region}`;
  }

  if (category === "Challengers") {
    const region = getChallengersRegion(normalized);
    return `challengers-${region}`;
  }

  return normalized.toLowerCase();
}

function getGroupedTrophyName(trophy:string,category:string) {
  const normalized = trophy.replace(/^\d{4}\s+/,"").trim();

  if (category === "Masters") return "Masters";
  if (category === "Champions") return "Champions";

  if (category === "Stage") {
    const region = getStageRegion(normalized);
    return `${region} Stage`;
  }

  if (category === "Kickoff") {
    const region = getKickoffRegion(normalized);
    return `${region} Kickoff`;
  }

  if (category === "Challengers") {
    const region = getChallengersRegion(normalized);
    return `${region} Challengers`;
  }

  return getCompactTrophyName(trophy);
}

function getStageRegion(value:string) {
  if (value.includes("Americas")) return "Americas";
  if (value.includes("EMEA")) return "EMEA";
  if (value.includes("Pacific")) return "Pacific";
  if (value.includes("China")) return "China";
  return "VCT";
}

function getKickoffRegion(value:string) {
  if (value.includes("Americas")) return "Americas";
  if (value.includes("EMEA")) return "EMEA";
  if (value.includes("Pacific")) return "Pacific";
  if (value.includes("China")) return "China";
  return "Kickoff";
}

function getChallengersRegion(value:string) {
  if (value.includes("LATAM")) return "LATAM";
  if (value.includes("Brazil")) return "Brazil";
  if (value.includes("North America")) return "North America";
  if (value.includes("Spain")) return "Spain";
  if (value.includes("France")) return "France";
  if (value.includes("Germany")) return "Germany";
  return "Challengers";
}