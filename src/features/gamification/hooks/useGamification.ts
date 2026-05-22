import {
  useGamificationStore,
  getXpToNextLevel,
  getCurrentLevelXp,
} from '../store/gamification.store';
import { getAchievements, getAchievementById } from '../api/gamification.api';
import { XP_PER_ACTION } from '../types/gamification.types';
import type { Achievement } from '../types/gamification.types';

export function useGamification() {
  const store = useGamificationStore();
  const allAchievements = getAchievements();

  const xpToNext = getXpToNextLevel(store.level);
  const currentLevelXp = getCurrentLevelXp(store.xp);

  const progress =
    xpToNext !== null
      ? {
          current: currentLevelXp,
          total: xpToNext - (store.xp - currentLevelXp),
          percentage: Math.min(
            100,
            Math.round((currentLevelXp / (xpToNext - (store.xp - currentLevelXp))) * 100),
          ),
        }
      : null;

  const unlockedAchievementObjs: Achievement[] = store.unlockedAchievements
    .map((id) => getAchievementById(id))
    .filter((a): a is Achievement => a !== undefined);

  const lockedAchievements: Achievement[] = allAchievements.filter(
    (a) => !store.unlockedAchievements.includes(a.id),
  );

  return {
    xp: store.xp,
    level: store.level,
    actionsCompleted: store.actionsCompleted,
    unlockedAchievements: unlockedAchievementObjs,
    lockedAchievements,
    allAchievements,
    progress,
    xpToNext,
    addXp: store.addXp,
    unlockAchievement: store.unlockAchievement,
    incrementActions: store.incrementActions,
    recordAction: (action: string) => {
      const amount = XP_PER_ACTION[action] ?? 0;
      if (amount > 0) {
        store.addXp(amount);
      }
      store.incrementActions();
    },
    reset: store.reset,
  };
}

export function useAchievements() {
  const store = useGamificationStore();
  const allAchievements = getAchievements();

  return {
    unlocked: store.unlockedAchievements,
    all: allAchievements,
    isUnlocked: (id: string) => store.unlockedAchievements.includes(id),
    unlock: store.unlockAchievement,
  };
}
