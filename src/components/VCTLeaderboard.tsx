import {useRef} from "react";
import type {CareerPlayer} from "../types/career";
import type {VCTRosterState} from "../types/vctRosters";
import {getVCTPlayerOverall} from "../utils/vctPlayerOverall";
import {getPlayerOverall} from "../utils/playerOverall";
import {getTeamLogo} from "../utils/teamLogo";
import {TEAMS} from "../data/teams";
import "../styles/VCTLeaderboard.css";

interface VCTLeaderboardProps {
  player:CareerPlayer;
  rosters:VCTRosterState;
  onBack:() => void;
}

interface LeaderboardRow {
  id:string;
  name:string;
  team:string;
  region:string;
  role:string;
  overall:number;
  isCareerPlayer?:boolean;
}

export function VCTLeaderboard({player,rosters,onBack}:VCTLeaderboardProps) {
  const rows = createLeaderboardRows(player,rosters);
  const playerRowRef = useRef<HTMLElement|null>(null);

  const scrollToPlayer = () => {
    playerRowRef.current?.scrollIntoView({behavior:"smooth",block:"center"});
  };

  return (
    <main className="vct-leaderboard">
      <header className="vct-leaderboard__header">
        <div>
          <span className="eyebrow">VCT GLOBAL RANKING</span>
          <h1>LEADERBOARD</h1>
          <p>Top players across Americas, EMEA, Pacific and China.</p>
        </div>

        <button className="vct-leaderboard__back" onClick={onBack}>← BACK</button>
      </header>

      <section className="vct-leaderboard__table">
        <div className="vct-leaderboard__table-header">
          <span>#</span>
          <span>PLAYER</span>
          <span>TEAM</span>
          <span>REGION</span>
          <span>ROLE</span>
          <span>GRL</span>
        </div>

        <div className="vct-leaderboard__rows">
          {rows.map((row,index) => {
            const team = TEAMS.find((item) => item.name === row.team);
            const logo = getTeamLogo(team?.logo);

            return (
              <article
                key={row.id}
                ref={row.isCareerPlayer ? playerRowRef : undefined}
                className={`vct-leaderboard__row${row.isCareerPlayer ? " vct-leaderboard__row--player" : ""}`}
              >
                <strong className="vct-leaderboard__rank">{index + 1}</strong>

                <div className="vct-leaderboard__player">
                  <strong>{row.name}</strong>
                  {row.isCareerPlayer && <small>YOU</small>}
                </div>

                <div className="vct-leaderboard__team">
                  {logo ? <img src={logo} alt={team?.name ?? row.team} /> : <span>{team?.shortName ?? "FA"}</span>}
                  <strong>{row.team}</strong>
                </div>

                <span className="vct-leaderboard__region">{row.region}</span>
                <span className="vct-leaderboard__role">{row.role}</span>
                <strong className="vct-leaderboard__overall">{row.overall}</strong>
              </article>
            );
          })}
        </div>
      </section>

      <button className="vct-leaderboard__find-me" onClick={scrollToPlayer}>
        <span>◎</span>
        FIND ME
      </button>
    </main>
  );
}

function createLeaderboardRows(player:CareerPlayer,rosters:VCTRosterState):LeaderboardRow[] {
  const rows:LeaderboardRow[] = rosters.players.map((item,index) => ({
    id:`vct-${item.ign}-${index}`,
    name:item.ign,
    team:item.team,
    region:item.region,
    role:item.role,
    overall:getVCTPlayerOverall(item),
  }));

  if (player.currentStage === "VCT" && player.currentTeam) {
    const replacementIndex = findCareerReplacement(rows,player);

    if (replacementIndex !== -1) rows.splice(replacementIndex,1);

    rows.push({
      id:"career-player",
      name:player.nickname,
      team:player.currentTeam,
      region:getCareerCircuitLabel(player),
      role:player.role,
      overall:getPlayerOverall(player),
      isCareerPlayer:true,
    });
  }

  return rows.sort((a,b) => b.overall - a.overall || a.name.localeCompare(b.name));
}

function findCareerReplacement(rows:LeaderboardRow[],player:CareerPlayer) {
  const sameTeam = rows
    .map((row,index) => ({row,index}))
    .filter(({row}) => row.team === player.currentTeam);

  if (!sameTeam.length) return -1;

  const wantedRole = normalizeRole(player.role);

  const exact = sameTeam.find(({row}) => normalizeRole(row.role) === wantedRole);
  if (exact) return exact.index;

  const flex = sameTeam.find(({row}) => normalizeRole(row.role) === "Flex");
  if (flex) return flex.index;

  return sameTeam[0].index;
}

function normalizeRole(role:string) {
  if (role === "Duelista" || role === "Duelist") return "Duelist";
  if (role === "Iniciador" || role === "Initiator") return "Initiator";
  if (role === "Controlador" || role === "Controller") return "Controller";
  if (role === "Centinela" || role === "Sentinel") return "Sentinel";
  if (role === "IGL") return "IGL";
  return "Flex";
}

function getCareerCircuitLabel(player:CareerPlayer) {
  if (player.region === "LATAM" || player.region === "Brazil" || player.region === "North America") return "VCT Americas";
  if (player.region === "Europe" || player.region === "MENA" || player.region === "Turkey" || player.region === "CIS") return "VCT EMEA";
  if (player.region === "China") return "VCT China";
  return "VCT Pacific";
}