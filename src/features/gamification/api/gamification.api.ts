import type { Achievement } from '../types/gamification.types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_camp',
    name: 'CAMP FOUNDER',
    description: 'Created the first camp',
    icon: 'camp',
    category: 'system',
    xpReward: 50,
  },
  {
    id: 'five_camps',
    name: 'NETWORK BUILDER',
    description: 'Established 5 camps',
    icon: 'camps',
    category: 'system',
    xpReward: 100,
  },
  {
    id: 'first_exploration',
    name: 'INTO THE WASTES',
    description: 'Launched the first exploration',
    icon: 'exploration',
    category: 'exploration',
    xpReward: 40,
  },
  {
    id: 'ten_explorations',
    name: 'WASTELAND VETERAN',
    description: 'Completed 10 explorations',
    icon: 'explorations',
    category: 'exploration',
    xpReward: 150,
  },
  {
    id: 'first_transfer',
    name: 'FIRST CONVOY',
    description: 'Executed the first transfer between camps',
    icon: 'transfer',
    category: 'resources',
    xpReward: 30,
  },
  {
    id: 'ten_people',
    name: 'PEOPLE MANAGER',
    description: 'Registered 10 people across camps',
    icon: 'people',
    category: 'community',
    xpReward: 80,
  },
  {
    id: 'auto_daily',
    name: 'AUTO PILOT',
    description: 'Configured auto-daily resource processing',
    icon: 'auto',
    category: 'resources',
    xpReward: 60,
  },
  {
    id: 'first_admission',
    name: 'GATEKEEPER',
    description: 'Processed the first AI-assisted admission',
    icon: 'admission',
    category: 'community',
    xpReward: 50,
  },
  {
    id: 'level_three',
    name: 'RANGER STATUS',
    description: 'Reached level 3',
    icon: 'level',
    category: 'system',
    xpReward: 100,
  },
];

let achievementsCache: Achievement[] | null = null;

export function getAchievements(): Achievement[] {
  if (!achievementsCache) {
    achievementsCache = ACHIEVEMENTS;
  }
  return achievementsCache;
}

export function getAchievementById(id: string): Achievement | undefined {
  return getAchievements().find((a) => a.id === id);
}
