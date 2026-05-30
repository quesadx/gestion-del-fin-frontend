import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Achievement } from '../../types';
import { Trophy, Plus, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import GlareHover from './GlareHover';

export default function AchievementsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Trophy');
  const [xpReward, setXpReward] = useState(50);
  const [criteria, setCriteria] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const canCreate = hasPermission(user?.permissions, 'admin.bypass_camp_scoping');

  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await apiClient.get('/achievements');
      return unwrapList<Achievement>(res.data);
    },
    enabled: hasPermission(user?.permissions, 'admin.bypass_camp_scoping'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      icon: string;
      xp_reward: number;
      criteria?: Record<string, unknown>;
    }) => {
      const res = await apiClient.post('/achievements', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      closeModal();
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setIcon('Trophy');
    setXpReward(50);
    setCriteria('');
  };

  const openCreateModal = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    const payload: {
      name: string;
      description: string;
      icon: string;
      xp_reward: number;
      criteria?: Record<string, unknown>;
    } = {
      name,
      description,
      icon,
      xp_reward: xpReward,
    };

    if (criteria) {
      try {
        payload.criteria = JSON.parse(criteria) as Record<string, unknown>;
      } catch {
        // silently skip invalid JSON
      }
    }

    createMutation.mutate(payload);
  };

  const iconOptions = ['Trophy', 'Award', 'Star', 'Shield', 'Zap', 'Flame', 'Crown', 'Medal'];

  const filteredAchievements = !achievements
    ? []
    : search
      ? achievements.filter(
          (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.description.toLowerCase().includes(search.toLowerCase()),
        )
      : achievements;

  const PAGE_SIZE = 9;
  const totalPages = Math.max(1, Math.ceil(filteredAchievements.length / PAGE_SIZE));
  const paginatedAchievements = filteredAchievements.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Achievements
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Define milestones and rewards for camp personnel
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW ACHIEVEMENT
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search achievements..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAchievements.length === 0 && !search && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Trophy size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No achievements defined</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Create the first achievement to start recognizing excellence
              </p>
            </div>
          )}
          {filteredAchievements.length === 0 && search && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Search size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">
                No results for "{search}"
              </p>
              <p className="text-xs font-mono mt-1 text-zinc-700">Try a different search term</p>
            </div>
          )}
          {paginatedAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlareHover
                width="100%"
                height="100%"
                background="transparent"
                borderRadius="12px"
                borderColor="rgba(63,63,70,0.4)"
                glareColor="#fbbf24"
                glareOpacity={0.15}
                glareAngle={-30}
                glareSize={200}
                transitionDuration={600}
                className="h-full"
              >
                <div className="p-6 bg-surface-raised/60 border border-zinc-800 rounded-xl space-y-4 hover:border-zinc-700 transition-colors w-full h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-950/30 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                      <Trophy size={24} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-lg font-black uppercase tracking-tight text-white truncate">
                        {achievement.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      {achievement.xp_reward} XP
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                      {achievement.icon}
                    </span>
                  </div>
                </div>
              </GlareHover>
            </motion.div>
          ))}
        </div>
      )}

      {filteredAchievements.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    MERIT DIRECTIVE MD-01
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Register New Achievement
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Define a new milestone for personnel recognition.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Achievement Name
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. First Aid, Supply Runner"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Description
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Criteria for earning this achievement"
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Icon</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      XP Reward
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={xpReward}
                      onChange={(e) => setXpReward(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Criteria (JSON, optional)
                  </label>
                  <textarea
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    placeholder='{"min_level": 5, "action": "complete_expedition"}'
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none font-mono"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {createMutation.isPending ? 'PROCESSING...' : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
