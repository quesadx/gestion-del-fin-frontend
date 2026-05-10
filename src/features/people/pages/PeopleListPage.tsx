import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { usePeople } from '@/features/people/hooks/usePeople';
import { Users, UserPlus, Search } from 'lucide-react';

const PAGE_SIZE = 20;

function getPersonStatusVariant(status: string): 'green' | 'yellow' | 'red' | 'cyan' {
  switch (status) {
    case 'HEALTHY':
      return 'green';
    case 'SICK':
      return 'yellow';
    case 'INJURED':
      return 'yellow';
    case 'DEAD':
      return 'red';
    default:
      return 'cyan';
  }
}

export function PeopleListPage() {
  const navigate = useNavigate();
  const { data: camps, isLoading: campsLoading, isError: campsError } = useCamps();
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: people,
    isLoading: peopleLoading,
    isError: peopleError,
    error: peopleErr,
    refetch: refetchPeople,
  } = usePeople(selectedCampId ?? 0, { page, limit: PAGE_SIZE });

  const peopleArray = Array.isArray(people) ? people : [];
  const campsArray = Array.isArray(camps) ? camps : [];

  const filteredPeople = peopleArray.filter((p: Record<string, unknown>) => {
    if (!searchTerm) return true;
    const name = (p.full_name as string) || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <Panel title="PEOPLE_DIRECTORY" tag="PPL.01" status="ONLINE" accent="cyan">
        {/* Camp selector */}
        {campsLoading ? (
          <ScreenLoader />
        ) : campsError ? (
          <p className="text-sm text-red-400 font-mono-data">Failed to load camps.</p>
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Users className="h-8 w-8 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO CAMPS AVAILABLE</p>
          </div>
        ) : (
          <>
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
                {campsArray.map((camp: Record<string, unknown>) => (
                  <option key={camp.id as number} value={camp.id as number}>
                    {camp.name as string}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </Panel>

      {/* People content only when camp selected */}
      {!selectedCampId ? (
        <Panel accent="fuchsia">
          <div className="flex flex-col items-center gap-4 py-8">
            <Users className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground text-center">
              SELECT A CAMP
            </p>
          </div>
        </Panel>
      ) : peopleLoading ? (
        <ScreenLoader />
      ) : peopleError ? (
        <Panel title="ERROR" status="ERROR" accent="fuchsia">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(peopleErr as Error)?.message || 'Failed to load people'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetchPeople()}>
            RETRY
          </GlitchButton>
        </Panel>
      ) : filteredPeople.length === 0 ? (
        <Panel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <Users className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              {searchTerm ? 'NO PEOPLE FOUND WITH THAT NAME' : 'NO PEOPLE REGISTERED IN THIS CAMP'}
            </p>
            <GlitchButton variant="primary" onClick={() => navigate('/people/new')}>
              REGISTER PERSON
            </GlitchButton>
          </div>
        </Panel>
      ) : (
        <Panel title="PEOPLE LIST" tag={`PPL.${selectedCampId}`} status="ONLINE" accent="cyan">
          {/* Search and New */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neon-cyan)]/50" />
              <input
                type="text"
                placeholder="SEARCH BY NAME..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <GlitchButton variant="primary" onClick={() => navigate('/people/new')}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                REGISTER PERSON
              </span>
            </GlitchButton>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-3 px-2 font-semibold">NAME</th>
                  <th className="py-3 px-2 font-semibold">STATUS</th>
                  <th className="py-3 px-2 font-semibold">PROFESSION</th>
                  <th className="py-3 px-2 font-semibold">ADMITTED</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((person: Record<string, unknown>) => (
                  <tr
                    key={person.id as number}
                    className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/people/${person.id}`)}
                  >
                    <td className="py-3 px-2 text-[var(--neon-fuchsia)] font-bold">
                      {person.full_name as string}
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge
                        status={person.status as string}
                        variant={getPersonStatusVariant(person.status as string)}
                      />
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {((person.profession as Record<string, unknown>)?.name as string) || '—'}
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

          {/* Pagination */}
          {filteredPeople.length === PAGE_SIZE && (
            <div className="flex justify-center gap-3 mt-4">
              <GlitchButton
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                PREVIOUS
              </GlitchButton>
              <span className="flex items-center font-mono-data text-xs text-muted-foreground">
                PAGE {page}
              </span>
              <GlitchButton
                variant="ghost"
                disabled={filteredPeople.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
              >
                NEXT
              </GlitchButton>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
