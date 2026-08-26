import {useEffect,useMemo,useState} from "react";
import {TEAMS} from "../../data/teams";
import {createCoachCareer} from "../../logic/coachCareer";
import {getCoachClubProfile,type CoachClubExpectation,type CoachClubLevel} from "../../logic/coachClubProfile";
import {CountrySelect} from "../shared/CountrySelect";
import {useGameSettings} from "../../context/GameSettingsContext";
import type {CoachCareerState} from "../../types/coach";
import type {CompetitiveCircuit,MarketRegion,TeamDefinition} from "../../types/career";
import {getTeamLogo} from "../../utils/teamLogo";
import "../../styles/CoachTeamSelect.css";

interface CoachTeamSelectProps {
  onStart:(career:CoachCareerState)=>void;
}

type CoachStageFilter="VCT"|"Tier 2";
const ALL_REGIONS="ALL" as const;
type RegionFilter=CompetitiveCircuit|typeof ALL_REGIONS;
type SubregionFilter=MarketRegion|typeof ALL_REGIONS;

export function CoachTeamSelect({onStart}:CoachTeamSelectProps) {
  const {language}=useGameSettings();
  const [stage,setStage]=useState<CoachStageFilter>("VCT");
  const [region,setRegion]=useState<RegionFilter>(ALL_REGIONS);
  const [subregion,setSubregion]=useState<SubregionFilter>(ALL_REGIONS);
  const [selectedTeamId,setSelectedTeamId]=useState("");
  const [name,setName]=useState("Coach");
  const [nationality,setNationality]=useState("Chile");
  const [age,setAge]=useState(28);

  const stageTeams=useMemo(()=>TEAMS.filter(team=>stage==="VCT"?team.tier===1:team.tier===2),[stage]);

  const regionTeams=useMemo(
    ()=>region===ALL_REGIONS?stageTeams:stageTeams.filter(team=>team.circuit===region),
    [stageTeams,region],
  );

  const regions=useMemo<CompetitiveCircuit[]>(
    ()=>[...new Set(stageTeams.map(team=>team.circuit).filter((value):value is CompetitiveCircuit=>Boolean(value)))].sort(),
    [stageTeams],
  );

  const subregions=useMemo<MarketRegion[]>(
    ()=>[...new Set(regionTeams.map(team=>team.marketRegion).filter((value):value is MarketRegion=>Boolean(value)))].sort(),
    [regionTeams],
  );

  const teams=useMemo(
    ()=>subregion===ALL_REGIONS?regionTeams:regionTeams.filter(team=>team.marketRegion===subregion),
    [regionTeams,subregion],
  );

  const selectedTeam=teams.find(team=>team.id===selectedTeamId)??teams[0]??null;
  const selectedIndex=selectedTeam?teams.findIndex(team=>team.id===selectedTeam.id):-1;
  const profile=selectedTeam?getCoachClubProfile(selectedTeam):null;

  useEffect(()=>{
    if(region!==ALL_REGIONS&&!regions.includes(region))setRegion(ALL_REGIONS);
  },[region,regions]);

  useEffect(()=>{
    if(subregion!==ALL_REGIONS&&!subregions.includes(subregion))setSubregion(ALL_REGIONS);
  },[subregion,subregions]);

  useEffect(()=>{
    if(!teams.length){
      setSelectedTeamId("");
      return;
    }

    if(!teams.some(team=>team.id===selectedTeamId)){
      setSelectedTeamId(teams[0].id);
    }
  },[teams,selectedTeamId]);

  const changeStage=(nextStage:CoachStageFilter)=>{
    setStage(nextStage);
    setRegion(ALL_REGIONS);
    setSubregion(ALL_REGIONS);
    setSelectedTeamId("");
  };

  const changeRegion=(nextRegion:RegionFilter)=>{
    setRegion(nextRegion);
    setSubregion(ALL_REGIONS);
    setSelectedTeamId("");
  };

  const changeSubregion=(nextSubregion:SubregionFilter)=>{
    setSubregion(nextSubregion);
    setSelectedTeamId("");
  };

  const changeTeam=(direction:-1|1)=>{
    if(!teams.length||selectedIndex<0)return;

    const nextIndex=(selectedIndex+direction+teams.length)%teams.length;
    setSelectedTeamId(teams[nextIndex].id);
  };

  const startCareer=()=>{
    if(!selectedTeam)return;

    onStart(
      createCoachCareer(
        selectedTeam,
        name.trim()||"Coach",
        nationality.trim()||"Chile",
        age,
      ),
    );
  };

  return (
    <main className="coach-team-select">
      <header className="coach-team-select__top">
        <div>
          <span>TUCARRERAVALORANT</span>
          <h1>SELECCIONAR CLUB</h1>
        </div>

        <nav className="coach-team-select__stage-tabs">
          <button className={stage==="VCT"?"active":""} onClick={()=>changeStage("VCT")}>VCT</button>
          <button className={stage==="Tier 2"?"active":""} onClick={()=>changeStage("Tier 2")}>CHALLENGERS</button>
        </nav>
      </header>

      <section className="coach-team-select__navigation">
        <div className="coach-team-select__region-tabs">
          <button className={region===ALL_REGIONS?"active":""} onClick={()=>changeRegion(ALL_REGIONS)}>TODAS</button>

          {regions.map(item=>(
            <button key={item} className={region===item?"active":""} onClick={()=>changeRegion(item)}>{item.toUpperCase()}</button>
          ))}
        </div>

        {stage==="Tier 2"&&subregions.length>1&&(
          <div className="coach-team-select__subregion-tabs">
            <button className={subregion===ALL_REGIONS?"active":""} onClick={()=>changeSubregion(ALL_REGIONS)}>TODAS</button>

            {subregions.map(item=>(
              <button key={item} className={subregion===item?"active":""} onClick={()=>changeSubregion(item)}>{item.toUpperCase()}</button>
            ))}
          </div>
        )}
      </section>

      {selectedTeam&&profile?(
        <>
          <section className="coach-team-select__club-dashboard">
            <ClubIdentity team={selectedTeam} stars={profile.stars} onPrevious={()=>changeTeam(-1)} onNext={()=>changeTeam(1)}/>

            <JerseyPanel team={selectedTeam}/>

            <section className="coach-team-select__club-information">
              <div className="coach-team-select__founded">
                <span>FUNDADO</span>
                <strong>{profile.founded??"—"}</strong>
              </div>

              <div className="coach-team-select__financial-grid">
                <InfoStat label="VALOR DEL CLUB" value={formatClubMoney(profile.clubValue)}/>
                <InfoStat label="PRESUP. TRASPASOS" value={formatClubMoney(profile.transferBudget)}/>
              </div>

              <div className="coach-team-select__club-record">
                <div>
                  <span>PRESTIGIO</span>
                  <strong>{selectedTeam.prestige}</strong>
                </div>

                <div>
                  <span>FUERZA</span>
                  <strong>{selectedTeam.strength}</strong>
                </div>
              </div>
            </section>

            <section className="coach-team-select__project">
              <ProjectCard label="EXPECTATIVAS" value={formatExpectation(profile.expectation)} level={getExpectationLevel(profile.expectation)}/>
              <ProjectCard label="AFICIÓN" value={formatLevel(profile.fanSupport)} level={profile.fanSupport}/>
              <ProjectCard label="ESTABILIDAD" value={formatLevel(profile.stability)} level={profile.stability}/>
            </section>
          </section>

          <section className="coach-team-select__competition-banner">
            <span>{stage==="VCT"?"VCT":"CHALLENGERS"}</span>
            <strong>{getCompetitionName(selectedTeam,stage)}</strong>
            <small>{selectedIndex+1} / {teams.length}</small>
          </section>
        </>
      ):(
        <div className="coach-team-select__empty">No hay clubes disponibles para esta competición.</div>
      )}

      <section className="coach-team-select__coach-setup">
        <label>
          <span>NOMBRE DEL COACH</span>
          <input value={name} maxLength={20} onChange={event=>setName(event.target.value)}/>
        </label>

        <div className="coach-team-select__country-field">
          <span>NACIONALIDAD</span>
          <div className="coach-team-select__country-select">
            <CountrySelect value={nationality} language={language} onChange={setNationality}/>
          </div>
        </div>

        <label className="coach-team-select__age">
          <span>EDAD</span>
          <input type="number" min={18} max={70} value={age} onChange={event=>setAge(Math.max(18,Math.min(70,Number(event.target.value))))}/>
        </label>

        <button className="coach-team-select__start-button" disabled={!selectedTeam} onClick={startCareer}>
          <span>
            <small>NUEVA CARRERA</small>
            COMENZAR COMO COACH
          </span>
          <b>→</b>
        </button>
      </section>
    </main>
  );
}

