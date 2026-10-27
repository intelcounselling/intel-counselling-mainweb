// Central pricing source of truth.
//
// DEMO MODE: set the DEMO_MODE environment variable to "true" (or "1"/"yes")
// and every service price collapses to ₹1 so payment flows can be
// demonstrated end-to-end (Razorpay test mode / tiny live charge) without
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
  // Intel Student Assessments: Module A = the five Intel tests; Module B = the full
  // 7-test battery with the integrated profile (includes A — owners of A pay the difference)
  intell_assessment: Number(process.env.INTELL_PRICE_A || 250),
  intell_module_b: Number(process.env.INTELL_PRICE_B || 300),
  // Mindbridge parent + student package, paid by the parent in the portal
  family_package: Number(process.env.FAMILY_PRICE || 500),
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
