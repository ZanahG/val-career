import {useRef} from "react";
import type {CareerPlayer} from "../../types/career";
import type {VCTRosterState} from "../../types/vctRosters";
import {getVCTPlayerOverall} from "../../utils/vctPlayerOverall";
import {getPlayerOverall} from "../../utils/playerOverall";
import {getTeamLogo} from "../../utils/teamLogo";
import {TEAMS} from "../../data/teams";
import {useGameSettings} from "../../context/GameSettingsContext";
import "../../styles/VCTLeaderboard.css";

interface VCTLeaderboardProps {
  player:CareerPlayer;
  rosters:VCTRosterState;
  onBack:()=>void;
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
  const {language}=useGameSettings();
  const rows=createLeaderboardRows(player,rosters);
  const playerRowRef=useRef<HTMLElement|null>(null);
  const playerRank=rows.findIndex(row=>row.isCareerPlayer)+1;
  const playerRow=rows.find(row=>row.isCareerPlayer);
  const topThree=rows.slice(0,3);

  const scrollToPlayer=()=>{
    playerRowRef.current?.scrollIntoView({behavior:"smooth",block:"center"});
  };

  return (
    <main className="vct-leaderboard">
      <header className="vct-leaderboard__topbar">
        <div className="vct-leaderboard__brand">
          <div className="brand-mark brand-mark--small">TCV</div>
          <div>
            <strong>{language==="es"?"RANKING GLOBAL":"GLOBAL RANKING"}</strong>
            <span>VALORANT CHAMPIONS TOUR</span>
          </div>
        </div>

        <button className="vct-leaderboard__back" onClick={onBack}>
          <span>←</span>
          {language==="es"?"VOLVER":"BACK"}
        </button>
      </header>

      <div className="vct-leaderboard__content">
        <section className="vct-leaderboard__hero">
          <div className="vct-leaderboard__hero-copy">
            <span className="eyebrow">VCT GLOBAL RANKING</span>
            <h1>{language==="es"?"CLASIFICACIÓN":"LEADERBOARD"}</h1>
            <p>{language==="es"?"Los mejores jugadores del circuito internacional según su nivel general.":"The highest-rated players across the international VCT circuit."}</p>
          </div>

          {playerRow&&playerRank>0&&(
            <button className="vct-leaderboard__my-rank" onClick={scrollToPlayer}>
              <div>
                <span>{language==="es"?"TU POSICIÓN":"YOUR RANK"}</span>
                <strong>#{playerRank}</strong>
              </div>

              <div className="vct-leaderboard__my-rank-player">
                <strong>{playerRow.name}</strong>
                <span>{playerRow.team}</span>
              </div>

              <div className="vct-leaderboard__my-rank-overall">
                <span>GRL</span>
                <strong>{playerRow.overall}</strong>
              </div>

              <b>↓</b>
            </button>
          )}
        </section>

        <section className="vct-leaderboard__podium">
          {topThree.map((row,index)=>{
            const team=TEAMS.find(item=>item.name===row.team);
            const logo=getTeamLogo(team?.logo);

            return (
              <article key={row.id} className={`vct-leaderboard__podium-card vct-leaderboard__podium-card--${index+1}`}>
                <div className="vct-leaderboard__podium-rank">
                  <span>0{index+1}</span>
                  <small>{index===0?"#1":index===1?"#2":"#3"}</small>
                </div>

                <div className="vct-leaderboard__podium-player">
                  <div className="vct-leaderboard__podium-logo">
                    {logo?<img src={logo} alt={team?.name??row.team}/>:<span>{team?.shortName??"FA"}</span>}
                  </div>

                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.team}</span>
                  </div>
                </div>

                <div className="vct-leaderboard__podium-meta">
                  <span>{row.role}</span>
                  <span>{row.region}</span>
                </div>

                <div className="vct-leaderboard__podium-overall">
                  <small>GRL</small>
                  <strong>{row.overall}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="vct-leaderboard__ranking">
          <header className="vct-leaderboard__ranking-header">
            <div>
              <span className="eyebrow">{language==="es"?"RANKING DE JUGADORES":"PLAYER RANKING"}</span>
              <h2>{language==="es"?"CLASIFICACIÓN GLOBAL":"GLOBAL STANDINGS"}</h2>
            </div>

            <span className="vct-leaderboard__count">{rows.length} {language==="es"?"JUGADORES":"PLAYERS"}</span>
          </header>

          <div className="vct-leaderboard__table">
            <div className="vct-leaderboard__table-header">
              <span>#</span>
              <span>{language==="es"?"JUGADOR":"PLAYER"}</span>
              <span>{language==="es"?"EQUIPO":"TEAM"}</span>
              <span>{language==="es"?"REGIÓN":"REGION"}</span>
              <span>{language==="es"?"ROL":"ROLE"}</span>
              <span>GRL</span>
            </div>

            <div className="vct-leaderboard__rows">
              {rows.map((row,index)=>{
                const team=TEAMS.find(item=>item.name===row.team);
                const logo=getTeamLogo(team?.logo);

                return (
                  <article key={row.id} ref={row.isCareerPlayer?playerRowRef:undefined} className={`vct-leaderboard__row${row.isCareerPlayer?" vct-leaderboard__row--player":""}${index<3?" vct-leaderboard__row--top":""}`}>
                    <div className="vct-leaderboard__rank">
                      <span>{String(index+1).padStart(2,"0")}</span>
                    </div>

                    <div className="vct-leaderboard__player">
                      <strong>{row.name}</strong>
                      {row.isCareerPlayer&&<small>{language==="es"?"TÚ":"YOU"}</small>}
                    </div>

                    <div className="vct-leaderboard__team">
                      <div className="vct-leaderboard__team-logo">
                        {logo?<img src={logo} alt={team?.name??row.team}/>:<span>{team?.shortName??"FA"}</span>}
                      </div>
                      <strong>{row.team}</strong>
                    </div>

                    <span className="vct-leaderboard__region">{row.region}</span>
                    <span className="vct-leaderboard__role">{row.role}</span>

                    <div className="vct-leaderboard__overall">
                      <span>GRL</span>
                      <strong>{row.overall}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {playerRow&&(
        <button className="vct-leaderboard__find-me" onClick={scrollToPlayer}>
          <span>⌖</span>
          <div>
            <small>{language==="es"?"IR A":"GO TO"}</small>
            <strong>{language==="es"?"MI POSICIÓN":"MY RANK"}</strong>
          </div>
        </button>
      )}
    </main>
  );
}

function createLeaderboardRows(player:CareerPlayer,rosters:VCTRosterState):LeaderboardRow[] {
  const rows:LeaderboardRow[]=rosters.players.map((item,index)=>({
    id:`vct-${item.ign}-${index}`,
    name:item.ign,
    team:item.team,
    region:item.region,
    role:item.role,
    overall:getVCTPlayerOverall(item),
  }));

  if(player.currentStage==="VCT"&&player.currentTeam){
    const replacementIndex=findCareerReplacement(rows,player);
    if(replacementIndex!==-1)rows.splice(replacementIndex,1);

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

  return rows.sort((a,b)=>b.overall-a.overall||a.name.localeCompare(b.name));
}

function findCareerReplacement(rows:LeaderboardRow[],player:CareerPlayer) {
  const sameTeam=rows.map((row,index)=>({row,index})).filter(({row})=>row.team===player.currentTeam);
  if(!sameTeam.length)return -1;

  const wantedRole=normalizeRole(player.role);
  const exact=sameTeam.find(({row})=>normalizeRole(row.role)===wantedRole);
  if(exact)return exact.index;

  const flex=sameTeam.find(({row})=>normalizeRole(row.role)==="Flex");
  if(flex)return flex.index;

  return sameTeam[0].index;
}

function normalizeRole(role:string) {
  if(role==="Duelista"||role==="Duelist")return "Duelist";
  if(role==="Iniciador"||role==="Initiator")return "Initiator";
  if(role==="Controlador"||role==="Controller")return "Controller";
  if(role==="Centinela"||role==="Sentinel")return "Sentinel";
  if(role==="IGL")return "IGL";
  return "Flex";
}

function getCareerCircuitLabel(player:CareerPlayer) {
  if(player.region==="LATAM"||player.region==="Brazil"||player.region==="North America")return "VCT Americas";
  if(player.region==="Europe"||player.region==="MENA"||player.region==="Turkey"||player.region==="CIS")return "VCT EMEA";
  if(player.region==="China")return "VCT China";
  return "VCT Pacific";
}