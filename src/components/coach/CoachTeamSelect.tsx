import {useEffect,useMemo,useState} from "react";
import {TEAMS} from "../../data/teams";
import {createCoachCareer} from "../../logic/coachCareer";
import type {CoachCareerState} from "../../types/coach";
import type {CompetitiveCircuit,MarketRegion} from "../../types/career";
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

  const selectedTeam=stageTeams.find(team=>team.id===selectedTeamId);

  useEffect(()=>{
    if(region!==ALL_REGIONS&&!regions.includes(region))setRegion(ALL_REGIONS);
  },[region,regions]);

  useEffect(()=>{
    if(subregion!==ALL_REGIONS&&!subregions.includes(subregion))setSubregion(ALL_REGIONS);
  },[subregion,subregions]);

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
      <header className="coach-team-select__header">
        <span>TuCarreraValorant</span>
        <h1>MODO COACH</h1>
        <p>Elige tu club, construye el roster y dirige una temporada completa dentro del circuito competitivo.</p>
      </header>

      <nav className="coach-team-select__stage-tabs">
        <button className={stage==="VCT"?"active":""} onClick={()=>changeStage("VCT")}>
          <span>01</span>
          VCT
        </button>

        <button className={stage==="Tier 2"?"active":""} onClick={()=>changeStage("Tier 2")}>
          <span>02</span>
          CHALLENGERS
        </button>
      </nav>

      <section className="coach-team-select__region-navigation">
        <div className="coach-team-select__region-tabs">
          <button className={region===ALL_REGIONS?"active":""} onClick={()=>changeRegion(ALL_REGIONS)}>TODAS</button>

          {regions.map(item=>(
            <button key={item} className={region===item?"active":""} onClick={()=>changeRegion(item)}>
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        {subregions.length>1&&(
          <div className="coach-team-select__subregion-tabs">
            <button className={subregion===ALL_REGIONS?"active":""} onClick={()=>changeSubregion(ALL_REGIONS)}>TODAS</button>

            {subregions.map(item=>(
              <button key={item} className={subregion===item?"active":""} onClick={()=>changeSubregion(item)}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="coach-team-select__setup">
        <div className="coach-team-select__selected-club">
          <div className="coach-team-select__selected-logo">
            {selectedTeam?(
              <>
                {getTeamLogo(selectedTeam.logo)&&<img src={getTeamLogo(selectedTeam.logo)} alt={selectedTeam.name}/>}
              </>
            ):(
              <span>?</span>
            )}
          </div>

          <div>
            <span>CLUB SELECCIONADO</span>
            <strong>{selectedTeam?.name??"Selecciona un club"}</strong>
            <small>{selectedTeam?`${selectedTeam.circuit} · ${selectedTeam.marketRegion}`:"Elige un equipo para comenzar"}</small>
          </div>
        </div>

        <label>
          <span>NOMBRE DEL COACH</span>
          <input value={name} maxLength={20} onChange={e=>setName(e.target.value)}/>
        </label>

        <label>
          <span>NACIONALIDAD</span>
          <input value={nationality} maxLength={24} onChange={e=>setNationality(e.target.value)}/>
        </label>

        <label className="coach-team-select__age">
          <span>EDAD</span>
          <input type="number" min={18} max={70} value={age} onChange={e=>setAge(Math.max(18,Math.min(70,Number(e.target.value))))}/>
        </label>

        <button className="coach-team-select__start-button" disabled={!selectedTeam} onClick={startCareer}>
          <span>
            <small>NUEVA CARRERA</small>
            COMENZAR COMO COACH
          </span>
          <b>→</b>
        </button>
      </section>

      <section className="coach-team-select__clubs-header">
        <div>
          <span>{stage==="VCT"?"VCT":"CHALLENGERS"}</span>
          <strong>{getSelectionTitle(region,subregion)}</strong>
        </div>

        <span>{teams.length} CLUB{teams.length===1?"":"ES"}</span>
      </section>

      <section className="coach-team-select__teams">
        {teams.map(team=>{
          const logo=getTeamLogo(team.logo);
          const selected=selectedTeamId===team.id;

          return (
            <button
              key={team.id}
              className={`coach-team-card${selected?" coach-team-card--selected":""}`}
              onClick={()=>setSelectedTeamId(team.id)}
            >
              <div className="coach-team-card__logo">
                {logo?<img src={logo} alt={team.name}/>:<span>{team.shortName}</span>}
              </div>

              <div className="coach-team-card__info">
                <strong>{team.name}</strong>
                <span>{team.circuit}</span>
                <small>{team.marketRegion}</small>
              </div>

              {selected&&<div className="coach-team-card__selected">SELECCIONADO</div>}
            </button>
          );
        })}
      </section>

      {!teams.length&&(
        <div className="coach-team-select__empty">
          No hay clubes disponibles para estos filtros.
        </div>
      )}
    </main>
  );
}

function getSelectionTitle(region:RegionFilter,subregion:SubregionFilter) {
  if(subregion!==ALL_REGIONS)return subregion.toUpperCase();
  if(region!==ALL_REGIONS)return region.toUpperCase();
  return "TODOS LOS CLUBES";
}