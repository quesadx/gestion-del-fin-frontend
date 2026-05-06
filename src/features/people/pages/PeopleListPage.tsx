import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/lib/motion';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { usePeople } from '@/features/people/hooks/usePeople';
import type { PersonApiModel } from '@/features/people/api/people.api';

const getConditionTone = (condition: string) => {
  switch (condition) {
    case 'INJURED':
    case 'SICK':
      return 'amber';
    case 'CRITICAL':
      return 'red';
    default:
      return '';
  }
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return value;
  }
};

export function PeopleListPage() {
  const reduceMotion = useReducedMotion();
  const listVariants = reduceMotion ? {} : staggerContainer;
  const itemVariants = reduceMotion ? {} : staggerItem;
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [selectedCampId, setSelectedCampId] = useState('');

  const activeCamp = useCampStore((state) => state.activeCamp);
  const setActiveCamp = useCampStore((state) => state.setActiveCamp);
  const campsQuery = useCamps();
  const peopleQuery = usePeople(activeCamp?.id);

  useEffect(() => {
    if (activeCamp && String(activeCamp.id) !== selectedCampId) {
      setSelectedCampId(String(activeCamp.id));
    } else if (!activeCamp && !selectedCampId && campsQuery.data?.length) {
      setSelectedCampId(String(campsQuery.data[0].id));
    }
  }, [activeCamp, campsQuery.data, selectedCampId]);

  const handleSelectCamp = () => {
    const selectedCamp = campsQuery.data?.find(
      (camp) => String(camp.id) === String(selectedCampId),
    );

    if (selectedCamp) {
      setActiveCamp(selectedCamp);
    }
  };

  const people = peopleQuery.data ?? [];
  const filteredPeople = people.filter((person) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      person.full_name.toLowerCase().includes(term) ||
      String(person.id).includes(term) ||
      person.identification_code.toLowerCase().includes(term);
    const professionName = person.professions?.name?.toUpperCase() ?? '';
    const matchesRole =
      roleFilter === 'ALL' || professionName === roleFilter.toUpperCase();

    let matchesCondition = conditionFilter === 'ALL';
    if (conditionFilter === 'HEALTHY') matchesCondition = person.status === 'HEALTHY';
    if (conditionFilter === 'WARNING')
      matchesCondition = person.status === 'INJURED' || person.status === 'SICK';
    if (conditionFilter === 'CRITICAL') matchesCondition = person.status === 'CRITICAL';
    if (conditionFilter === 'AWAY') matchesCondition = person.status === 'AWAY';

    return matchesSearch && matchesRole && matchesCondition;
  });

  const totalCount = people.length;
  const healthyCount = people.filter((p) => p.status === 'HEALTHY').length;
  const warningCount = people.filter(
    (p) => p.status === 'INJURED' || p.status === 'SICK',
  ).length;
  const criticalCount = people.filter((p) => p.status === 'CRITICAL').length;

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">CAMP SELECTOR</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="pip-select"
              disabled={campsQuery.isLoading || campsQuery.isError}
              style={{ minWidth: 220 }}
            >
              {campsQuery.data?.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name ?? camp.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="pip-button"
              onClick={handleSelectCamp}
              disabled={!selectedCampId || campsQuery.isLoading || campsQuery.isError}
            >
              SELECT CAMP
            </button>
          </div>

          <div className="pip-row">
            <span className="pip-label">ACTIVE CAMP</span>
            <span className="pip-value">{activeCamp?.name ?? 'NONE SELECTED'}</span>
          </div>

          {campsQuery.isError && (
            <div className="pip-label red">ERROR LOADING CAMPS</div>
          )}
        </div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">FILTERS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              SEARCH
            </div>
            <input
              type="text"
              placeholder="SEARCH ROSTER"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pip-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pip-select"
              style={{ minWidth: 150 }}
            >
              <option value="ALL">ALL PROFESSIONS</option>
              <option value="ENGINEER">ENGINEER</option>
              <option value="SCOUT">SCOUT</option>
              <option value="OTHER">OTHER</option>
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="pip-select"
              style={{ minWidth: 180 }}
            >
              <option value="ALL">ALL STATUS</option>
              <option value="HEALTHY">HEALTHY</option>
              <option value="WARNING">INJURED / SICK</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="AWAY">AWAY</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">SUMMARY</span>
        <div className="pip-row">
          <span className="pip-label">TOTAL</span>
          <span className="pip-value">{String(totalCount).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">HEALTHY</span>
          <span className="pip-value">{String(healthyCount).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">WARNING</span>
          <span className="pip-value amber">{String(warningCount).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">CRITICAL</span>
          <span className="pip-value red">{String(criticalCount).padStart(3, '0')}</span>
        </div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0 }}>
        <span className="pip-frame-title">PEOPLE ROSTER</span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 24,
          }}
        >
          {peopleQuery.isLoading && <div className="pip-label">LOADING PEOPLE...</div>}
          {!peopleQuery.isLoading && !activeCamp && (
            <div className="pip-label">SELECT A CAMP TO LOAD PEOPLE.</div>
          )}
          {!peopleQuery.isLoading && activeCamp && filteredPeople.length === 0 && (
            <div className="pip-label">NO MATCHES</div>
          )}
          {filteredPeople.map((person) => (
            <motion.div
              key={person.id}
              className="pip-frame"
              style={{ padding: 12, minHeight: 0 }}
              variants={itemVariants}
              initial="initial"
              animate="animate"
            >
              <div className="pip-row">
                <span className="pip-label">{person.identification_code}</span>
                <span className={`pip-value ${getConditionTone(person.status)}`}>
                  {person.status}
                </span>
              </div>
              <div className="pip-row">
                <span className="pip-value" style={{ fontSize: 18 }}>
                  {person.full_name}
                </span>
                <span className="pip-label">{person.professions?.name ?? 'UNKNOWN'}</span>
              </div>
              <div className="pip-row" style={{ gap: 12 }}>
                <div>
                  <span className="pip-label">AGE</span>
                  <div className="pip-value" style={{ fontSize: 16 }}>
                    {person.age}
                  </div>
                </div>
                <div>
                  <span className="pip-label">BLOOD</span>
                  <div className="pip-value" style={{ fontSize: 16 }}>
                    {person.blood_type}
                  </div>
                </div>
              </div>
              <div className="pip-row" style={{ gap: 12 }}>
                <div>
                  <span className="pip-label">CAMP</span>
                  <div className="pip-value" style={{ fontSize: 16 }}>
                    {person.camps?.name ?? 'UNKNOWN'}
                  </div>
                </div>
                <div>
                  <span className="pip-label">ADMITTED</span>
                  <div className="pip-value" style={{ fontSize: 16 }}>
                    {formatDate(person.admitted_at)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="pip-label">SKILLS</div>
                <div className="pip-value" style={{ fontSize: 14, lineHeight: 1.4 }}>
                  {person.skills_summary || 'No skills summary available.'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
