export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://cicilin-production.up.railway.app";

export const RANK_XP: Record<string, [number, number]> = {
  Iron:     [0,    99],
  Bronze:   [100,  299],
  Silver:   [300,  599],
  Gold:     [600,  999],
  Platinum: [1000, 1499],
  Diamond:  [1500, 1999],
  Ruby:     [2000, Infinity],
};

export const RANK_LIMIT: Record<string, number> = {
  Ruby:     100_000_000,
  Diamond:   50_000_000,
  Platinum:  25_000_000,
  Gold:      10_000_000,
  Silver:     5_000_000,
  Bronze:     2_000_000,
  Iron:               0,
};

export const RANK_RATE: Record<string, number> = {
  Ruby:      6,
  Diamond:   9,
  Platinum: 12,
  Gold:     15,
  Silver:   18,
  Bronze:   24,
  Iron:      0,
};

export const LOAN_INTENTS = [
  { label: "Education",       value: "EDUCATION" },
  { label: "Medical",         value: "MEDICAL" },
  { label: "Venture",         value: "VENTURE" },
  { label: "Personal",        value: "PERSONAL" },
  { label: "Debt Consol.",    value: "DEBTCONSOLIDATION" },
  { label: "Home Renovation", value: "HOMEIMPROVEMENT" },
] as const;

export const LOAN_TENURES = [3, 6, 12, 24] as const;

export const HOME_OWNERSHIP_OPTIONS = [
  { label: "Rent",     value: "RENT" },
  { label: "Own",      value: "OWN" },
  { label: "Mortgage", value: "MORTGAGE" },
  { label: "Other",    value: "OTHER" },
] as const;
