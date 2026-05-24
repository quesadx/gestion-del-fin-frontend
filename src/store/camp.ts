import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CampState {
  currentCampId: number | null;
  setCurrentCamp: (campId: number | null) => void;
}

export const useCampStore = create<CampState>()(
  persist(
    (set) => ({
      currentCampId: null,
      setCurrentCamp: (campId) => set({ currentCampId: campId }),
    }),
    { name: "camp-storage" },
  ),
);
