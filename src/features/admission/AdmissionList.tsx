import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, toFormData, unwrapList } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { can } from '../../lib/permissions';
import { Admission } from '../../types';
import { BrainCircuit, ShieldAlert, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton, SkeletonList } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 15;

const getAdmissionDecisionStatus = (
  admission?: Partial<Admission> | null,
): 'PENDING' | 'ACCEPTED' | 'REJECTED' => {
  const rawStatus = (admission?.final_decision ?? admission?.ai_decision ?? 'PENDING')
    .toString()
    .toUpperCase();

  if (rawStatus === 'APPROVED') return 'ACCEPTED';
  if (rawStatus === 'ACCEPTED' || rawStatus === 'REJECTED') return rawStatus;
  return 'PENDING';
};

export default function AdmissionList() {
  const { currentCampId } = useCampStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canReevaluate = can(user?.role, 'admission.create') && can(user?.role, 'admission.review');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Form states for register intake
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newHealth, setNewHealth] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newIdCard, setNewIdCard] = useState<File | null>(null);

  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctName, setCorrectName] = useState('');
  const [correctAge, setCorrectAge] = useState('');
  const [correctSkills, setCorrectSkills] = useState('');
  const [correctHealth, setCorrectHealth] = useState('');
  const [correctBackground, setCorrectBackground] = useState('');
  const [correctPhoto, setCorrectPhoto] = useState<File | null>(null);
  const [correctIdCard, setCorrectIdCard] = useState<File | null>(null);

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['admissions', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/admission/camps/${currentCampId}`);
      return unwrapList<Admission>(res.data);
    },
    enabled: !!currentCampId,
  });

  const totalPages = Math.max(1, Math.ceil((admissions?.length ?? 0) / PAGE_SIZE));
  const paginatedAdmissions = (admissions ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      queryClient.invalidateQueries({ queryKey: ['admissions', currentCampId] });
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
      photo?: File | null;
      id_card?: File | null;
    }) => {
      const body = toFormData({
        applicant_name: formValues.applicant_name,
        applicant_age: formValues.applicant_age,
        applicant_skills: formValues.applicant_skills,
        health_notes: formValues.health_notes,
        background_notes: formValues.background_notes,
        ...(formValues.photo ? { photo: formValues.photo } : {}),
        ...(formValues.id_card ? { id_card: formValues.id_card } : {}),
      });
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
      setNewPhoto(null);
      setNewIdCard(null);
    },
  });

  const correctAndReevaluateMutation = useMutation({
    mutationFn: async ({
      oldId,
      formValues,
    }: {
      oldId: number;
      formValues: {
        applicant_name: string;
        applicant_age?: number;
        applicant_skills: string;
        health_notes: string;
        background_notes: string;
        photo?: File | null;
        id_card?: File | null;
      };
    }) => {
      const body = toFormData({
        applicant_name: formValues.applicant_name,
        ...(formValues.applicant_age != null ? { applicant_age: formValues.applicant_age } : {}),
        applicant_skills: formValues.applicant_skills,
        health_notes: formValues.health_notes,
        background_notes: formValues.background_notes,
        ...(formValues.photo ? { photo: formValues.photo } : {}),
        ...(formValues.id_card ? { id_card: formValues.id_card } : {}),
      });
      const res = await apiClient.post(`/admission/camps/${currentCampId}`, body);
      await apiClient.patch(`/admission/${oldId}/review`, { final_decision: 'REJECTED' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions', currentCampId] });
      setIsCorrectModalOpen(false);
      setSelectedAdmissionId(null);
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
      photo: newPhoto,
      id_card: newIdCard,
    });
  };

  // Close detail modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAdmissionId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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

      <div className="h-[calc(100vh-280px)]">
        {/* List Panel - full width */}
        <div className="flex flex-col bg-surface-raised brutalist-border rounded-xl overflow-hidden h-full">
          <div className="p-4 bg-black/40 border-b border-zinc-900 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Intake Queue
            </h3>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
              {admissions?.filter((a) => getAdmissionDecisionStatus(a) === 'PENDING').length || 0}{' '}
              PENDING · PAGE {page}/{totalPages}
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
              paginatedAdmissions.map((admission) => {
                const decisionStatus = getAdmissionDecisionStatus(admission);

                return (
                  <button
                    key={admission.id}
                    onClick={() => setSelectedAdmissionId(admission.id)}
                    className={cn(
                      'w-full p-5 text-left transition-all hover:bg-white/5 border-l-4 group',
                      selectedAdmissionId === admission.id
                        ? 'bg-white/5 border-brand-primary'
                        : 'border-transparent',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-base tracking-tight group-hover:text-brand-primary transition-colors">
                        {admission.applicant_name || admission.full_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 italic shrink-0 ml-2">
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
                      {admission.ai_confidence != null && (
                        <span className="text-[10px] font-mono text-zinc-600">
                          {(admission.ai_confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-zinc-900 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAdmissionId && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedAdmissionId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-raised brutalist-border rounded-xl w-full max-w-3xl my-8 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedAdmissionId(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <XCircle size={16} />
              </button>

              {detailsLoading ? (
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-2/3" />
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
              ) : !details ? (
                <div className="p-12 text-center">
                  <p className="text-zinc-600 font-mono text-xs">
                    Failed to load admission details.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col max-h-[80vh]">
                  {/* Header */}
                  <div className="p-6 border-b border-zinc-900 space-y-4">
                    <div className="flex items-start justify-between gap-4 pr-8">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black tracking-tighter uppercase truncate">
                            {details.applicant_name || details.full_name}
                          </h2>
                          {(() => {
                            const s = getAdmissionDecisionStatus(details);
                            return (
                              <span
                                className={cn(
                                  'shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                                  s === 'PENDING'
                                    ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                                    : s === 'ACCEPTED'
                                      ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                                      : 'bg-red-950/20 text-red-500 border-red-500/30',
                                )}
                              >
                                {s}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-zinc-600 font-mono text-xs">
                          ID: ADM-{String(details.id).padStart(4, '0')} ·{' '}
                          {details.created_at
                            ? new Date(details.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                      <div className="shrink-0 bg-zinc-950 px-3 py-1.5 border border-zinc-800 rounded flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Age</p>
                          <p className="font-mono font-bold text-base">
                            {details.applicant_age ?? '?'}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Conf.</p>
                          <p className="font-mono font-bold text-base">
                            {details.ai_confidence != null
                              ? `${(details.ai_confidence * 100).toFixed(0)}%`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6">
                      <section className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                            <p className="text-[9px] font-bold text-brand-primary uppercase mb-1.5">
                              Skills
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-300">
                              {details.applicant_skills || (
                                <span className="text-zinc-600 italic">None reported</span>
                              )}
                            </p>
                          </div>
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                            <p className="text-[9px] font-bold text-brand-secondary uppercase mb-1.5">
                              Health
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-300">
                              {details.health_notes || (
                                <span className="text-zinc-600 italic">None reported</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {details.background_notes && (
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                              Background
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-300">
                              {details.background_notes}
                            </p>
                          </div>
                        )}
                      </section>

                      {(details.photo_url || details.id_card_url) && (
                        <section className="space-y-3">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Attached Documents
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {details.photo_url && (
                              <div>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                                  Photo
                                </p>
                                <div className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                                  <img
                                    src={details.photo_url}
                                    alt="Applicant"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                                  />
                                </div>
                              </div>
                            )}
                            {details.id_card_url && (
                              <div
                                className={details.photo_url ? 'md:col-span-2' : 'md:col-span-3'}
                              >
                                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                                  ID Card
                                </p>
                                <div className="aspect-[1.58] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 relative group">
                                  <img
                                    src={details.id_card_url}
                                    alt="ID Card"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/80 py-1.5 text-center border-t border-zinc-900">
                                    <span className="text-[8px] font-mono font-bold text-brand-secondary uppercase tracking-widest">
                                      IDENTITY ATTESTATION
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      <section className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          AI Evaluation
                        </h4>
                        <div className="relative">
                          <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/10 to-brand-secondary/10 rounded-xl blur opacity-30" />
                          <div className="relative p-4 bg-surface-base border border-zinc-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
                                <BrainCircuit size={14} className="text-brand-primary" />
                                Decision Engine
                              </div>
                              {details.ai_confidence != null && (
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        details.ai_confidence > 0.7
                                          ? 'bg-emerald-500'
                                          : details.ai_confidence > 0.4
                                            ? 'bg-amber-500'
                                            : 'bg-red-500',
                                      )}
                                      style={{
                                        width: `${(details.ai_confidence * 100).toFixed(0)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                                    {details.ai_decision || 'PENDING'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {details.ai_reasoning && (
                              <div className="p-3 bg-zinc-900/40 border border-zinc-800/40 rounded-lg">
                                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">
                                  Reasoning
                                </p>
                                <p className="text-xs leading-relaxed text-zinc-300 italic">
                                  "{details.ai_reasoning}"
                                </p>
                              </div>
                            )}
                            {details.ai_suggested_profession && (
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <ShieldAlert size={12} className="text-brand-primary" />
                                Suggested role:{' '}
                                <span className="font-bold text-zinc-200 uppercase">
                                  {details.ai_suggested_profession}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>

                      {getAdmissionDecisionStatus(details) === 'PENDING' && (
                        <section className="space-y-2">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Role Override
                          </h4>
                          <div className="p-3 bg-zinc-900/40 border border-zinc-800/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-[11px] text-zinc-500 font-mono">
                              Override the AI-suggested profession:
                            </p>
                            <select
                              value={selectedProfId ?? ''}
                              onChange={(e) =>
                                setSelectedProfId(e.target.value ? Number(e.target.value) : null)
                              }
                              className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 font-bold font-mono focus:outline-none focus:border-brand-primary uppercase"
                            >
                              <option value="">— AI Suggested —</option>
                              {professions?.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </section>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-zinc-900 bg-surface-raised flex gap-3">
                    <button
                      onClick={() =>
                        reviewMutation.mutate({ id: details.id, decision: 'REJECTED' })
                      }
                      disabled={
                        reviewMutation.isPending ||
                        getAdmissionDecisionStatus(details) !== 'PENDING'
                      }
                      className="flex-1 bg-zinc-900 hover:bg-red-950/30 text-red-500 border border-red-500/30 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-30"
                    >
                      <XCircle size={16} />
                      REJECT
                    </button>
                    {canReevaluate && (
                      <button
                        onClick={() => {
                          setCorrectName(details.applicant_name || details.full_name || '');
                          setCorrectAge(String(details.applicant_age ?? ''));
                          setCorrectSkills(details.applicant_skills || '');
                          setCorrectHealth(details.health_notes || '');
                          setCorrectBackground(details.background_notes || '');
                          setIsCorrectModalOpen(true);
                        }}
                        disabled={
                          correctAndReevaluateMutation.isPending ||
                          getAdmissionDecisionStatus(details) !== 'PENDING'
                        }
                        className="flex-1 bg-amber-950/20 hover:bg-amber-950/40 text-amber-500 border border-amber-500/30 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-30"
                      >
                        <BrainCircuit size={16} />
                        CORRECT
                      </button>
                    )}
                    <button
                      onClick={() =>
                        reviewMutation.mutate({
                          id: details.id,
                          decision: 'ACCEPTED',
                          corrected_profession_id: selectedProfId || undefined,
                        })
                      }
                      disabled={
                        reviewMutation.isPending ||
                        getAdmissionDecisionStatus(details) !== 'PENDING'
                      }
                      className="flex-[2] bg-brand-accent hover:bg-emerald-600 text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-30"
                    >
                      <CheckCircle2 size={16} />
                      APPROVE
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

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
                      Applicant Photo (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-primary file:text-black file:text-xs file:font-bold focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      ID Card (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewIdCard(e.target.files?.[0] ?? null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-primary file:text-black file:text-xs file:font-bold focus:outline-none focus:border-brand-primary"
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

        {isCorrectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="border-b border-zinc-900 pb-4 mb-2">
                <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest leading-none mb-1">
                  CORRECTION PROTOCOL
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Correct &amp; Re-evaluate
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Edit the applicant data and resubmit for a fresh AI evaluation. The original
                  intake will be rejected.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!correctName) return;
                  correctAndReevaluateMutation.mutate({
                    oldId: details.id,
                    formValues: {
                      applicant_name: correctName,
                      applicant_age: correctAge ? Number(correctAge) : undefined,
                      applicant_skills: correctSkills,
                      health_notes: correctHealth,
                      background_notes: correctBackground,
                      photo: correctPhoto,
                      id_card: correctIdCard,
                    },
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={correctName}
                      onChange={(e) => setCorrectName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Age</label>
                    <input
                      required
                      type="number"
                      value={correctAge}
                      onChange={(e) => setCorrectAge(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Applicant Skills summary
                  </label>
                  <input
                    required
                    type="text"
                    value={correctSkills}
                    onChange={(e) => setCorrectSkills(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Health assessment notes
                  </label>
                  <textarea
                    required
                    value={correctHealth}
                    onChange={(e) => setCorrectHealth(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Historical background notes
                  </label>
                  <textarea
                    value={correctBackground}
                    onChange={(e) => setCorrectBackground(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Photo (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCorrectPhoto(e.target.files?.[0] ?? null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-amber-600 file:text-black file:text-xs file:font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      ID Card (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCorrectIdCard(e.target.files?.[0] ?? null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-amber-600 file:text-black file:text-xs file:font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCorrectModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={correctAndReevaluateMutation.isPending}
                    className="flex-2 py-2.5 bg-amber-600 text-black text-xs font-bold uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {correctAndReevaluateMutation.isPending
                      ? 'REEVALUATING...'
                      : 'SUBMIT & REEVALUATE'}
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
