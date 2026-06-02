import { useState, useEffect, useCallback } from "react";

export function useCountdownTimer(initialH: number, initialM: number, initialS: number) {
  const toSecs = (h: number, m: number, s: number) => h * 3600 + m * 60 + s;
  const [total, setTotal] = useState(toSecs(initialH, initialM, initialS));

  useEffect(() => {
    const id = setInterval(() => {
      setTotal(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    hours:   String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    isUrgent: total < 3600,
  };
}

export function useActiveTab(initial: string) {
  const [activeTab, setActiveTab] = useState(initial);
  const switchTab = useCallback((tab: string) => setActiveTab(tab), []);
  return [activeTab, switchTab] as const;
}
