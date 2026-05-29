import type { EnrollInvite } from '../api/enroll'

export const DEMO_TOKEN = 'demo'

/** Placeholder company shown on /enroll/demo — no backend invite required. */
export const DEMO_COMPANY_NAME = 'Demo MSME Unit'

export function isDemoToken(token: string | undefined): token is typeof DEMO_TOKEN {
  return token === DEMO_TOKEN
}

export const DEMO_INVITE: EnrollInvite = {
  token: DEMO_TOKEN,
  kind: 'initial',
  status: 'active',
  recipient_name: DEMO_COMPANY_NAME,
  company_id: null,
  tab1_complete: false,
  can_submit_tab1: true,
  can_access_tab2: false,
  profile_completion: 0,
  section_completion: {
    basic_details: false,
    registration: false,
    products: false,
    certifications: false,
    customers: false,
    machinery: false,
    tags: false,
  },
  prefill: { name: DEMO_COMPANY_NAME },
  expires_at: null,
}
