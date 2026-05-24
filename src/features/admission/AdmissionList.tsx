import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, toFormData, unwrapList } from '../../lib/api';
import { useCampStore } from '../../store';
import { Admission } from '../../types';
import {
  BrainCircuit,
  ShieldAlert,
  UserPlus,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton, SkeletonList } from '../../components/Skeleton';

const getAdmissionDecisionStatus = (
  admission?: Partial<Admission> | null,
): 'PENDING' | 'ACCEPTED' | 'REJECTED' => {
  const rawStatus = (
    admission?.final_decision ??
    admission?.status ??
    admission?.ai_decision ??
    'PENDING'
  )
    .toString()
    .toUpperCase();

  if (rawStatus === 'APPROVED') return 'ACCEPTED';
  if (rawStatus === 'ACCEPTED' || rawStatus === 'REJECTED') return rawStatus;
  return 'PENDING';
};

export default function AdmissionList() {
  const { currentCampId } = useCampStore();
  const queryClient = useQueryClient();
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);

  // Form states for register intake
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newHealth, setNewHealth] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newIdCardUrl, setNewIdCardUrl] = useState('');

  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['admissions', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/admission/camps/${currentCampId}`);
      return unwrapList<Admission>(res.data);
    },
    enabled: !!currentCampId,
  });

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['admission-details', selectedAdmissionId],
    queryFn: async () => {
      const res = await apiClient.get(`/admission/${selectedAdmissionId}`);
      return res.data;
    },
    enabled: !!selectedAdmissionId,
  });

  // Fetch professions dynamically for the correction select
  const { data: professions } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['professions'],
    queryFn: async () => {
      const res = await apiClient.get('/professions');
      return unwrapList<{ id: number; name: string }>(res.data);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      corrected_profession_id,
    }: {
      id: number;
      decision: 'ACCEPTED' | 'REJECTED';
      corrected_profession_id?: number;
    }) => {
      // Contract: PATCH /admission/:id/review — only final_decision + optional corrected_profession_id
      await apiClient.patch(`/admission/${id}/review`, {
        final_decision: decision,
        ...(corrected_profession_id != null ? { corrected_profession_id } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      // Clear out selected so view resets
      setSelectedAdmissionId(null);
    },
  });

  const createAdmissionMutation = useMutation({
    mutationFn: async (formValues: {
      applicant_name: string;
      applicant_age: number;
      applicant_skills: string;
      health_notes: string;
      background_notes: string;
      photo_url?: string;
      id_card_url?: string;
    }) => {
      const body = toFormData(formValues);
      const res = await apiClient.post(`/admission/camps/${currentCampId}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admissions', currentCampId],
      });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewAge('');
      setNewSkills('');
      setNewHealth('');
      setNewBackground('');
      setNewPhotoUrl('');
      setNewIdCardUrl('');
    },
  });

  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    createAdmissionMutation.mutate({
      applicant_name: newName,
      applicant_age: Number(newAge) || 25,
      applicant_skills: newSkills,
      health_notes: newHealth,
      background_notes: newBackground,
      photo_url: newPhotoUrl,
      id_card_url: newIdCardUrl,
    });
  };

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Admission Protocol
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            AI-driven refugee screening & assessment
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] uppercase tracking-wider"
        >
          <UserPlus size={18} />
          REGISTER INTAKE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-280px)]">
        {/* List Panel */}
        <div className="flex flex-col bg-surface-raised brutalist-border rounded-xl overflow-hidden">
          <div className="p-4 bg-black/40 border-b border-zinc-900 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Pending Review
            </h3>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
              {admissions?.filter((a) => getAdmissionDecisionStatus(a) === 'PENDING').length || 0}{' '}
              QUEUE
            </span>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-zinc-900">
            {isLoading ? (
              <div className="p-4">
                <SkeletonList count={4} />
              </div>
            ) : admissions?.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No pending applications.
                </p>
              </div>
            ) : (
              admissions?.map((admission) => {
                const decisionStatus = getAdmissionDecisionStatus(admission);

                return (
                  <button
                    key={admission.id}
                    onClick={() => setSelectedAdmissionId(admission.id)}
                    className={cn(
                      'w-full p-6 text-left transition-all hover:bg-white/5 border-l-4 group relative',
                      selectedAdmissionId === admission.id
                        ? 'bg-white/5 border-brand-primary'
                        : 'border-transparent',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-lg tracking-tight group-hover:text-brand-primary transition-colors">
                        {admission.applicant_name || admission.full_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 italic">
                        {formatDate(admission.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                          decisionStatus === 'PENDING'
                            ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                            : decisionStatus === 'ACCEPTED'
                              ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                              : 'bg-red-950/20 text-red-500 border-red-500/30',
                        )}
                      >
                        {decisionStatus}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
                        <BrainCircuit size={12} className="text-zinc-700" />
                        AI ANALYSIS COMPLETE
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className={cn(
                        'absolute right-4 top-1/2 -translate-y-1/2 text-zinc-800 transition-transform',
                        selectedAdmissionId === admission.id
                          ? 'translate-x-0 opacity-100'
                          : '-translate-x-2 opacity-0',
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="bg-surface-raised brutalist-border rounded-xl flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!selectedAdmissionId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6"
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-full grid place-items-center border border-zinc-800">
                  <Eye size={32} className="text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                    File Review Terminal
                  </p>
                  <p className="text-xs font-mono text-zinc-600">
                    Select a candidate to initiate feasibility diagnosis and AI reasoning.
                  </p>
                </div>
              </motion.div>
            ) : detailsLoading ? (
              <div key="loading" className="flex-1 p-8 space-y-6 animate-pulse bg-zinc-950/20">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="grid grid-cols-3 gap-6 pt-4">
                  <Skeleton className="h-28 w-full rounded-lg" />
                  <Skeleton className="h-28 col-span-2 w-full rounded-lg" />
                </div>
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col h-full bg-zinc-950/20"
              >
                <div className="p-8 border-b border-zinc-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                        {details.applicant_name || details.full_name}
                      </h2>
                      <p className="text-zinc-500 font-mono text-sm">
                        File ID: #ADM-{details.id}002
                      </p>
                    </div>
                    <div className="bg-zinc-950 p-2 border border-zinc-800 rounded flex gap-4">
                      <div className="text-center px-4 border-r border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Age</p>
                        <p className="font-mono font-bold text-lg">
                          {details.applicant_age || details.details?.age || 25}
                        </p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Risk</p>
                        <p className="font-mono font-bold text-lg text-emerald-500">Minimal</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <p className="text-[10px] font-black text-brand-primary uppercase mb-2">
                        Detected Skills
                      </p>
                      <p className="text-xs font-medium leading-relaxed">
                        {details.applicant_skills || details.details?.skills}
                      </p>
                    </div>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <p className="text-[10px] font-black text-brand-secondary uppercase mb-2">
                        Medical Condition
                      </p>
                      <p className="text-xs font-medium leading-relaxed">
                        {details.health_notes || details.details?.medical_data}
                      </p>
                    </div>
                  </div>

                  {/* Scanned Identification and Face Photo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-900">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase">
                        Applicant Face Scan
                      </p>
                      <div className="aspect-square w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                        <img
                          src={
                            details.photo_url ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
                          }
                          alt="Face Scan"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase">
                        Identification Document Scan
                      </p>
                      <div className="aspect-[1.58] w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 relative group">
                        <img
                          src={
                            details.id_card_url ||
                            'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=400&h=250&q=80'
                          }
                          alt="ID Card Scan"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/80 py-2 text-center border-t border-zinc-900">
                          <span className="text-[9px] font-mono font-bold text-brand-secondary uppercase tracking-widest">
                            ENFORCED IDENTITY ATTESTATION
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-8 bg-black/20 space-y-8">
                  {/* AI Explainability Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-primary text-black rounded">
                        <BrainCircuit size={20} />
                      </div>
                      <h3 className="font-black italic uppercase tracking-tight text-xl">
                        Predictive AI Analysis
                      </h3>
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/20 to-brand-secondary/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition" />
                      <div className="relative p-6 bg-surface-base border border-zinc-800 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase">
                          <ShieldAlert size={14} className="text-brand-primary" />
                          Automated Judgment v.9.4
                        </div>
                        <p className="text-sm font-bold leading-relaxed text-zinc-200">
                          "{details.ai_reasoning || details.ai_analysis}"
                        </p>
                        <div className="pt-4 border-t border-zinc-900">
                          <p className="text-[10px] font-bold text-zinc-600 uppercase mb-2">
                            Detailed Reasoning
                          </p>
                          <p className="text-xs text-zinc-400 italic">
                            "{details.details?.reasoning}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supervisor Manual Role Custom Assignment Override */}
                {getAdmissionDecisionStatus(details) === 'PENDING' && (
                  <div className="px-8 py-4 bg-zinc-950 border-t border-zinc-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                        Manual Assignment Override
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        Verify or correct the AI-suggested profession before allowing intake:
                      </p>
                    </div>
                    <select
                      value={selectedProfId ?? ''}
                      onChange={(e) =>
                        setSelectedProfId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 font-bold font-mono focus:outline-none focus:border-brand-primary uppercase"
                    >
                      <option value="">— AI Suggested —</option>
                      {professions?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sticky Actions */}
                <div className="p-8 border-t border-zinc-900 bg-surface-raised sticky bottom-0 flex gap-4">
                  <button
                    onClick={() =>
                      reviewMutation.mutate({
                        id: details.id,
                        decision: 'REJECTED',
                      })
                    }
                    disabled={
                      reviewMutation.isPending || getAdmissionDecisionStatus(details) !== 'PENDING'
                    }
                    className="flex-1 bg-zinc-900 hover:bg-red-950/30 text-red-500 border border-red-500/30 font-black py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                  >
                    <XCircle size={20} />
                    REJECT INTAKE
                  </button>
                  <button
                    onClick={() => {
                      reviewMutation.mutate({
                        id: details.id,
                        decision: 'ACCEPTED',
                        corrected_profession_id: selectedProfId || undefined,
                      });
                    }}
                    disabled={
                      reviewMutation.isPending || getAdmissionDecisionStatus(details) !== 'PENDING'
                    }
                    className="flex-3 bg-brand-accent hover:bg-emerald-600 text-black font-black py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-30"
                  >
                    <CheckCircle2 size={20} />
                    APPROVE & ASSIGN ROLE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="border-b border-zinc-900 pb-4 mb-2">
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  STABILITY PROTOCOL v4.7
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Register New Refugee Intake
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  This form transmits telemetry data directly to the automated triage system.
                </p>
              </div>

              <form onSubmit={handleSubmitIntake} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Marlene Carter"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Age</label>
                    <input
                      required
                      type="number"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Applicant Skills summary (comma separated)
                  </label>
                  <input
                    required
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="e.g. combat training, basic surgical operations, scouting, agriculture"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Health assessment notes
                  </label>
                  <textarea
                    required
                    value={newHealth}
                    onChange={(e) => setNewHealth(e.target.value)}
                    placeholder="e.g. Minor exhaustions, no active bites or infectious symptoms detected."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Historical background notes
                  </label>
                  <textarea
                    value={newBackground}
                    onChange={(e) => setNewBackground(e.target.value)}
                    placeholder="e.g. Former cargo vehicle driver from the state border. Cooperative and compliant."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Identification Card URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={newIdCardUrl}
                      onChange={(e) => setNewIdCardUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    ABORT INTAKE
                  </button>
                  <button
                    type="submit"
                    disabled={createAdmissionMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {createAdmissionMutation.isPending
                      ? 'STABILITY AI CALIBRATING...'
                      : 'SUBMIT REFUGE ENTRY'}
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
