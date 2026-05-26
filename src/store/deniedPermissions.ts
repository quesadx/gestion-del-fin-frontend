import { create } from 'zustand';

interface DeniedPermissionsState {
  denied: Set<string>;
  markDenied: (permission: string) => void;
  reset: () => void;
}

export const useDeniedPermissionsStore = create<DeniedPermissionsState>((set) => ({
  denied: new Set(),
  markDenied: (permission: string) =>
    set((state) => {
      const next = new Set(state.denied);
      next.add(permission);
      if (next.size !== state.denied.size) {
        return { denied: next };
      }
      return state;
    }),
  reset: () => set({ denied: new Set() }),
}));
