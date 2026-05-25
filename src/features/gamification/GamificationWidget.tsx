import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGamificationStore, useCampStore, useAuthStore } from '../../store';
import { apiClient, unwrapList } from '../../lib/api';
import { GamificationAchievement, InventoryItem } from '../../types';
import { Shield, Star, Trophy, Award } from 'lucide-react';

/**
 * Achievement definitions mirror the backend-seeded achievements table
 * (prisma/seed.ts lines 861-886). Persisted locally via Zustand — no backend
 * achievements endpoint exists, so unlock state lives only in localStorage.
 */
const ACHIEVEMENTS: GamificationAchievement[] = [
  {
    id: 'first-acceptance',
    name: 'First Acceptance',
    description: 'Successfully reviewed and admitted a new survivor.',
    icon: 'Shield',
    xpReward: 75,
  },
  {
    id: 'expedition-veteran',
    name: 'Expedition Veteran',
    description: 'Served on multiple expedition teams.',
    icon: 'Star',
    xpReward: 100,
  },
  {
    id: 'supply-stabilizer',
    name: 'Supply Stabilizer',
    description: 'Helped keep the camp resource stock above minimum thresholds.',
    icon: 'Trophy',
    xpReward: 50,
  },
  {
    id: 'transfer-coordinator',
    name: 'Transfer Coordinator',
    description: 'Processed a transfer from request to completion.',
    icon: 'Award',
    xpReward: 100,
  },
];

const ICON_MAP: Record<string, typeof Shield> = {
  Shield,
  Star,
  Trophy,
  Award,
};

export default function GamificationWidget() {
  const { currentCampId } = useCampStore();
  const { userId } = useAuthStore();
  const store = useGamificationStore();

  const earnedAchievements =
    (userId != null ? store.users[userId]?.earnedAchievements : null) ?? [];
  const xp = (userId != null ? store.users[userId]?.xp : null) ?? 0;

  const { data: hasAcceptedAdmission } = useQuery<boolean>({
    queryKey: ['gamification-accepted', currentCampId, userId],
    queryFn: async () => {
      const res = await apiClient.get(`/admission/camps/${currentCampId}`);
      const list = unwrapList<{ reviewed_by?: number | null; final_decision?: string }>(res.data);
      return list.some((a) => a.reviewed_by === userId && a.final_decision === 'ACCEPTED');
    },
    enabled: !!currentCampId && !!userId,
    staleTime: 120_000,
  });

  const { data: hasStableSupply } = useQuery<boolean>({
    queryKey: ['gamification-supply', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/inventory/${currentCampId}`);
      const items: InventoryItem[] = unwrapList<InventoryItem>(res.data);
      return items.some((item) => {
        const qty = item.quantity ?? 0;
        const minStock = item.resource_type?.minimum_stock ?? item.minimum_stock ?? 0;
        return qty > minStock;
      });
    },
    enabled: !!currentCampId,
    staleTime: 120_000,
  });

  const { data: hasCompletedTransfer } = useQuery<boolean>({
    queryKey: ['gamification-transfer', userId],
    queryFn: async () => {
      const res = await apiClient.get('/transfers');
      const list = unwrapList<{
        requested_by?: number | null;
        status?: string;
      }>(res.data);
      return list.some((t) => t.requested_by === userId && t.status === 'COMPLETED');
    },
    enabled: !!userId,
    staleTime: 120_000,
  });

  useEffect(() => {
    const { earnAchievement, addXp } = store;

    for (const ach of ACHIEVEMENTS) {
      let earned = false;
      if (ach.id === 'first-acceptance' && hasAcceptedAdmission) earned = true;
      if (ach.id === 'supply-stabilizer' && hasStableSupply) earned = true;
      if (ach.id === 'transfer-coordinator' && hasCompletedTransfer) earned = true;

      if (earned) {
        const wasNew = earnAchievement(ach.id);
        if (wasNew) addXp(ach.xpReward);
      }
    }
  }, [hasAcceptedAdmission, hasStableSupply, hasCompletedTransfer, store]);

  const level = store.getLevel();
  const progress = store.getXpProgress();
  const earnedList = ACHIEVEMENTS.filter((a) => earnedAchievements.includes(a.id));

  return (
    <div className="bg-surface-raised/60 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
        Operational Rank
      </p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-950/30 border border-amber-500/30 grid place-items-center">
          <Shield size={18} className="text-amber-500" />
        </div>
        <div className="space-y-0.5 flex-1">
          <p className="text-xs font-black text-amber-400 uppercase tracking-tight">
            Level {level}
          </p>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-[9px] font-mono text-zinc-600">
            {progress.current} / {progress.needed} XP
          </p>
        </div>
        <p className="text-lg font-black text-amber-500 font-mono">{xp} XP</p>
      </div>

      {earnedList.length > 0 && (
        <div className="border-t border-zinc-900 pt-3">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
            Achievements
          </p>
          <div className="flex flex-wrap gap-2">
            {earnedList.map((ach) => {
              const Icon = ICON_MAP[ach.icon] ?? Award;
              return (
                <div
                  key={ach.id}
                  title={ach.description}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/20 border border-amber-500/20"
                >
                  <Icon size={12} className="text-amber-500" />
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tight">
                    {ach.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
