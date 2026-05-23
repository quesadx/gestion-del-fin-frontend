import { create } from 'zustand';

export type EmotionalState = 'stable' | 'alert' | 'critical';

interface EmotionalStore {
  state: EmotionalState;
  manualOverride: EmotionalState | null;
  setState: (state: EmotionalState) => void;
  setOverride: (override: EmotionalState | null) => void;
  effectiveState: () => EmotionalState;
}

export const useEmotionalStore = create<EmotionalStore>((set, get) => ({
  state: 'stable',
  manualOverride: null,
  setState: (state) => set({ state }),
  setOverride: (override) => set({ manualOverride: override }),
  effectiveState: () => get().manualOverride ?? get().state,
}));
