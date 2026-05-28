import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../../lib/api';
import { UserAchievement } from '../../types';
import { Trophy, Award, Star, Shield, Zap, Flame, Crown, Medal, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { formatDate } from '../../lib/utils';
import GlareHover from './GlareHover';

const ICON_MAP: Record<string, typeof Trophy> = {
  Trophy,
  Award,
  Star,
  Shield,
  Zap,
  Flame,
  Crown,
  Medal,
};

function AchievementIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon] ?? Trophy;
  return <Icon size={24} />;
}

interface AchievementDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export default function MyAchievementsPage() {
  const { data: myAchievements, isLoading: myLoading } = useQuery<UserAchievement[]>({
    queryKey: ['my-achievements'],
    queryFn: async () => {
      const res = await apiClient.get('/achievements/my-achievements');
      return unwrapList<UserAchievement>(res.data);
    },
  });

  const { data: allAchievements, isLoading: allLoading } = useQuery<AchievementDef[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await apiClient.get('/achievements');
      return unwrapList<AchievementDef>(res.data) as AchievementDef[];
    },
    enabled: false, // only fetch if needed for locked display
  });

  const loading = myLoading || allLoading;
  const unlockedMap = new Set(myAchievements?.map((ua) => ua.achievement_id) ?? []);
  const achievements = allAchievements ?? [];
  const unlockedList = myAchievements?.filter((ua) => ua.achievement) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
          My Achievements
        </h1>
        <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
          {unlockedMap.size} milestone{unlockedMap.size !== 1 ? 's' : ''} unlocked
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Unlocked achievements */}
          {unlockedList.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">
                Unlocked
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {unlockedList.map((ua) => {
                  const ach = ua.achievement!;
                  return (
                    <motion.div
                      key={ua.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <GlareHover
                        width="100%"
                        height="100%"
                        background="transparent"
                        borderRadius="12px"
                        borderColor="rgba(251,191,36,0.3)"
                        glareColor="#fbbf24"
                        glareOpacity={0.2}
                        glareAngle={-30}
                        glareSize={250}
                        transitionDuration={600}
                        className="h-full"
                      >
                        <div className="p-6 bg-surface-raised/60 border border-amber-500/20 rounded-xl space-y-4 hover:border-amber-500/40 transition-colors w-full h-full">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-950/30 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/30 shrink-0">
                              <AchievementIcon icon={ach.icon} />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h3 className="text-lg font-black uppercase tracking-tight text-amber-300 truncate">
                                {ach.name}
                              </h3>
                              <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                                {ach.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-amber-500/10">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                              +{ach.xp_reward} XP
                            </span>
                            <span className="text-[9px] font-mono text-zinc-600">
                              {formatDate(ua.unlocked_at)}
                            </span>
                          </div>
                        </div>
                      </GlareHover>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked achievements */}
          {achievements.length > 0 &&
            achievements.filter((a) => !unlockedMap.has(a.id)).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-600">
                  Locked
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {achievements
                    .filter((a) => !unlockedMap.has(a.id))
                    .map((ach) => (
                      <motion.div
                        key={ach.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="p-6 bg-surface-raised/20 border border-zinc-800/50 rounded-xl space-y-4 opacity-50 w-full h-full">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-700 border border-zinc-800 shrink-0">
                              <Lock size={24} />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-600 truncate">
                                {ach.name}
                              </h3>
                              <p className="text-xs font-mono text-zinc-700 leading-relaxed">
                                {ach.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                              +{ach.xp_reward} XP
                            </span>
                            <Lock size={12} className="text-zinc-700" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}

          {unlockedList.length === 0 && achievements.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Trophy size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">
                No achievements available
              </p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Check back when camp administration defines milestones
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
