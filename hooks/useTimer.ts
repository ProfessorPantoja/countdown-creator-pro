import { useState, useEffect, useCallback, useRef } from 'react';

export const useTimer = (initialSeconds: number) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const endTimeRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(initialSeconds);
    endTimeRef.current = null;
  }, [initialSeconds]);

  const toggle = useCallback(() => {
    if (!isActive) {
      // Starting or Resuming
      const now = Date.now();
      // Calculate target end time based on current timeLeft
      endTimeRef.current = now + timeLeft * 1000;
      setIsActive(true);
      setIsFinished(false);
    } else {
      // Pausing
      setIsActive(false);
      endTimeRef.current = null;
    }
  }, [isActive, timeLeft]);

  useEffect(() => {
    // Updates when initialSeconds changes by user input
    if (!isActive) {
      setTimeLeft(initialSeconds);
    }
  }, [initialSeconds, isActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && !isFinished) {
      interval = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.ceil((endTimeRef.current - now) / 1000);

          if (remaining <= 0) {
            setTimeLeft(0);
            setIsFinished(true);
            setIsActive(false);
            if (interval) clearInterval(interval);
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 100); // Check every 100ms for better precision, though UI updates per second effectively
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isFinished]);

  return { timeLeft, isActive, isFinished, reset, toggle, setTimeLeft };
};
