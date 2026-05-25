import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LEVELS, type UserProgress } from '../types/gamification.types';

interface GamificationState extends UserProgress {
  addXp: (amount: number) => void;
  unlockAchievement: (achievementId: string) => boolean;
  incrementActions: () => void;
  reset: () => void;
}

function getLevelForXp(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      unlockedAchievements: [],
      actionsCompleted: 0,

      addXp: (amount) => {
        const newXp = get().xp + amount;
        const newLevel = getLevelForXp(newXp);
        set({ xp: newXp, level: newLevel });
      },

      unlockAchievement: (achievementId) => {
        const { unlockedAchievements } = get();
        if (unlockedAchievements.includes(achievementId)) {
          return false;
        }
        set({ unlockedAchievements: [...unlockedAchievements, achievementId] });
        return true;
      },

      incrementActions: () => set((state) => ({ actionsCompleted: state.actionsCompleted + 1 })),

      reset: () =>
        set({
          xp: 0,
          level: 1,
          unlockedAchievements: [],
          actionsCompleted: 0,
        }),
    }),
    {
      name: 'gdf.gamification',
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        unlockedAchievements: state.unlockedAchievements,
        actionsCompleted: state.actionsCompleted,
      }),
    },
  ),
);

export function getXpToNextLevel(level: number): number | null {
  const next = LEVELS.find((l) => l.level === level + 1);
  return next?.xpRequired ?? null;
}

export function getCurrentLevelXp(xp: number): number {
  const level = getLevelForXp(xp);
  const current = LEVELS.find((l) => l.level === level);
  const currentXp = current?.xpRequired ?? 0;
  return xp - currentXp;
}

export function getLevelName(level: number): string {
  return LEVELS.find((l) => l.level === level)?.name ?? 'UNKNOWN';
}
