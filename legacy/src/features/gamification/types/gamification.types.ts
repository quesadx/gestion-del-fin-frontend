export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'exploration' | 'resources' | 'community' | 'survival' | 'system';
  xpReward: number;
}

export interface UserProgress {
  xp: number;
  level: number;
  unlockedAchievements: string[];
  actionsCompleted: number;
}

export interface Level {
  level: number;
  name: string;
  xpRequired: number;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'SURVIVOR', xpRequired: 0 },
  { level: 2, name: 'SCOUT', xpRequired: 100 },
  { level: 3, name: 'RANGER', xpRequired: 300 },
  { level: 4, name: 'VETERAN', xpRequired: 600 },
  { level: 5, name: 'COMMANDER', xpRequired: 1000 },
  { level: 6, name: 'WARLORD', xpRequired: 1500 },
  { level: 7, name: 'LEGEND', xpRequired: 2500 },
];

export const XP_PER_ACTION: Record<string, number> = {
  CREATE_CAMP: 30,
  CREATE_PERSON: 20,
  CREATE_EXPLORATION: 25,
  COMPLETE_EXPLORATION: 40,
  CREATE_TRANSFER: 15,
  APPROVE_TRANSFER: 20,
  ADMIT_PERSON: 25,
  MANAGE_INVENTORY: 10,
  DAILY_LOGIN: 5,
};
