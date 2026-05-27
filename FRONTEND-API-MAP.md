# Frontend → Backend API Map

Quick reference for the **admin app** (`cat/frontend/` → `cat/backend/`).

| Column | Meaning |
| --- | --- |
| **Frontend API** | Function in `src/api/*.ts` (all use `src/api/client.ts` for JWT) |
| **Backend** | HTTP method + path |
| **Called from** | Page or component that triggers the call |
| **Database** | Tables read (**R**) or written (**W**). `audit_logs` is appended on many mutations. Uploads go to disk, not a table. |

**Dev:** Browser calls `http://localhost:5173/api/...` → Vite proxies to `http://127.0.0.1:8000/api/...`.  
**Auth:** JWT in `localStorage` (`msme.token`) on all rows except login and forgot-password.

---

## Auth

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `login()` | `POST /api/auth/login` | `LoginPage` → `AuthContext.login()` | `users` R; `audit_logs` W |
| `getMe()` | `GET /api/auth/me` | `AuthContext` on app load (if token exists) | `users` R |
| `forgotPasswordRequest()` | `POST /api/auth/forgot-password/request` | `ForgotPasswordPage` — Send code | `users` W (OTP fields) |
| `forgotPasswordReset()` | `POST /api/auth/forgot-password/reset` | `ForgotPasswordPage` — Reset password | `users` W; `audit_logs` W |

---

## Companies

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `listCompanies()` | `GET /api/companies` | `CompaniesListPage` (load, filters, pagination); `GeographicDashboardPage` (pincode drill-down) | `companies` R |
| `exportCompanies()` | `GET /api/companies/export` | `CompaniesListPage` — Export Excel | `companies` R |
| `bulkUpdateTags()` | `POST /api/companies/bulk/tags` | `CompaniesListPage` — bulk + Tag | `companies` W |
| `createCompany()` | `POST /api/companies` | `CompanyAddPage` — Create company | `companies` W; `audit_logs` W |
| `getCompany()` | `GET /api/companies/{id}` | `CompanyProfilePage` (load + after sub-item save) | `companies` R |
| `updateCompany()` | `PATCH /api/companies/{id}` | `CompanyProfilePage` — Save changes, logo URL after upload | `companies` W; `audit_logs` W |
| `deleteCompany()` | `DELETE /api/companies/{id}` | `CompanyProfilePage` — Delete | `companies` D; `audit_logs` W |
| `getLockedFields()` | `GET /api/companies/locked-fields` | `CompanyProfilePage` on load | — (config only) |
| `getMyCompany()` | `GET /api/companies/mine` | *(not used in UI)* | `companies` R |

### Company sub-items (`company-subitems.ts`)

Used by `ProfileSubSections.tsx` on `CompanyProfilePage`.

| Frontend API | Backend | UI action | Database |
| --- | --- | --- | --- |
| `products.list/create/update/remove` | `GET/POST/PATCH/DELETE /api/companies/{id}/products[/{item_id}]` | Products section | `company_products` R/W/D; `companies` W (completion); `audit_logs` W |
| `certifications.*` | `.../certifications...` | Certifications section | `company_certifications` |
| `customers.*` | `.../customers...` | Customers section | `company_customers` |
| `machinery.*` | `.../machinery...` | Machinery section | `company_machinery` |

### Edit requests (`editRequests.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `listPendingEditRequests()` | `GET /api/companies/edit-requests/pending` | `EditRequestsPanel` in `DashboardLayout` | `company_edit_requests` R |
| `reviewEditRequest()` | `POST /api/companies/edit-requests/{id}/review` | Approve / Reject buttons | `company_edit_requests` W; `companies` W on approve; `audit_logs` W |
| `createEditRequest()` | `POST /api/companies/{id}/edit-requests` | *(not used in admin UI)* | `company_edit_requests` W |

### Uploads (`uploads.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `uploadImage()` | `POST /api/uploads` | `CompanyProfilePage` — logo file picker | Disk (`uploads/`); then `companies.logo_url` via `updateCompany()` |
| *(browser)* | `GET /api/uploads/{filename}` | Logo `<img src>` on profile | Disk R |

