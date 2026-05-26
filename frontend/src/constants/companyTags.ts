/** Preset MSME tags for profiles, filters, campaigns, and bulk tagging. */
export const SUGGESTED_COMPANY_TAGS = [
  "Defence",
  "Aerospace",
  "EV",
  "Forging",
  "Export",
  "GreenTech",
] as const;

export type SuggestedCompanyTag = (typeof SUGGESTED_COMPANY_TAGS)[number];