function ClubIdentity({team,stars,onPrevious,onNext}:{team:TeamDefinition;stars:number;onPrevious:()=>void;onNext:()=>void}) {
  const logo=getTeamLogo(team.logo);

  return (
    <section className="coach-team-select__identity">
      <span className="coach-team-select__panel-label">CLUB</span>
      <h2>{team.name.toUpperCase()}</h2>

      <div className="coach-team-select__logo-wrapper">
        <button onClick={onPrevious}>‹</button>
        <div className="coach-team-select__main-logo">{logo?<img src={logo} alt={team.name}/>:<span>{team.shortName}</span>}</div>
        <button onClick={onNext}>›</button>
      </div>

      <ClubStars stars={stars}/>
    </section>
  );
}

function JerseyPanel({team}:{team:TeamDefinition}) {
  const logo=getTeamLogo(team.logo);

  return (
    <section className="coach-team-select__jersey-panel">
      <span className="coach-team-select__panel-label">EQUIPACIÓN</span>
      <strong>1.ª EQUIPACIÓN</strong>

      <div className="coach-team-select__jersey">
        <div className="coach-team-select__jersey-neck"/>
        <div className="coach-team-select__jersey-body">
          {logo&&<img src={logo} alt=""/>}
        </div>
        <div className="coach-team-select__jersey-left"/>
        <div className="coach-team-select__jersey-right"/>
      </div>

      <small>{team.shortName}</small>
    </section>
  );
}