---

## Dashboard (`dashboard.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `getDistrictsOverview()` | `GET /api/dashboard/districts` | `GeographicDashboardPage` — state view | `companies` R; `master_districts` R |
| `getTaluksForDistrict()` | `GET /api/dashboard/districts/{code}/taluks` | District selected / breadcrumb | `companies` R; `master_taluks` R |
| `getPincodesForTaluk()` | `GET /api/dashboard/districts/{d}/taluks/{t}/pincodes` | Taluk selected | `companies` R; `master_pincodes` R |

Filter dropdowns on the same page use `listEntries()` from `masters.ts` (`districts`, `sectors`, `turnover-ranges`).

---

## Master data (`masters.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `listMasters()` | `GET /api/masters` | `MastersListPage`; `MasterDetailPage` | All `master_*` tables (counts) R |
| `listEntries(key)` | `GET /api/masters/{key}` | Many pages (dropdowns); `MasterDetailPage` (list + search) | See master table below R |
| `createEntry(key)` | `POST /api/masters/{key}` | `MasterDetailPage` — Save (new) | Matching `master_*` W; `audit_logs` W |
| `updateEntry(key, id)` | `PATCH /api/masters/{key}/{id}` | `MasterDetailPage` — Save (edit) | Matching `master_*` W |
| `deleteEntry(key, id)` | `DELETE /api/masters/{key}/{id}` | `MasterDetailPage` — Delete | Matching `master_*` D |
| `exportMaster(key)` | `GET /api/masters/{key}/export` | `MasterDetailPage` — Export | Matching `master_*` R |
| `importMaster(key)` | `POST /api/masters/{key}/import` | `MasterDetailPage` — Import CSV | Matching `master_*` W |

**`{key}` → table**

| `{key}` | Table |
| --- | --- |
| `districts` | `master_districts` |
| `taluks` | `master_taluks` |
| `pincodes` | `master_pincodes` |
| `hsn-codes` | `master_hsn_codes` |
| `company-types` | `master_company_types` |
| `legal-structures` | `master_legal_structures` |
| `turnover-ranges` | `master_turnover_ranges` |
| `sectors` | `master_sectors` |
| `production-capacities` | `master_production_capacities` |
| `certifications` | `master_certifications` |

**Pages that only load masters for dropdowns:** `GeographicDashboardPage`, `CompaniesListPage`, `CompanyAddPage`, `CompanyProfilePage`, `OnboardingDrivesPage`, `ReportRunPage` (per report filter spec).

---

## Users (`users.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `listUsers()` | `GET /api/users` | `UsersPage` (load, search, role filter, after create/deactivate) | `users` R |
| `createUser()` | `POST /api/users` | `UsersPage` — Create user | `users` W; `audit_logs` W |
| `updateUser()` | `PATCH /api/users/{id}` | `UsersPage` — role dropdown *(UI currently disabled)* | `users` W |
| `resetUserPassword()` | `POST /api/users/{id}/reset-password` | `UsersPage` — Reset password | `users` W |
| `deactivateUser()` | `POST /api/users/{id}/deactivate` | `UsersPage` — Deactivate | `users` W |

---

## Onboarding drives (`onboardingDrives.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `getConfig()` | `GET /api/onboarding-drives/config` | `OnboardingDrivesPage` on load | `outreach_contacts` R (counts) |
| `listTemplates()` | `GET /api/onboarding-drives/templates` | Page load | — (in-memory templates) |
| `listCampaigns()` | `GET /api/onboarding-drives/campaigns` | Page load; poll every 4s if a campaign is running | `onboarding_campaigns` R |
| `estimateAudience()` | `POST /api/onboarding-drives/campaigns/estimate` | Campaign wizard — audience step | `companies` / `outreach_contacts` R |
| `importContacts()` | `POST /api/onboarding-drives/contacts/import` | Wizard — Excel file pick | `outreach_contacts` W |
| `launchCampaign()` | `POST /api/onboarding-drives/campaigns` | Wizard — Launch campaign | `onboarding_campaigns` W; `onboarding_campaign_messages` W; `enrollment_invites` W |
| `simulateCampaign()` | `POST /api/onboarding-drives/campaigns/{id}/simulate` | Simulate delivery / replies | `onboarding_campaign_messages` W |
| `getCampaignFunnel()` | `GET /api/onboarding-drives/campaigns/{id}/funnel` | Enrollment funnel button | `onboarding_campaigns` R; `enrollment_invites` R; `companies` R |
| `remindCampaign()` | `POST /api/onboarding-drives/campaigns/{id}/remind` | Remind not onboarded / partial | `onboarding_campaign_messages` W |

