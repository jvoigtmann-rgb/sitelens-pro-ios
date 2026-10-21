// Single source of truth for purchasable products. Shared by `create-checkout`
// (resolves price + subscription config server-side) and `payments-webhook`
// (decides what access to grant/revoke). Keep keys stable — they are persisted
// on Base44Purchase.productId and used as the join key to fulfillment.

export type ProductType = "one_time" | "subscription";

export interface SubscriptionInfo {
  subscriptionSettings: {
    frequency: "DAY" | "WEEK" | "MONTH" | "YEAR";
    interval?: number;
    billingCycles?: number;
    autoRenewal?: boolean;
    freeTrialPeriod?: { frequency: "DAY" | "WEEK" | "MONTH" | "YEAR"; interval: number };
  };
  title?: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  price: string; // major units, e.g. "39.99"
  currency: string;
  type: ProductType;
  credits?: number; // one_time: inspection-report credits to grant
  plan?: string; // subscription: plan key written to User.plan
  subscriptionInfo?: SubscriptionInfo;
}

// Pro monthly report allowance + rolling-window length. Wix exposes no
// per-cycle renewal webhook we can rely on, so the paid-term quota self-resets
// on a rolling 30-day window from the user's first paid-term report.
export const PRO_MONTHLY_REPORTS = 10;
export const PRO_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const PRODUCTS: Record<string, Product> = {
  pro_monthly: {
    id: "pro_monthly",
    name: "SiteLens Pro",
    price: "39.99",
    currency: "USD",
    type: "subscription",
    plan: "pro",
    subscriptionInfo: {
      subscriptionSettings: {
        frequency: "MONTH",
        freeTrialPeriod: { frequency: "DAY", interval: 7 },
      },
      title: "SiteLens Pro Monthly",
      description: "7-day free trial (1 inspection), then $39.99/month with 10 AI inspections each month.",
    },
  },
  report_1: {
    id: "report_1",
    name: "1 Extra Inspection Report",
    price: "14.99",
    currency: "USD",
    type: "one_time",
    credits: 1,
  },
  report_3: {
    id: "report_3",
    name: "3 Extra Inspection Reports",
    price: "29.99",
    currency: "USD",
    type: "one_time",
    credits: 3,
  },
};

export function getProduct(id: string): Product | undefined {
  return PRODUCTS[id];
}