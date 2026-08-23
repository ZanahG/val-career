import kickoffTrophy from "../images/trophies/kickoff.png";
import vctAmericasStage from "../images/trophies/vct-ame-stage.png";
import vctEmeaStage from "../images/trophies/vct-emea-stage.png";
import vctPacificStage from "../images/trophies/vct-pacific-stage.png";
import vctChinaStage from "../images/trophies/vct-china-stage.png";
import mastersTrophy from "../images/trophies/masters.png";
import championsTrophy from "../images/trophies/champions.png";
import challengersTrophy from "../images/trophies/masters.png";

export interface TrophyPresentation {
  image:string;
  category:"Kickoff"|"Challengers"|"Stage"|"Masters"|"Champions";
}

export function getTrophyPresentation(trophy:string):TrophyPresentation|null {
  if (trophy.includes("Kickoff")) return {image:kickoffTrophy,category:"Kickoff"};

  if (trophy.includes("Challengers")) return {image:challengersTrophy,category:"Challengers"};

  if (trophy.includes("Stage 1") || trophy.includes("Stage 2")) {
    if (trophy.includes("Americas")) return {image:vctAmericasStage,category:"Stage"};
    if (trophy.includes("EMEA")) return {image:vctEmeaStage,category:"Stage"};
    if (trophy.includes("Pacific")) return {image:vctPacificStage,category:"Stage"};
    if (trophy.includes("China")) return {image:vctChinaStage,category:"Stage"};
  }

  if (trophy.includes("Masters")) return {image:mastersTrophy,category:"Masters"};
  if (trophy.includes("World Champion") || trophy.includes("Champions")) return {image:championsTrophy,category:"Champions"};

  return null;
}

export function isPalmaresTrophy(trophy:string) {
  return getTrophyPresentation(trophy) !== null;
}