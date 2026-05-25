import { useEffect, useMemo } from 'react';
import { useStockAlerts } from '@/features/inventory/hooks/useStockAlerts';
import { usePeople } from '@/features/people/hooks/usePeople';
import { useExplorations } from '@/features/explorations/hooks/useExplorations';
import { useEmotionalStore, type EmotionalState } from '@/features/ui/store/emotional.store';
import type { Person } from '@/features/people/types/person.types';
import type { Exploration } from '@/features/explorations/types/exploration.types';

function deriveEmotionalState(metrics: {
  criticalStockCount: number;
  lowStockCount: number;
  injuredCount: number;
  sickCount: number;
  activeExplorations: number;
}): EmotionalState {
  const { criticalStockCount, lowStockCount, injuredCount, sickCount, activeExplorations } =
    metrics;

  if (
    criticalStockCount > 0 ||
    injuredCount + sickCount > 5 ||
    (lowStockCount > 2 && activeExplorations > 2)
  ) {
    return 'critical';
  }

  if (lowStockCount > 0 || injuredCount + sickCount > 2 || activeExplorations > 3) {
    return 'alert';
  }

  return 'stable';
}

interface EmotionalSyncerProps {
  campId?: number | null;
}

export function useEmotionalSyncer({ campId }: EmotionalSyncerProps) {
  const setState = useEmotionalStore((s) => s.setState);

  const { totalCritical, hasAlerts } = useStockAlerts(campId ?? 0);
  const peopleQuery = usePeople(campId ?? 0);
  const explorationsQuery = useExplorations();

  const people = useMemo(
    () => (Array.isArray(peopleQuery.data?.data) ? (peopleQuery.data!.data as Person[]) : []),
    [peopleQuery.data],
  );

  const explorations = useMemo(
    () => (Array.isArray(explorationsQuery.data) ? (explorationsQuery.data as Exploration[]) : []),
    [explorationsQuery.data],
  );

  const metrics = useMemo(() => {
    return {
      criticalStockCount: campId ? totalCritical : 0,
      lowStockCount: campId ? (hasAlerts ? totalCritical : 0) : 0,
      injuredCount: people.filter((p) => (p as Person).status === 'INJURED').length,
      sickCount: people.filter((p) => (p as Person).status === 'SICK').length,
      activeExplorations: explorations.filter((e) => (e as Exploration).status === 'ONGOING')
        .length,
    };
  }, [totalCritical, hasAlerts, people, explorations, campId]);

  useEffect(() => {
    const state = deriveEmotionalState(metrics);
    setState(state);
  }, [metrics, setState]);

  useEffect(() => {
    const updateAttribute = () => {
      const effective = useEmotionalStore.getState().effectiveState();
      document.documentElement.setAttribute('data-emotional-state', effective);
    };

    updateAttribute();

    const unsubscribe = useEmotionalStore.subscribe(() => {
      updateAttribute();
    });

    return () => {
      unsubscribe();
      document.documentElement.removeAttribute('data-emotional-state');
    };
  }, []);
}