function InfoStat({label,value}:{label:string;value:string}) {
  return (
    <div className="coach-team-select__info-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProjectCard({label,value,level}:{label:string;value:string;level:CoachClubLevel}) {
  return (
    <article className={`coach-team-select__project-card coach-team-select__project-card--${level.toLowerCase().replace(" ","-")}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="coach-team-select__project-meter"><i/></div>
    </article>
  );
}

function ClubStars({stars}:{stars:number}) {
  return (
    <div className="coach-team-select__stars" aria-label={`${stars} estrellas`}>
      {[1,2,3,4,5].map(star=>{
        const full=stars>=star;
        const half=!full&&stars>=star-.5;

        return <span key={star} className={full?"full":half?"half":""}>★</span>;
      })}
    </div>
  );
}

function getCompetitionName(team:TeamDefinition,stage:CoachStageFilter) {
  if(stage==="VCT")return `VCT ${team.circuit}`.toUpperCase();

  return `CHALLENGERS ${team.marketRegion}`.toUpperCase();
}

function getExpectationLevel(expectation:CoachClubExpectation):CoachClubLevel {
  if(expectation==="TITLES")return "CRUCIAL";
  if(expectation==="INTERNATIONAL")return "HIGH";
  if(expectation==="PLAYOFFS")return "HIGH";
  if(expectation==="COMPETE")return "MEDIUM";

  return "LOW";
}

function formatExpectation(expectation:CoachClubExpectation) {
  if(expectation==="TITLES")return "GANAR TÍTULOS";
  if(expectation==="INTERNATIONAL")return "TORNEOS INTERNACIONALES";
  if(expectation==="PLAYOFFS")return "CLASIFICAR A PLAYOFFS";
  if(expectation==="COMPETE")return "SER COMPETITIVOS";

  return "DESARROLLAR EL PROYECTO";
}

function formatLevel(level:CoachClubLevel) {
  if(level==="CRUCIAL")return "CRUCIAL";
  if(level==="HIGH")return "ALTA";
  if(level==="MEDIUM")return "MEDIA";

  return "BAJA";
}

function formatClubMoney(value:number) {
  if(value>=1000000000)return `$${(value/1000000000).toFixed(2)}B`;
  if(value>=1000000)return `$${(value/1000000).toFixed(value>=10000000?1:2)}M`;
  if(value>=1000)return `$${Math.round(value/1000)}K`;

  return `$${value}`;
}