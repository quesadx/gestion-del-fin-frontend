import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function xpForLevel(level: number): number {
  return level * 150;
}

function levelFromXp(xp: number): number {
  let lvl = 1;
  while (xp >= xpForLevel(lvl)) lvl++;
  return lvl;
}

interface UserProgress {
  xp: number;
  earnedAchievements: string[];
}

interface GamificationState {
  /** Per-user progress map keyed by numeric userId. */
  users: Record<number, UserProgress>;
  currentUserId: number | null;

  addXp: (amount: number) => void;
  earnAchievement: (achievementId: string) => boolean;
  recordLogin: () => void;
  ensureUserLoaded: (userId: number) => void;
  getLevel: () => number;
  getXpProgress: () => { current: number; needed: number; pct: number };
  get progress(): UserProgress;
}

function ensureProgress(users: Record<number, UserProgress>, userId: number): UserProgress {
  if (!users[userId]) {
    users[userId] = { xp: 0, earnedAchievements: [] };
  }
  return users[userId];
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => {
      const progressOf = (): UserProgress | undefined => {
        const { currentUserId, users } = get();
        return currentUserId != null ? users[currentUserId] : undefined;
      };

      return {
        users: {} as Record<number, UserProgress>,
        currentUserId: null,

        get progress(): UserProgress {
          const { currentUserId, users } = get();
          if (currentUserId == null) return { xp: 0, earnedAchievements: [] };
          return ensureProgress(users, currentUserId);
        },

        addXp: (amount) =>
          set((s) => {
            if (s.currentUserId == null) return s;
            const users = { ...s.users };
            const p = ensureProgress(users, s.currentUserId);
            users[s.currentUserId] = { ...p, xp: p.xp + amount };
            return { users };
          }),

        earnAchievement: (achievementId) => {
          const { currentUserId, users } = get();
          if (currentUserId == null) return false;
          const p = ensureProgress(users, currentUserId);
          if (p.earnedAchievements.includes(achievementId)) return false;
          set({
            users: {
              ...users,
              [currentUserId]: {
                ...p,
                earnedAchievements: [...p.earnedAchievements, achievementId],
              },
            },
          });
          return true;
        },

        recordLogin: () =>
          set((s) => {
            if (s.currentUserId == null) return s;
            const users = { ...s.users };
            const p = ensureProgress(users, s.currentUserId);
            users[s.currentUserId] = { ...p, xp: p.xp + 25 };
            return { users };
          }),

        ensureUserLoaded: (userId) => {
          const { currentUserId, users } = get();
          if (currentUserId !== userId) {
            set({ currentUserId: userId, users: { ...users } });
          }
        },

        getLevel: () => {
          const p = progressOf();
          return levelFromXp(p?.xp ?? 0);
        },

        getXpProgress: () => {
          const p = progressOf();
          const xp = p?.xp ?? 0;
          const level = levelFromXp(xp);
          const prevThreshold = xpForLevel(level - 1);
          const nextThreshold = xpForLevel(level);
          const current = xp - prevThreshold;
          const needed = nextThreshold - prevThreshold;
          return {
            current,
            needed,
            pct: needed > 0 ? Math.round((current / needed) * 100) : 100,
          };
        },
      };
    },
    { name: 'gamification-storage' },
  ),
);
