import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/lib/motion';

const DUMMY_EXPLORATIONS = [
  {
    id: 'EXP-77',
    destination: 'RUINED HOSPITAL',
    leadSurvivor: 'MARCUS REED',
    time: '3 DAYS AGO',
    status: 'COMPLETED',
    action: 'DEBRIEF_LOG',
  },
  {
    id: 'EXP-82',
    destination: 'SECTOR B // POWER PLANT',
    leadSurvivor: 'ELIAS VANCE',
    time: 'EST: 5 DAYS',
    status: 'IN_PROGRESS',
    action: 'MONITOR_FEED',
  },
  {
    id: 'EXP-85',
    destination: 'SUBWAY TUNNEL ALPHA',
    leadSurvivor: 'SARAH CONNOR',
    time: 'LOST: 2 DAYS AGO',
    status: 'FAILED',
    action: 'INITIATE_RECOVERY',
  },
  {
    id: 'EXP-88',
    destination: 'OLD WORLD ARCHIVE',
    leadSurvivor: 'DR. ARIS',
    time: 'DURATION: 4 DAYS',
    status: 'PENDING',
    action: 'DEPLOY_UNIT',
  },
];

const getStatusTone = (status: string) => {
  switch (status) {
    case 'FAILED':
      return 'red';
    case 'IN_PROGRESS':
      return '';
    case 'PENDING':
      return 'amber';
    case 'COMPLETED':
      return '';
    default:
      return '';
  }
};

export function ExplorationsPage() {
  const reduceMotion = useReducedMotion();
  const listVariants = reduceMotion ? {} : staggerContainer;
  const itemVariants = reduceMotion ? {} : staggerItem;
  const statusCounts = useMemo(() => {
    return DUMMY_EXPLORATIONS.reduce(
      (acc, exp) => {
        acc[exp.status] = (acc[exp.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, []);

  const splitIndex = Math.ceil(DUMMY_EXPLORATIONS.length / 2);
  const leftList = DUMMY_EXPLORATIONS.slice(0, splitIndex);
  const rightList = DUMMY_EXPLORATIONS.slice(splitIndex);

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">UPLINK</span>
        <div className="pip-row">
          <span className="pip-label">BANDWIDTH</span>
          <span className="pip-value">72.4 KBPS</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">SIGNAL</span>
          <span className="pip-value">STABLE</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">THREAT</span>
          <span className="pip-value amber">ELEVATED</span>
        </div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">STATUS</span>
        <div className="pip-row">
          <span className="pip-label">COMPLETED</span>
          <span className="pip-value">{String(statusCounts.COMPLETED || 0).padStart(2, '0')}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">IN PROGRESS</span>
          <span className="pip-value">
            {String(statusCounts.IN_PROGRESS || 0).padStart(2, '0')}
          </span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">PENDING</span>
          <span className="pip-value amber">
            {String(statusCounts.PENDING || 0).padStart(2, '0')}
          </span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">FAILED</span>
          <span className="pip-value red">{String(statusCounts.FAILED || 0).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: 'hidden' }}>
        <span className="pip-frame-title">EXPEDITIONS A</span>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {leftList.map((exp) => (
            <motion.div key={exp.id} variants={itemVariants}>
              <div className="pip-row">
                <span className="pip-label">{exp.id}</span>
                <span className={`pip-value ${getStatusTone(exp.status)}`} style={{ fontSize: 16 }}>
                  {exp.status}
                </span>
              </div>
              <div className="pip-value" style={{ fontSize: 18 }}>
                {exp.destination}
              </div>
              <div className="pip-label">UNIT {exp.leadSurvivor}</div>
              <div className="pip-label">TIME {exp.time}</div>
              <div className="pip-label">ACTION {exp.action}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: 'hidden' }}>
        <span className="pip-frame-title">EXPEDITIONS B</span>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {rightList.map((exp) => (
            <motion.div key={exp.id} variants={itemVariants}>
              <div className="pip-row">
                <span className="pip-label">{exp.id}</span>
                <span className={`pip-value ${getStatusTone(exp.status)}`} style={{ fontSize: 16 }}>
                  {exp.status}
                </span>
              </div>
              <div className="pip-value" style={{ fontSize: 18 }}>
                {exp.destination}
              </div>
              <div className="pip-label">UNIT {exp.leadSurvivor}</div>
              <div className="pip-label">TIME {exp.time}</div>
              <div className="pip-label">ACTION {exp.action}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
