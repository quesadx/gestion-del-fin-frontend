import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchAllPaginated, toFormData, unwrapList } from '../../lib/api';
import { useCampStore, useAuthStore } from '../../store';
import { Person, Camp } from '../../types';
import {
  Search,
  UserPlus,
  Filter,
  Heart,
  Skull,
  Activity,
  Briefcase,
  ArrowLeftRight,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Wrench,
  AlertCircle,
  MapPinOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, normalizePersonStatus } from '../../lib/utils';
import { hasPermission } from '../../lib/permissions';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { showToast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/apiErrors';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';

const PAGE_SIZE = 20;
const SEARCH_PAGE_SIZE = 100;
const RATION_RESOURCE_TYPE_NAME = 'FOOD_RATION';
const RATIONS_PER_PERSON_FOR_TRAVEL = 6;

type RawPerson = Person & { professions?: { name?: string } | null };

interface PeopleResponse {
  data: Person[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    totalPages: number;
  };
}

type PeopleFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

const getPeopleActionErrorMessage = (error: unknown, fallback: string) => {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 403) return 'Your current role is not authorized to perform this action.';
  return getApiErrorMessage(error, fallback);
};

const flattenPerson = (person: RawPerson): Person => ({
  ...person,
  profession_name: person.profession_name ?? person.professions?.name ?? null,
});

const normalizePeopleResponse = (responseData: unknown, page: number): PeopleResponse => {
  if (Array.isArray(responseData)) {
    const data = responseData.map((person) => flattenPerson(person as RawPerson));

    return {
      data,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: data.length,
        hasNextPage: false,
        totalPages: Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
      },
    };
  }

  const payload = responseData as Partial<PeopleResponse> | undefined;
  const data = Array.isArray(payload?.data)
    ? payload.data.map((person) => flattenPerson(person as RawPerson))
    : [];
  const totalPages =
    payload?.pagination?.totalPages ?? Math.max(1, Math.ceil(data.length / PAGE_SIZE));

  return {
    data,
    pagination: {
      page: payload?.pagination?.page ?? page,
      pageSize: payload?.pagination?.pageSize ?? PAGE_SIZE,
      total: payload?.pagination?.total ?? data.length,
      hasNextPage: payload?.pagination?.hasNextPage ?? false,
      totalPages: Math.max(1, totalPages),
    },
  };
};

