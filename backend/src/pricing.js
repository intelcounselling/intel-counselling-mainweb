// Central pricing source of truth.
//
// DEMO MODE: set the DEMO_MODE environment variable to "true" (or "1"/"yes")
// and every service price collapses to ₹1 so payment flows can be
// demonstrated end-to-end (Cashfree sandbox / tiny live charge) without
// touching real prices. Unset it (or set anything else) and normal pricing
// returns — no code change needed, just a backend restart/redeploy.
//
// The client never sends an amount; it only picks a serviceId. Displayed
// prices come from GET /api/config so they always mirror what will be charged.

export const DEMO_PRICE = 1;

const BASE_PRICES = {
  session_online: Number(process.env.SESSION_PRICE_ONLINE || 1600),
  session_inperson: Number(process.env.SESSION_PRICE_INPERSON || 2000),
  career_assessment: Number(process.env.CAREER_PRICE_ASSESSMENT || 2999),
  career_assessment_plus: Number(process.env.CAREER_PRICE_PLUS || 4999),
};

export function isDemoMode() {
  return ['true', '1', 'yes'].includes(String(process.env.DEMO_MODE || '').trim().toLowerCase());
}

// Returns the effective price table. In demo mode every service costs ₹0.1.
export function getPrices() {
  const demo = isDemoMode();
  const prices = {};
  for (const [serviceId, base] of Object.entries(BASE_PRICES)) {
    prices[serviceId] = demo ? DEMO_PRICE : base;
  }
  return prices;
}

export function getPriceFor(serviceId) {
  const prices = getPrices();
  return prices[serviceId];
}
