import { useEffect, useRef, useCallback } from 'react';

interface UseSmartPollingOptions {
  enabled: boolean;
  interval: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  onPoll: () => void | Promise<void>;
  dependencies?: any[];
}

/**
 * Smart polling hook that:
 * - Starts with a base interval
 * - Increases interval when no changes are detected
 * - Resets to base interval when changes are detected
 * - Can be paused/resumed
 */
export const useSmartPolling = ({
  enabled,
  interval,
  maxInterval = 30000, // 30 seconds max
  backoffMultiplier = 1.5,
  onPoll,
  dependencies = []
}: UseSmartPollingOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntervalRef = useRef(interval);
  const isPollingRef = useRef(false);
  const lastDataRef = useRef<any>(null);

  const poll = useCallback(async () => {
    if (!enabled || isPollingRef.current) return;

    isPollingRef.current = true;
    try {
      const result = await onPoll();

      // Check if data changed (simple comparison)
      if (JSON.stringify(result) !== JSON.stringify(lastDataRef.current)) {
        // Data changed, reset to base interval
        currentIntervalRef.current = interval;
        lastDataRef.current = result;
      } else {
        // No changes, increase interval (with backoff)
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * backoffMultiplier,
          maxInterval
        );
      }
    } catch (error) {
      console.error('Polling error:', error);
      // On error, increase interval more aggressively
      currentIntervalRef.current = Math.min(
        currentIntervalRef.current * backoffMultiplier * 2,
        maxInterval
      );
    } finally {
      isPollingRef.current = false;
    }
  }, [enabled, onPoll, interval, maxInterval, backoffMultiplier]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const scheduleNext = () => {
      intervalRef.current = setTimeout(() => {
        poll().then(() => {
          if (enabled) {
            scheduleNext();
          }
        });
      }, currentIntervalRef.current);
    };

    if (enabled) {
      scheduleNext();
    }
  }, [enabled, poll]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling, ...dependencies]);

  // Reset interval when dependencies change
  useEffect(() => {
    currentIntervalRef.current = interval;
  }, dependencies);

  return {
    startPolling,
    stopPolling,
    currentInterval: currentIntervalRef.current,
  };
};
