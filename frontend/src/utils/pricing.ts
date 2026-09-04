import { useEffect, useState } from 'react';

// Client-side mirror of the backend's pricing config (GET /api/config).
// Display-only: the charged amount is always derived server-side in
// create-cashfree-session. Falls back to the standard price table when the
// config endpoint is unreachable (e.g. offline dev without the backend).

export const DEFAULT_PRICES = {
  session_online: 1600,
  session_inperson: 2000,
  career_assessment: 2999,
  career_assessment_plus: 4999,
};

export interface PricingConfig {
  demoMode: boolean;
  prices: Record<string, number>;
}

let cachedConfig: PricingConfig | null = null;
let inflight: Promise<PricingConfig> | null = null;

async function loadConfig(): Promise<PricingConfig> {
  if (cachedConfig) return cachedConfig;
  if (!inflight) {
    inflight = fetch('/api/config')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        cachedConfig = {
          demoMode: !!data.demoMode,
          prices: { ...DEFAULT_PRICES, ...(data.prices || {}) },
        };
        return cachedConfig;
      })
      .catch(() => {
        // Backend unavailable — behave as if demo mode is off.
        cachedConfig = { demoMode: false, prices: { ...DEFAULT_PRICES } };
        return cachedConfig;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// React hook: returns the current pricing config. Until the config loads it
// optimistically reports standard pricing, then re-renders once known.
export function usePricing(): PricingConfig {
  const [config, setConfig] = useState<PricingConfig>(
    cachedConfig || { demoMode: false, prices: { ...DEFAULT_PRICES } }
  );

  useEffect(() => {
    let alive = true;
    loadConfig().then((c) => {
      if (alive) setConfig(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  return config;
}

// ₹ formatting that matches the site's existing display: grouped thousands
// for round rupees ("₹2,999"), plain decimals for demo prices ("₹0.1").
export function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
