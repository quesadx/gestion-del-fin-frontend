import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { TacticalButton } from '@/components/tactical/TacticalButton';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { usePeople } from '@/features/people/hooks/usePeople';
import { useProfessions } from '@/features/professions/hooks/useProfessions';
import { Users, UserPlus, Search, FilterX } from 'lucide-react';

const PAGE_SIZE = 20;

function getPersonStatusVariant(status: string): 'green' | 'amber' | 'red' {
  switch (status) {
    case 'HEALTHY':
      return 'green';
    case 'SICK':
      return 'amber';
    case 'INJURED':
      return 'amber';
    case 'DEAD':
      return 'red';
    default:
      return 'red';
  }
}

export function PeopleListPage() {
  const navigate = useNavigate();
  const { data: camps, isLoading: campsLoading, isError: campsError } = useCamps();
  const { data: professions } = useProfessions();
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [professionFilter, setProfessionFilter] = useState<string>('');

  const {
    data: people,
    isLoading: peopleLoading,
    isError: peopleError,
    error: peopleErr,
    refetch: refetchPeople,
  } = usePeople(selectedCampId ?? 0, { page, limit: PAGE_SIZE });

  const peopleArray = people?.data ?? [];
  const peoplePagination = people?.pagination;
  const campsArray = camps?.data ?? [];
  const professionsArray = Array.isArray(professions) ? professions : [];

  const hasActiveFilters = Boolean(searchTerm || statusFilter || professionFilter);

  const filteredPeople = peopleArray.filter((p) => {
    if (searchTerm) {
      const name = (p.full_name as string) || '';
      if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }
    if (statusFilter && (p.status as string) !== statusFilter) return false;
    if (professionFilter) {
      const profId = p.profession_id as number;
      if (profId !== Number(professionFilter)) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setProfessionFilter('');
  };

  const campIsEmpty = peopleArray.length === 0;
  const filterIsEmpty = !campIsEmpty && filteredPeople.length === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <GlassPanel title="PEOPLE_DIRECTORY" tag="PPL.01" status="ONLINE" accent="cyan">
        {campsLoading ? (
          <HoloLoader />
        ) : campsError ? (
          <p className="text-sm text-red-400 font-mono-data">Failed to load camps.</p>
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Users className="h-8 w-8 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO CAMPS AVAILABLE</p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              CAMP //
            </label>
            <select
              value={selectedCampId ?? ''}
              onChange={(e) => {
                setSelectedCampId(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">SELECT A CAMP</option>
              {campsArray.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </GlassPanel>

      {!selectedCampId ? (
        <GlassPanel accent="amber">
          <div className="flex flex-col items-center gap-4 py-8">
            <Users className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground text-center">
              SELECT A CAMP
            </p>
          </div>
        </GlassPanel>
      ) : peopleLoading ? (
        <HoloLoader />
      ) : peopleError ? (
        <GlassPanel title="ERROR" status="ERROR" accent="amber">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(peopleErr as Error)?.message || 'Failed to load people'}
          </p>
          <TacticalButton variant="warning" onClick={() => refetchPeople()}>
            RETRY
          </TacticalButton>
        </GlassPanel>
      ) : campIsEmpty ? (
        <GlassPanel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <Users className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              NO PEOPLE REGISTERED IN THIS CAMP
            </p>
            <TacticalButton variant="primary" onClick={() => navigate('/people/new')}>
              REGISTER PERSON
            </TacticalButton>
          </div>
        </GlassPanel>
      ) : (
        <GlassPanel title="PEOPLE LIST" tag={`PPL.${selectedCampId}`} status="ONLINE" accent="cyan">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neon-cyan)]/50" />
              <input
                type="text"
                placeholder="SEARCH BY NAME..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">ALL STATUS</option>
              <option value="HEALTHY">HEALTHY</option>
              <option value="SICK">SICK</option>
              <option value="INJURED">INJURED</option>
              <option value="AWAY">AWAY</option>
              <option value="DEAD">DEAD</option>
            </select>
            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">ALL PROFESSIONS</option>
              {professionsArray.map((prof) => (
                <option key={prof.id as number} value={prof.id as number}>
                  {prof.name as string}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <TacticalButton variant="ghost" onClick={clearFilters}>
                <span className="flex items-center gap-1.5">
                  <FilterX className="h-3 w-3" />
                  CLEAR
                </span>
              </TacticalButton>
            )}
            <TacticalButton variant="primary" onClick={() => navigate('/people/new')}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                REGISTER
              </span>
            </TacticalButton>
          </div>

          {hasActiveFilters && peoplePagination && peoplePagination.totalPages > 1 && (
            <div className="mb-3 border border-amber-500/30 bg-amber-950/20 p-2 font-mono-data text-[10px] text-amber-400">
              Filters are applied to the current page only. {peoplePagination.total} total records
              across {peoplePagination.totalPages} pages. Navigate pages to see more results.
            </div>
          )}

          {filterIsEmpty ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <FilterX className="h-8 w-8 text-[var(--neon-cyan)]/30" />
              <p className="font-mono-data text-sm text-muted-foreground">
                NO PEOPLE MATCH SELECTED FILTERS
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-data text-xs">
                  <thead>
                    <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                      <th className="py-3 px-2 font-semibold">ID</th>
                      <th className="py-3 px-2 font-semibold">NAME</th>
                      <th className="py-3 px-2 font-semibold">STATUS</th>
                      <th className="py-3 px-2 font-semibold">PROFESSION</th>
                      <th className="py-3 px-2 font-semibold">ADMITTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPeople.map((person, i: number) => (
                      <tr
                        key={person.id as number}
                        className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] cursor-pointer transition-colors animate-fade-in"
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                        onClick={() => navigate(`/people/${person.id}?campId=${selectedCampId}`)}
                      >
                        <td className="py-3 px-2 text-zinc-500 font-mono text-[10px]">
                          {person.id as number}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {(person.photo_url as string) ? (
                              <img
                                src={person.photo_url as string}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                <span className="font-mono text-[10px] font-bold text-zinc-500">
                                  {(person.full_name as string)?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <span className="text-[var(--neon-fuchsia)] font-bold">
                              {person.full_name as string}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge
                            status={person.status as string}
                            variant={getPersonStatusVariant(person.status as string)}
                          />
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {person.professions?.name || '—'}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {person.admitted_at
                            ? format(new Date(person.admitted_at as string), 'dd/MM/yyyy')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {peoplePagination && peoplePagination.totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-4">
              <TacticalButton
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                PREVIOUS
              </TacticalButton>
              <span className="flex items-center font-mono-data text-xs text-muted-foreground">
                PAGE {peoplePagination.page} OF {peoplePagination.totalPages}
              </span>
              <TacticalButton
                variant="ghost"
                disabled={!peoplePagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                NEXT
              </TacticalButton>
            </div>
          )}
        </GlassPanel>
      )}
    </div>
  );
}
