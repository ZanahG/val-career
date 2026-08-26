import {useEffect,useState} from "react";
import type {CoachCareerState} from "../types/coach";
import type {GameScreen} from "../types/navigation";
import {clearCoachCareerSave,hasCoachCareerSave,saveCoachCareer} from "../utils/coachSaveGame";

interface UseCoachSaveParams {
  career:CoachCareerState|null;
  screen:GameScreen;
}

export function useCoachSave({career,screen}:UseCoachSaveParams) {
  const [saveAvailable,setSaveAvailable]=useState(hasCoachCareerSave);

  useEffect(()=>{
    if(!career)return;

    saveCoachCareer(career,screen);
    setSaveAvailable(true);
  },[career,screen]);

  const clearSave=()=>{
    clearCoachCareerSave();
    setSaveAvailable(false);
  };

  return {
    coachSaveAvailable:saveAvailable,
    clearCoachSave:clearSave,
  };
}