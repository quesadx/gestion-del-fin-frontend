import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/lib/motion';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useAdmissions } from '@/features/admissions/hooks/useAdmissions';
import { useExplorations } from '@/features/explorations/hooks/useExplorations';

const getStatusTone = (status: string) => {
  switch (status.toUpperCase()) {
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
  const activeCamp = useCampStore((state) => state.activeCamp);
  const setActiveCamp = useCampStore((state) => state.setActiveCamp);
  const campsQuery = useCamps();
  const explorationsQuery = useExplorations(activeCamp?.id);
  const admissionsQuery = useAdmissions(activeCamp?.id);
  const explorations = useMemo(() => explorationsQuery.data ?? [], [explorationsQuery.data]);
  const admissions = useMemo(() => admissionsQuery.data ?? [], [admissionsQuery.data]);
  const errorMessage =
    explorationsQuery.error instanceof Error ? explorationsQuery.error.message : undefined;
  const admissionsError =
    admissionsQuery.error instanceof Error ? admissionsQuery.error.message : undefined;
  const isLoading = explorationsQuery.isLoading;
  const isError = explorationsQuery.isError;

  const statusCounts = useMemo(() => {
    return explorations.reduce(
      (acc, exp) => {
        const status = String(exp.status ?? 'UNKNOWN').toUpperCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [explorations]);

  const splitIndex = Math.ceil(explorations.length / 2);
  const leftList = explorations.slice(0, splitIndex);
  const rightList = explorations.slice(splitIndex);

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
        <span className="pip-frame-title">CAMP SELECTOR</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              SELECT CAMP
            </div>
            <select
              className="pip-select"
              value={activeCamp?.id ?? ''}
              onChange={(e) => {
                const selectedCamp = campsQuery.data?.find(
                  (camp) => String(camp.id) === e.target.value,
                );
                if (selectedCamp) {
                  setActiveCamp({
                    id: String(selectedCamp.id),
                    name: selectedCamp.name,
                  });
                }
              }}
              disabled={campsQuery.isLoading || campsQuery.isError}
            >
              <option value="" disabled>
                {campsQuery.isLoading ? 'LOADING CAMPS...' : 'SELECT A CAMP'}
              </option>
              {campsQuery.data?.map((camp) => (
                <option key={camp.id} value={String(camp.id)}>
                  {camp.name ?? `Camp ${camp.id}`}
                </option>
              ))}
            </select>
          </div>
          {campsQuery.isError && <div className="pip-label red">ERROR LOADING CAMPS</div>}
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
          {!activeCamp ? (
            <div className="pip-label">SELECT AN ACTIVE CAMP TO LOAD EXPEDITIONS.</div>
          ) : isLoading ? (
            <div className="pip-label">LOADING EXPEDITIONS...</div>
          ) : isError ? (
            <div className="pip-label">
              ERROR LOADING EXPEDITIONS{errorMessage ? `: ${errorMessage}` : ''}
            </div>
          ) : leftList.length === 0 ? (
            <div className="pip-label">NO EXPEDITIONS</div>
          ) : (
            leftList.map((exp) => (
              <motion.div key={exp.id} variants={itemVariants}>
                <div className="pip-row">
                  <span className="pip-label">{exp.id}</span>
                  <span
                    className={`pip-value ${getStatusTone(exp.status ?? '')}`}
                    style={{ fontSize: 16 }}
                  >
                    {String(exp.status ?? '')}
                  </span>
                </div>
                <div className="pip-value" style={{ fontSize: 18 }}>
                  {String(exp.destination ?? '')}
                </div>
                <div className="pip-label">UNIT {String(exp.leadSurvivor ?? '')}</div>
                <div className="pip-label">TIME {String(exp.time ?? '')}</div>
                <div className="pip-label">ACTION {String(exp.action ?? '')}</div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">ADMISSIONS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!activeCamp && <div className="pip-label">SELECT A CAMP TO LOAD ADMISSIONS.</div>}
          {activeCamp && admissionsQuery.isLoading && (
            <div className="pip-label">LOADING ADMISSIONS...</div>
          )}
          {activeCamp && admissionsQuery.isError && (
            <div className="pip-label red">
              ERROR LOADING ADMISSIONS{admissionsError ? `: ${admissionsError}` : ''}
            </div>
          )}
          {activeCamp &&
            !admissionsQuery.isLoading &&
            !admissionsQuery.isError &&
            admissions.length === 0 && <div className="pip-label">NO ADMISSIONS FOUND</div>}
          {activeCamp && admissions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {admissions.map((admission) => (
                <div key={admission.id} className="pip-frame" style={{ padding: 12, minHeight: 0 }}>
                  <div className="pip-row">
                    <span className="pip-label">{admission.id}</span>
                    <span className="pip-value amber">{admission.status ?? 'UNKNOWN'}</span>
                  </div>
                  <div className="pip-row">
                    <span className="pip-value" style={{ fontSize: 18 }}>
                      {admission.applicant_name ?? 'Unnamed Applicant'}
                    </span>
                    <span className="pip-label">{admission.request_type ?? 'REQUEST'}</span>
                  </div>
                  <div className="pip-row" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <span className="pip-label">SUBMITTED</span>
                    <span className="pip-value" style={{ fontSize: 16 }}>
                      {String(admission.submitted_at ?? 'UNKNOWN')}
                    </span>
                  </div>
                  {admission.notes && (
                    <div style={{ marginTop: 8 }}>
                      <div className="pip-label">NOTES</div>
                      <div className="pip-value" style={{ fontSize: 14, lineHeight: 1.4 }}>
                        {admission.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
          {!activeCamp ? (
            <div className="pip-label">SELECT AN ACTIVE CAMP TO LOAD EXPEDITIONS.</div>
          ) : isLoading ? (
            <div className="pip-label">LOADING EXPEDITIONS...</div>
          ) : isError ? (
            <div className="pip-label">
              ERROR LOADING EXPEDITIONS{errorMessage ? `: ${errorMessage}` : ''}
            </div>
          ) : rightList.length === 0 ? (
            <div className="pip-label">NO EXPEDITIONS</div>
          ) : (
            rightList.map((exp) => (
              <motion.div key={exp.id} variants={itemVariants}>
                <div className="pip-row">
                  <span className="pip-label">{exp.id}</span>
                  <span
                    className={`pip-value ${getStatusTone(exp.status ?? '')}`}
                    style={{ fontSize: 16 }}
                  >
                    {String(exp.status ?? '')}
                  </span>
                </div>
                <div className="pip-value" style={{ fontSize: 18 }}>
                  {String(exp.destination ?? '')}
                </div>
                <div className="pip-label">UNIT {String(exp.leadSurvivor ?? '')}</div>
                <div className="pip-label">TIME {String(exp.time ?? '')}</div>
                <div className="pip-label">ACTION {String(exp.action ?? '')}</div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </>
  );
}
