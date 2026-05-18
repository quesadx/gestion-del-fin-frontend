import { useEffect } from 'react';
import { api } from '@/shared/api/axiosInstance';
import { useCampStore } from '@/features/camps/store/camp.store';

export function useServerTime() {
  const syncServerTime = useCampStore((state) => state.syncServerTime);

  useEffect(() => {
    const sync = async () => {
      try {
        const data = await api.get<{ now: number }>('/system/time').then((r) => r.data);
        syncServerTime(data.now);
      } catch {
        void 0;
      }
    };

    sync();
    const interval = setInterval(sync, 60_000);
    return () => clearInterval(interval);
  }, [syncServerTime]);
}

export function getServerNow(): number {
  const { serverTime, lastSyncLocal } = useCampStore.getState();

  return serverTime + (Date.now() - lastSyncLocal);
}