export default function PopulationRoster() {
  const { currentCampId } = useCampStore();
  const queryClient = useQueryClient();
  const { userId, user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [transferringPerson, setTransferringPerson] = useState<Person | null>(null);
  const [targetCampId, setTargetCampId] = useState<number | null>(null);
  const [confirmDeletePerson, setConfirmDeletePerson] = useState<Person | null>(null);

  const [reassignModal, setReassignModal] = useState(false);
  const [reassignVacantProfId, setReassignVacantProfId] = useState<number | null>(null);
  const [reassignPersonId, setReassignPersonId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<PeopleFeedback | null>(null);
  const canRead = hasPermission(user?.permissions, 'people.read');
  const canTransfer = hasPermission(user?.permissions, 'transfers.create');

  // Edit states
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editStatus, setEditStatus] = useState<'HEALTHY' | 'INJURED' | 'SICK' | 'AWAY' | 'DEAD'>(
    'HEALTHY',
  );
  const [editProfessionId, setEditProfessionId] = useState<number | null>(null);

  const showErrorFeedback = (title: string, error: unknown, fallback: string) => {
    setFeedback({
      type: 'error',
      title,
      message: getPeopleActionErrorMessage(error, fallback),
    });
  };

  const updatePersonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Person> }) => {
      const body = toFormData({
        full_name: data.full_name,
        age: data.age,
        status: data.status,
        profession_id: data.profession_id,
        camp_id: data.camp_id,
        skills_summary: data.skills_summary,
        photo_url: data.photo_url,
      });
      const res = await apiClient.put(`/camps/${currentCampId}/people/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setEditingPerson(null);
      setFeedback({
        type: 'success',
        title: 'PROFILE UPDATED',
        message: 'The personnel record was updated successfully.',
      });
    },
    onError: (error) =>
      showErrorFeedback('UPDATE FAILED', error, 'Could not update personnel profile.'),
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (id: number) => {
      // Align endpoint to /api/camps/{campId}/people/{id}
      const res = await apiClient.delete(`/camps/${currentCampId}/people/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setFeedback({
        type: 'success',
        title: 'RECORD REMOVED',
        message: 'The survivor was removed from the camp roster.',
      });
    },
    onError: (error) =>
      showErrorFeedback('DELETE FAILED', error, 'Could not delete personnel record.'),
  });

  const handleEditClick = (person: Person) => {
    setEditingPerson(person);
    setEditName(person.full_name);
    setEditAge(String(person.age));
    setEditStatus(normalizePersonStatus(person.status));
    setEditProfessionId(person.profession_id ?? null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    const parsedAge = Number(editAge);
    if (!editName.trim()) {
      showToast.warning('Full name is required.');
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 255) {
      showToast.warning('Age must be a whole number from 0 to 255.');
      return;
    }
    updatePersonMutation.mutate({
      id: editingPerson.id,
      data: {
        full_name: editName.trim(),
        age: parsedAge,
        status: editStatus,
        ...(editProfessionId != null ? { profession_id: editProfessionId } : {}),
      },
    });
  };

  const { data: peopleResponse, isLoading } = useQuery<PeopleResponse>({
    queryKey: ['people', currentCampId, page, PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${currentCampId}/people`, {
        params: { page, pageSize: PAGE_SIZE },
      });
      return normalizePeopleResponse(res.data, page);
    },
    enabled: !!currentCampId && canRead,
  });

  const { data: searchableSurvivors } = useQuery<Person[]>({
    queryKey: ['people', currentCampId, 'searchable-list', SEARCH_PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${currentCampId}/people`, {
        params: { page: 1, pageSize: SEARCH_PAGE_SIZE },
      });
      return normalizePeopleResponse(res.data, 1).data;
    },
    enabled: !!currentCampId && canRead,
  });

  const survivors = peopleResponse?.data ?? [];
  const allSurvivors = searchableSurvivors ?? survivors;

  const { data: professions } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['professions'],
    queryFn: async () => {
      const res = await apiClient.get('/professions');
      return unwrapList<{ id: number; name: string }>(res.data);
    },
    enabled: hasPermission(user?.permissions, 'professions.read'),
  });

  const professionCoverage = useMemo(() => {
    if (!professions) return [];
    // group survivors by profession_id, count active ones
    return professions
      .map((prof) => {
        const assigned = allSurvivors.filter((s) => s.profession_id === prof.id);
        const active = assigned.filter((s) => normalizePersonStatus(s.status) === 'HEALTHY');
        return { ...prof, total: assigned.length, active: active.length };
      })
      .filter((p) => p.total > 0 && p.active === 0);
  }, [allSurvivors, professions]);

  const { data: camps } = useQuery<Camp[]>({
    queryKey: ['camps-catalog'],
    queryFn: async () => {
      const res = await apiClient.get('/camps/catalog');
      return unwrapList<Camp>(res.data);
    },
    enabled: hasPermission(user?.permissions, 'camps.read'),
  });

  const { data: resources } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['resources-list'],
    queryFn: () => fetchAllPaginated<{ id: number; name: string }>('/resources'),
    enabled: canTransfer && hasPermission(user?.permissions, 'resources.read'),
  });

  const rationResource = useMemo(
    () =>
      resources?.find(
        (resource) => resource.name.trim().toUpperCase() === RATION_RESOURCE_TYPE_NAME,
      ),
    [resources],
  );

  const transferMutation = useMutation({
    mutationFn: async ({ personId, campId }: { personId: number; campId: number }) => {
      if (!rationResource) {
        throw new Error(
          `${RATION_RESOURCE_TYPE_NAME} resource is required for personnel transfers.`,
        );
      }

      await apiClient.post('/transfers', {
        requesting_camp: currentCampId,
        target_camp: campId,
        type: 'PERSON',
        requested_by: userId ?? 1,
        items: [
          { item_type: 'PERSON', person_id: personId },
          {
            item_type: 'RESOURCE',
            resource_type_id: rationResource.id,
            quantity: RATIONS_PER_PERSON_FOR_TRAVEL,
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setTransferringPerson(null);
      setTargetCampId(null);
      setFeedback({
        type: 'success',
        title: 'TRANSFER REQUESTED',
        message: 'The personnel transfer request was created successfully.',
      });
    },
    onError: (error) =>
      showErrorFeedback('TRANSFER FAILED', error, 'Could not create personnel transfer.'),
  });

  const reassignMutation = useMutation({
    mutationFn: async ({
      personId,
      fromProfId,
      toProfId,
    }: {
      personId: number;
      fromProfId: number;
      toProfId: number;
    }) => {
      await apiClient.post(`/camps/${currentCampId}/people/profession-reassignments`, {
        person_id: personId,
        from_profession_id: fromProfId,
        to_profession_id: toProfId,
        reason: 'Temporary reassignment — covering vacant profession',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setReassignModal(false);
      setReassignVacantProfId(null);
      setReassignPersonId(null);
      setFeedback({
        type: 'success',
        title: 'REASSIGNMENT SAVED',
        message: 'The temporary profession reassignment was saved successfully.',
      });
    },
    onError: (error) =>
      showErrorFeedback('REASSIGNMENT FAILED', error, 'Could not save temporary reassignment.'),
  });

  const canReassign = hasPermission(user?.permissions, 'people.profession_reassign.create');
  const canCreate = hasPermission(user?.permissions, 'people.create');
  const canUpdate = hasPermission(user?.permissions, 'people.update');
  const canDelete = hasPermission(user?.permissions, 'people.delete');
  const canCreateAdmission = hasPermission(user?.permissions, 'admission.create');

  const normalizedSearch = search.trim().toLowerCase();
  const isFiltering = normalizedSearch.length > 0 || statusFilter !== 'ALL';
  const visibleSource = isFiltering ? allSurvivors : survivors;
  const filteredSurvivors = visibleSource.filter((s: Person) => {
    const nameMatch = s.full_name.toLowerCase().includes(normalizedSearch);
    const profMatch = s.profession_name?.toLowerCase().includes(normalizedSearch);
    const matchesSearch = nameMatch || profMatch;

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;

    const personStatus = normalizePersonStatus(s.status);
    const filterVal = statusFilter.toUpperCase();

    return personStatus === filterVal;
  });

  const totalPages = isFiltering
    ? Math.max(1, Math.ceil(filteredSurvivors.length / PAGE_SIZE))
    : (peopleResponse?.pagination.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedSurvivors = isFiltering
    ? filteredSurvivors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : survivors;
  const personnelCount = isFiltering
    ? filteredSurvivors.length
    : (peopleResponse?.pagination.total ?? survivors.length);
  const personnelCountLabel = isFiltering ? 'Matching personnel' : 'Total personnel';

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Population Roster</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Survivor census & role assignment
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={() => navigate('/population/new')}
              className="bg-brand-accent hover:bg-emerald-600 text-black font-semibold uppercase tracking-wider px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-transform active:scale-95"
            >
              <UserPlus size={18} />
              NEW SURVIVOR
            </button>
          )}
          {canCreateAdmission && (
            <button
              onClick={() => navigate('/admission')}
              className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-transform active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <UserPlus size={18} />
              REGISTER INTAKE
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-75">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="FILTER BY NAME OR PROFESSION..."
            aria-label="Search survivors"
            className="w-full bg-surface-raised border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface-raised border border-zinc-800 rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="SICK">SICK</option>
            <option value="INJURED">INJURED</option>
            <option value="AWAY">AWAY</option>
            <option value="DEAD">DEAD</option>
          </select>
          <button
            className="p-2.5 brutalist-border rounded-lg text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle filters"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Profession shortfall alert */}
      {professionCoverage.length > 0 && (
        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1 flex-1">
            <p className="text-xs font-black text-amber-500 uppercase tracking-wider">
              PROFESSION SHORTFALL DETECTED
            </p>
            <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
              The following roles have no active personnel. Consider temporary reassignment:{' '}
              <span className="text-amber-400 font-bold">
                {professionCoverage.map((p) => p.name).join(', ')}
              </span>
            </p>
          </div>
          {canReassign && (
            <button
              onClick={() => setReassignModal(true)}
              className="shrink-0 bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded transition-colors"
            >
              REASSIGN
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-raised brutalist-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/50 border-b border-zinc-800">
              <th
                scope="col"
                className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                Survivor
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                Profession
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                Age
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                Workable
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredSurvivors.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-20 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest"
                >
                  No personnel records found.
                </td>
              </tr>
            ) : (
              paginatedSurvivors.map((person: Person) => (
                <tr key={person.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/population/${person.id}`)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded bg-zinc-800 grid place-items-center font-bold text-zinc-500">
                        {person.full_name[0]}
                      </div>
                      <span className="font-bold text-zinc-100 group-hover:text-brand-primary transition-colors">
                        {person.full_name}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-zinc-600" />
                      <span className="text-sm text-zinc-400 font-mono uppercase tracking-tighter">
                        {person.profession_name || 'UNASSIGNED'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const status = normalizePersonStatus(person.status);
                      const isHealthy = status === 'HEALTHY';
                      const isSick = status === 'SICK';
                      const isInjured = status === 'INJURED';
                      const isAway = status === 'AWAY';
                      const isDeceased = status === 'DEAD';

                      const label = status;

                      return (
                        <div
                          className={cn(
                            'inline-flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                            isHealthy
                              ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                              : isInjured
                                ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                                : isSick
                                  ? 'bg-orange-950/20 text-orange-500 border-orange-500/30'
                                  : isAway
                                    ? 'bg-blue-950/20 text-blue-400 border-blue-400/30'
                                    : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
                          )}
                        >
                          {isHealthy && <Heart size={10} />}
                          {isInjured && <Activity size={10} />}
                          {isDeceased && <Skull size={10} />}
                          {label}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-zinc-500">{person.age} YRS</span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const status = normalizePersonStatus(person.status);
                      const isWorkable = status === 'HEALTHY';
                      const isAway = status === 'AWAY';
                      const isDeceased = status === 'DEAD';

                      if (isDeceased) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-zinc-950/40 text-zinc-600 border border-zinc-800">
                            <Skull size={10} />
                            DECEASED
                          </span>
                        );
                      }
                      if (isAway) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-950/20 text-blue-400 border border-blue-400/30">
                            <MapPinOff size={10} />
                            ABSENT
                          </span>
                        );
                      }
                      if (isWorkable) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950/20 text-emerald-400 border border-emerald-400/30">
                            <Wrench size={10} />
                            AVAILABLE
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-950/20 text-amber-400 border border-amber-400/30">
                          <AlertCircle size={10} />
                          UNAVAILABLE
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      {canTransfer && normalizePersonStatus(person.status) === 'HEALTHY' && (
                        <button
                          onClick={() => setTransferringPerson(person)}
                          aria-label={`Transfer ${person.full_name}`}
                          title={`Transfer ${person.full_name}`}
                          className="p-1.5 sm:p-2 text-zinc-600 hover:text-brand-secondary animate-all touch-target"
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                      )}
                      {canUpdate && normalizePersonStatus(person.status) !== 'DEAD' && (
                        <button
                          onClick={() => handleEditClick(person)}
                          aria-label={`Edit ${person.full_name}`}
                          title={`Edit ${person.full_name}`}
                          className="p-1.5 sm:p-2 text-zinc-600 hover:text-emerald-500 animate-all touch-target"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete && normalizePersonStatus(person.status) !== 'DEAD' && (
                        <button
                          onClick={() => setConfirmDeletePerson(person)}
                          aria-label={`Delete ${person.full_name}`}
                          title={`Delete ${person.full_name}`}
                          className="p-1.5 sm:p-2 text-zinc-600 hover:text-red-500 animate-all touch-target"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {transferringPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Personnel Transfer
                </h3>
                <p className="text-sm text-zinc-500 font-mono">
                  Transferring: {transferringPerson.full_name}
                </p>
                <p className="text-[10px] text-zinc-600 font-mono">
                  Includes {RATIONS_PER_PERSON_FOR_TRAVEL} {RATION_RESOURCE_TYPE_NAME} travel
                  rations, required by transfer protocol.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Select Target Destination
                </p>
                <div className="grid gap-2 max-h-75 overflow-auto pr-2">
                  {camps
                    ?.filter((c) => c.id !== currentCampId)
                    .map((camp) => (
                      <button
                        key={camp.id}
                        onClick={() => setTargetCampId(camp.id)}
                        className={cn(
                          'p-4 text-left border rounded-lg transition-all',
                          targetCampId === camp.id
                            ? 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary'
                            : 'bg-surface-base border-zinc-800 text-zinc-400 hover:border-zinc-700',
                        )}
                      >
                        <p className="font-bold uppercase">{camp.name}</p>
                        <p className="text-[10px] font-mono opacity-60">{camp.location}</p>
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setTransferringPerson(null);
                    setTargetCampId(null);
                  }}
                  className="flex-1 py-3 font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  disabled={!targetCampId || !rationResource || transferMutation.isPending}
                  onClick={() =>
                    targetCampId &&
                    transferMutation.mutate({
                      personId: transferringPerson.id,
                      campId: targetCampId,
                    })
                  }
                  className="flex-2 py-3 bg-brand-secondary text-black font-black uppercase rounded hover:bg-amber-600 transition-colors disabled:opacity-30"
                >
                  {!rationResource
                    ? 'RATION RESOURCE MISSING'
                    : transferMutation.isPending
                      ? 'AUTHORIZING...'
                      : 'CONFIRM TRANSFER'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Edit Personnel Profile
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">ID: SURVIVOR-{editingPerson.id}</p>
                </div>
                <button
                  onClick={() => setEditingPerson(null)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={150}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Full name"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Age (Years)
                    </label>
                    <input
                      required
                      type="number"
                      min={0}
                      max={255}
                      step={1}
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      aria-label="Age"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Status Rating
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(
                          e.target.value as 'HEALTHY' | 'INJURED' | 'SICK' | 'AWAY' | 'DEAD',
                        )
                      }
                      aria-label="Status rating"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary cursor-pointer uppercase font-mono"
                    >
                      <option value="HEALTHY">HEALTHY</option>
                      <option value="INJURED">WOUNDED</option>
                      <option value="SICK">SICK</option>
                      <option value="AWAY">MISSING</option>
                      <option value="DEAD">DECEASED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Profession/Role
                  </label>
                  <select
                    value={editProfessionId ?? ''}
                    onChange={(e) =>
                      setEditProfessionId(e.target.value ? Number(e.target.value) : null)
                    }
                    aria-label="Profession"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono uppercase cursor-pointer"
                  >
                    <option value="">— No change —</option>
                    {professions?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setEditingPerson(null)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updatePersonMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-zinc-300 transition-colors"
                  >
                    {updatePersonMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmDeletePerson !== null}
        title="Remove survivor from roster?"
        description={`This will permanently delete ${confirmDeletePerson?.full_name ?? 'this person'} from the camp roster. This action cannot be undone.`}
        confirmLabel="DELETE"
        variant="danger"
        isPending={deletePersonMutation.isPending}
        onConfirm={() => {
          if (confirmDeletePerson !== null) {
            deletePersonMutation.mutate(confirmDeletePerson.id, {
              onSettled: () => setConfirmDeletePerson(null),
            });
          }
        }}
        onCancel={() => setConfirmDeletePerson(null)}
      />

      {/* Reassign modal — temporary profession coverage */}
      <AnimatePresence>
        {reassignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-lg w-full space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Temporary Reassignment
                </h3>
                <p className="text-sm text-zinc-500 font-mono">
                  Cover a vacant profession with a healthy survivor.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Vacant Profession (target)
                  </p>
                  <div className="grid gap-2">
                    {professionCoverage.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setReassignVacantProfId(prof.id);
                          setReassignPersonId(null);
                        }}
                        className={cn(
                          'p-3 text-left border rounded-lg transition-all w-full',
                          reassignVacantProfId === prof.id
                            ? 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary'
                            : 'bg-surface-base border-zinc-800 text-zinc-400 hover:border-zinc-700',
                        )}
                      >
                        <p className="text-xs font-bold uppercase">{prof.name}</p>
                        <p className="text-[10px] font-mono opacity-60">
                          {prof.total} assigned, 0 active
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {reassignVacantProfId && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Select Healthy Survivor (source)
                    </p>
                    <div className="grid gap-2 max-h-48 overflow-auto pr-1">
                      {allSurvivors
                        .filter(
                          (p) =>
                            normalizePersonStatus(p.status) === 'HEALTHY' &&
                            p.profession_id != null &&
                            p.profession_id !== reassignVacantProfId,
                        )
                        .map((person) => (
                          <button
                            key={person.id}
                            onClick={() => setReassignPersonId(person.id)}
                            className={cn(
                              'p-3 text-left border rounded-lg transition-all w-full',
                              reassignPersonId === person.id
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-surface-base border-zinc-800 text-zinc-400 hover:border-zinc-700',
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{person.full_name}</span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {person.profession_name || 'UNASSIGNED'}
                              </span>
                            </div>
                          </button>
                        ))}
                      {allSurvivors.filter(
                        (p) =>
                          normalizePersonStatus(p.status) === 'HEALTHY' &&
                          p.profession_id != null &&
                          p.profession_id !== reassignVacantProfId,
                      ).length === 0 && (
                        <p className="text-[11px] text-zinc-600 font-mono text-center py-4">
                          No other healthy survivors available.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-900">
                <button
                  onClick={() => {
                    setReassignModal(false);
                    setReassignVacantProfId(null);
                    setReassignPersonId(null);
                  }}
                  className="flex-1 py-3 font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  disabled={
                    !reassignVacantProfId || !reassignPersonId || reassignMutation.isPending
                  }
                  onClick={() => {
                    if (!reassignVacantProfId || !reassignPersonId) return;
                    const person = allSurvivors.find((p) => p.id === reassignPersonId);
                    const fromProfId = person?.profession_id;
                    if (!fromProfId) return;
                    reassignMutation.mutate({
                      personId: reassignPersonId,
                      fromProfId,
                      toProfId: reassignVacantProfId,
                    });
                  }}
                  className="flex-2 py-3 bg-amber-600 text-black font-black uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30"
                >
                  {reassignMutation.isPending ? 'REASSIGNING...' : 'CONFIRM REASSIGN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="pt-4 flex items-center justify-between">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          {personnelCountLabel}: {personnelCount} · Showing {paginatedSurvivors.length} on page{' '}
          {currentPage} of {totalPages}
        </p>
        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {feedback && (
        <ActionFeedbackDialog
          isOpen={true}
          type={feedback.type}
          eyebrow="Population Roster"
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
