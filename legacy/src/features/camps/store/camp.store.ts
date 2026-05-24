import { create } from 'zustand';

interface CampState {
  activeCamp: { id: number; name?: string } | null;
  availableCamps: { id: number; name?: string }[];

  setActiveCamp: (camp: { id: number; name?: string } | null) => void;
  setAvailableCamps: (camps: { id: number; name?: string }[]) => void;
  resetCamp: () => void;
}

export const useCampStore = create<CampState>()((set) => ({
  activeCamp: null,
  availableCamps: [],

  setActiveCamp: (camp) => set({ activeCamp: camp }),
  setAvailableCamps: (camps) => set({ availableCamps: camps }),
  resetCamp: () => set({ activeCamp: null }),
}));
