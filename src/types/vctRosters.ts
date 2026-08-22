import type {VCTRealPlayer} from "../data/vctPlayers";

export interface VCTTransfer {
  season:number;
  player:string;
  from:string;
  to:string;
}

export interface VCTRosterState {
  season:number;
  initialized:boolean;
  players:VCTRealPlayer[];
  transfers:VCTTransfer[];
}