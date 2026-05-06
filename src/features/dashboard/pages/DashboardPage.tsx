import { useEffect } from 'react';
import { IdentityPanel, TimePanel, LocationPanel, ResourcesPanel } from '@/shared/ui/pipboy';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useCamps } from '@/features/camps/hooks/useCamps';

export function DashboardPage() {
  const activeCamp = useCampStore((state) => state.activeCamp);
  const setActiveCamp = useCampStore((state) => state.setActiveCamp);
  const campsQuery = useCamps();

  useEffect(() => {
    if (!activeCamp && campsQuery.data?.length) {
      setActiveCamp({
        id: String(campsQuery.data[0].id),
        name: campsQuery.data[0].name,
      });
    }
  }, [activeCamp, campsQuery.data, setActiveCamp]);

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">CAMP SELECTOR</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="pip-select"
            value={String(activeCamp?.id ?? '')}
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
            {campsQuery.data?.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name ?? `Camp ${camp.id}`}
              </option>
            ))}
          </select>
          {campsQuery.isLoading && <span className="pip-label">LOADING CAMPS...</span>}
          {campsQuery.isError && <span className="pip-label red">ERROR LOADING CAMPS</span>}
        </div>
      </div>

      <IdentityPanel />
      <TimePanel />
      <LocationPanel />
      <ResourcesPanel />
    </>
  );
}
