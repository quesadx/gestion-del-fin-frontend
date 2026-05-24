import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface ServerTimeState {
  timeStr: string; // "HH:MM:SS" ticking every second
  today: string; // "YYYY-MM-DD" from server
  synced: boolean;
}

interface ServerTimeResponse {
  now: string; // "HH:MM:SS"
  iso: string; // "2026-04-25T14:05:30.000Z"
  today: string; // "YYYY-MM-DD"
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function useServerTime(): ServerTimeState {
  const [state, setState] = useState<ServerTimeState>({
    timeStr: '--:--:--',
    today: '',
    synced: false,
  });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchServerTime() {
      const fetchStart = Date.now();

      try {
        const res = await apiClient.get<ServerTimeResponse>('/system/time');
        const rtt = Date.now() - fetchStart;

        const serverMs = new Date(res.data.iso).getTime();
        // Estimate the server's clock time at the moment we received the response:
        // server time ≈ serverMs + rtt/2 (half the round-trip has elapsed)
        const offset = serverMs - (fetchStart + rtt / 2);

        const today = res.data.today;

        setState({
          timeStr: formatTime(Date.now() + offset),
          today,
          synced: true,
        });

        intervalId = setInterval(() => {
          setState((prev) => ({
            ...prev,
            timeStr: formatTime(Date.now() + offset),
          }));
        }, 1000);
      } catch {
        setState({ timeStr: '--:--:--', today: '', synced: false });
      }
    }

    fetchServerTime();

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, []);

  return state;
}
