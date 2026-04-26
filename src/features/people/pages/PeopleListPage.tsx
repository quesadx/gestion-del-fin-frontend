import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/lib/motion';

const DUMMY_PEOPLE = [
  {
    id: 'SRV-0942',
    name: 'ELIAS VANCE',
    role: 'RESOURCE_MANAGER',
    condition: 'HEALTHY',
    location: 'SECTOR_B4_HYDRO',
  },
  {
    id: 'SRV-1209',
    name: 'MARCUS REED',
    role: 'TRAVEL_LEAD',
    condition: 'INJURED',
    location: 'MED_BAY_01',
  },
  {
    id: 'SRV-8821',
    name: 'SARAH CONNOR',
    role: 'SYSTEM_ADMIN',
    condition: 'HEALTHY',
    location: 'PERIMETER_GATE_NORTH',
  },
  {
    id: 'SRV-0034',
    name: 'ELENA MARS',
    role: 'WORKER',
    condition: 'CRITICAL',
    location: 'ICU_STATION_B',
  },
  {
    id: 'SRV-5421',
    name: 'OTTO KLINE',
    role: 'WORKER',
    condition: 'SICK',
    location: 'QUARANTINE_ZONE_C',
  },
  {
    id: 'SRV-7704',
    name: 'JADE WREN',
    role: 'WORKER',
    condition: 'HEALTHY',
    location: 'COMMS_HUB',
  },
];

export function PeopleListPage() {
  const reduceMotion = useReducedMotion();
  const listVariants = reduceMotion ? {} : staggerContainer;
  const itemVariants = reduceMotion ? {} : staggerItem;
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
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

  const filteredPeople = DUMMY_PEOPLE.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || person.role === roleFilter;

    let matchesCondition = conditionFilter === 'ALL';
    if (conditionFilter === 'HEALTHY') matchesCondition = person.condition === 'HEALTHY';
    if (conditionFilter === 'WARNING')
      matchesCondition = person.condition === 'INJURED' || person.condition === 'SICK';
    if (conditionFilter === 'CRITICAL') matchesCondition = person.condition === 'CRITICAL';

    return matchesSearch && matchesRole && matchesCondition;
  });

  const totalCount = DUMMY_PEOPLE.length;
  const healthyCount = DUMMY_PEOPLE.filter((p) => p.condition === 'HEALTHY').length;
  const warningCount = DUMMY_PEOPLE.filter(
    (p) => p.condition === 'INJURED' || p.condition === 'SICK',
  ).length;
  const criticalCount = DUMMY_PEOPLE.filter((p) => p.condition === 'CRITICAL').length;

  const splitIndex = Math.ceil(filteredPeople.length / 2);
  const leftList = filteredPeople.slice(0, splitIndex);
  const rightList = filteredPeople.slice(splitIndex);

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">FILTERS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              QUERY
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
          {leftList.map((person) => (
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
              <div className="pip-label">LOC {person.location}</div>
            </motion.div>
          ))}
          {leftList.length === 0 && <div className="pip-label">NO MATCHES</div>}
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
          {rightList.map((person) => (
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
              <div className="pip-label">LOC {person.location}</div>
            </motion.div>
          ))}
          {rightList.length === 0 && <div className="pip-label">NO MATCHES</div>}
        </motion.div>
      </div>
    </>
  );
}
