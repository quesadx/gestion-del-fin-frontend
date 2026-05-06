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
    if (!selectedCampId && campsQuery.data?.length) {
      setSelectedCampId(String(campsQuery.data[0].id));
    }
  }, [selectedCampId, campsQuery.data]);

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
      person.name.toLowerCase().includes(term) ||
      person.id.toLowerCase().includes(term);
    const matchesRole = roleFilter === 'ALL' || person.role === roleFilter;

    let matchesCondition = conditionFilter === 'ALL';
    if (conditionFilter === 'HEALTHY') matchesCondition = person.condition === 'HEALTHY';
    if (conditionFilter === 'WARNING')
      matchesCondition = person.condition === 'INJURED' || person.condition === 'SICK';
    if (conditionFilter === 'CRITICAL') matchesCondition = person.condition === 'CRITICAL';

    return matchesSearch && matchesRole && matchesCondition;
  });

  const totalCount = people.length;
  const healthyCount = people.filter((p) => p.condition === 'HEALTHY').length;
  const warningCount = people.filter(
    (p) => p.condition === 'INJURED' || p.condition === 'SICK',
  ).length;
  const criticalCount = people.filter((p) => p.condition === 'CRITICAL').length;

  const splitIndex = Math.ceil(filteredPeople.length / 2);
  const leftList = filteredPeople.slice(0, splitIndex);
  const rightList = filteredPeople.slice(splitIndex);

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">CAMP SELECTOR</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="pip-select"
              disabled={campsQuery.isLoading || campsQuery.isError}
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
          {peopleQuery.isError && (
            <div className="pip-label red">
              ERROR LOADING PEOPLE: {String(peopleQuery.error?.message ?? 'UNKNOWN')}
            </div>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pip-select"
            >
              <option value="ALL">ALL ROLES</option>
              <option value="WORKER">WORKER</option>
              <option value="RESOURCE_MANAGER">RESOURCE MGR</option>
              <option value="TRAVEL_LEAD">TRAVEL LEAD</option>
              <option value="SYSTEM_ADMIN">SYS ADMIN</option>
            </select>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="pip-select"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="HEALTHY">HEALTHY</option>
              <option value="WARNING">INJURED / SICK</option>
              <option value="CRITICAL">CRITICAL</option>
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

      <div className="pip-frame" style={{ minHeight: 0, overflow: 'hidden' }}>
        <span className="pip-frame-title">ROSTER A</span>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {peopleQuery.isLoading && <div className="pip-label">LOADING PEOPLE...</div>}
          {!peopleQuery.isLoading && !activeCamp && (
            <div className="pip-label">SELECT A CAMP TO LOAD PEOPLE.</div>
          )}
          {!peopleQuery.isLoading && activeCamp && leftList.length === 0 && (
            <div className="pip-label">NO MATCHES</div>
          )}
          {leftList.map((person: PersonApiModel) => (
            <motion.div key={person.id} variants={itemVariants}>
              <div className="pip-row">
                <span className="pip-label">{person.id}</span>
                <span
                  className={`pip-value ${getConditionTone(person.condition)}`}
                  style={{ fontSize: 16 }}
                >
                  {person.condition}
                </span>
              </div>
              <div className="pip-row">
                <span className="pip-value" style={{ fontSize: 18 }}>
                  {person.name}
                </span>
                <span className="pip-label">{person.role}</span>
              </div>
              <div className="pip-label">LOC {person.location ?? 'UNKNOWN'}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: 'hidden' }}>
        <span className="pip-frame-title">ROSTER B</span>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {peopleQuery.isLoading && <div className="pip-label">LOADING PEOPLE...</div>}
          {!peopleQuery.isLoading && !activeCamp && (
            <div className="pip-label">SELECT A CAMP TO LOAD PEOPLE.</div>
          )}
          {!peopleQuery.isLoading && activeCamp && rightList.length === 0 && (
            <div className="pip-label">NO MATCHES</div>
          )}
          {rightList.map((person: PersonApiModel) => (
            <motion.div key={person.id} variants={itemVariants}>
              <div className="pip-row">
                <span className="pip-label">{person.id}</span>
                <span
                  className={`pip-value ${getConditionTone(person.condition)}`}
                  style={{ fontSize: 16 }}
                >
                  {person.condition}
                </span>
              </div>
              <div className="pip-row">
                <span className="pip-value" style={{ fontSize: 18 }}>
                  {person.name}
                </span>
                <span className="pip-label">{person.role}</span>
              </div>
              <div className="pip-label">LOC {person.location ?? 'UNKNOWN'}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
