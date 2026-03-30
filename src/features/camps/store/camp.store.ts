import { create } from "zustand";

interface Camp {
  id: string;
  name: string;
}

interface CampState {
  activeCamp: Camp | null;
  availableCamps: Camp[];
  serverTime: number;
  lastSyncLocal: number;

  setActiveCamp: (camp: Camp) => void;
  setAvailableCamps: (camps: Camp[]) => void;
  resetCamp: () => void;
  setServerTime: (serverTime: number) => void;
}

export const useCampStore = create<CampState>()((set) => ({
  activeCamp: null,
  availableCamps: [],
  serverTime: 0,
  lastSyncLocal: 0,

  setActiveCamp: (camp) => set({ activeCamp: camp }),
  setAvailableCamps: (camps) => set({ availableCamps: camps }),
  resetCamp: () => set({ activeCamp: null, serverTime: 0 }),
  setServerTime: (serverTime) => set({ serverTime, lastSyncLocal: Date.now() }),
}));