---

## Reports (`reports.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `listReports()` | `GET /api/reports` | `ReportsListPage`; `ReportRunPage` (metadata) | — (registry) |
| `runReport(slug)` | `POST /api/reports/{slug}/run` | `ReportRunPage` — Run report | `companies` / `master_*` R (per report) |
| `exportReport(slug)` | `POST /api/reports/{slug}/export` | `ReportRunPage` — Export CSV/Excel | Same as run; `report_runs` W; `audit_logs` W |
| `listReportHistory()` | `GET /api/reports/history` | `ReportHistoryPage` | `report_runs` R |
| `downloadHistory(runId)` | `GET /api/reports/history/{run_id}/download` | `ReportHistoryPage` — Download again | `report_runs` R |

---

## Audit log (`audit.ts`)

| Frontend API | Backend | Called from | Database |
| --- | --- | --- | --- |
| `listAudit()` | `GET /api/audit-log` | `AuditLogPage` (load, filters, pagination) | `audit_logs` R |
| `exportAuditExcel()` | `GET /api/audit-log/export` | `AuditLogPage` — Export Excel | `audit_logs` R |

Most other APIs also **write** `audit_logs` when data changes; this page only reads them.

---

## Page → APIs at a glance

| Route | Main API calls |
| --- | --- |
| `/login` | `login()` |
| `/forgot-password` | `forgotPasswordRequest()`, `forgotPasswordReset()` |
| *(app shell)* | `getMe()`; `listPendingEditRequests()` + `reviewEditRequest()` in layout |
| `/dashboard` | `listEntries()` (masters); `getDistrictsOverview()` / taluks / pincodes; `listCompanies()` at pincode level |
| `/companies` | `listEntries()`; `listCompanies()`; `exportCompanies()`; `bulkUpdateTags()` |
| `/companies/new` | `listEntries()`; `createCompany()` |
| `/companies/:id` | `getCompany()`, `getLockedFields()`, `listEntries()`; sub-items + `uploadImage()` + `updateCompany()` / `deleteCompany()` |
| `/masters` | `listMasters()` |
| `/masters/:key` | `listMasters()`, `listEntries()`, CRUD, `exportMaster()`, `importMaster()` |
| `/users` | `listUsers()`, `createUser()`, `resetUserPassword()`, `deactivateUser()` |
| `/onboarding-drives` | All `onboardingDrives.ts` functions + `listEntries()` |
| `/reports` | `listReports()` |
| `/reports/:slug` | `listReports()`, `listEntries()`, `runReport()`, `exportReport()` |
| `/reports/history` | `listReportHistory()`, `downloadHistory()` |
| `/audit-log` | `listAudit()`, `exportAuditExcel()` |

---

## Not wired in admin UI

| Frontend API | Backend | Notes |
| --- | --- | --- |
| `getMyCompany()` | `GET /api/companies/mine` | MSME portal removed |
| `createEditRequest()` | `POST /api/companies/{id}/edit-requests` | MSME submit flow only |
| — | `GET /api/onboarding-drives/contacts` | Backend only; UI uses import + config count |
| — | `GET /health` | Ops / manual check |

---

## Enrollment app (separate)

`cat/enroll/` is not the admin frontend. It calls `/api/enroll/...` and writes `enrollment_invites`, `companies`, and company sub-item tables. See `app/api/enrollment.py` and `enroll_company.py`.

---

## Find callers in code

```powershell
rg "from ['\"].*api/" e:\catlab\cat\frontend\src
rg "/api/" e:\catlab\cat\frontend\src\api
```

Update this file when you add a new `src/api/*.ts` function or page that calls the backend.
