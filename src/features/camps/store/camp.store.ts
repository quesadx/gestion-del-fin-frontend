import { create } from 'zustand';

interface CampState {
  activeCamp: { id: number; name?: string } | null;
  availableCamps: { id: number; name?: string }[];
  serverTime: number;
  lastSyncLocal: number;

  setActiveCamp: (camp: { id: number; name?: string } | null) => void;
  setAvailableCamps: (camps: { id: number; name?: string }[]) => void;
  resetCamp: () => void;
  syncServerTime: (serverTime: number) => void;
}

export const useCampStore = create<CampState>()((set) => ({
  activeCamp: null,
  availableCamps: [],
  serverTime: 0,
  lastSyncLocal: 0,

  setActiveCamp: (camp) => set({ activeCamp: camp }),
  setAvailableCamps: (camps) => set({ availableCamps: camps }),
  resetCamp: () => set({ activeCamp: null, serverTime: 0, lastSyncLocal: 0 }),
  syncServerTime: (serverTime) => set({ serverTime, lastSyncLocal: Date.now() }),
}));
