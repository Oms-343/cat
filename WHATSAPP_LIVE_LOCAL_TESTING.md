# WhatsApp Onboarding Drives — Live local testing (Path B)

This guide walks through **end-to-end testing on localhost** with **real Meta WhatsApp Cloud API** credentials: sending template messages, receiving delivery updates, and counting replies via webhooks.

You do **not** need to deploy the frontend or backend. You **do** need:

- A [Meta Developer](https://developers.facebook.com/) account  
- A tunnel tool (**ngrok** recommended) so Meta can reach your webhook over HTTPS  
- Template names in Meta that **match** this codebase (see [Templates](#4-create-and-approve-message-templates))

For testing **without** Meta credentials, use dry-run mode (`WHATSAPP_DRY_RUN=true`) — see the main app README.

---

## Architecture (what runs where)

```
Browser (localhost:5173)
    → Vite proxy → Backend (localhost:8000)
                        → Meta Graph API (send messages)
Meta servers ──HTTPS──→ ngrok ──→ /api/whatsapp/webhook (delivery + replies)
```

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| Webhook (public) | `https://<your-ngrok-host>/api/whatsapp/webhook` |

---

## 1. Prerequisites

### Software

```powershell
# Backend (from repo root)
cd cat\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed

# Frontend (separate terminal)
cd cat\frontend
npm install
```

### Accounts & tools

1. **Meta Developer** — https://developers.facebook.com/  
2. **ngrok** (or Cloudflare Tunnel) — https://ngrok.com/download  
3. **WhatsApp** on your phone (to verify as a test recipient)

### Admin login (after seed)

| Field | Value |
|-------|--------|
| Email | `admin@tidco.com` |
| Password | `admin123` |

---

## 2. Create a Meta app and get credentials

### 2.1 Create the app

1. Go to **My Apps** → **Create App**.  
2. Choose **Business** (or **Other** if Business is unavailable).  
3. Name it e.g. `MSME Platform Dev` → Create.

### 2.2 Add WhatsApp

1. In the app dashboard → **Add products** → **WhatsApp** → **Set up**.  
2. Open **WhatsApp** → **API Setup** in the left sidebar.

### 2.3 Copy these values

| `.env` variable | Where to find it in Meta |
|-----------------|---------------------------|
| `WHATSAPP_ACCESS_TOKEN` | **API Setup** → **Temporary access token** → Generate / copy |
| `WHATSAPP_PHONE_NUMBER_ID` | **API Setup** → under the test **From** phone number (numeric ID, not the phone number itself) |
| `WHATSAPP_APP_SECRET` | **App settings** → **Basic** → **App secret** → Show |

**Notes:**

- The **temporary token** expires (often within 24 hours). Regenerate it on **API Setup** when sends start failing with `401`.  
- For long-term dev, Meta documents **System users** and permanent tokens — optional for first tests.  
- There is no separate “development API key”; the temporary token + test phone number **is** the dev setup.

### 2.4 Register your phone as a test recipient

On **API Setup**:

1. Find **Send test messages** / **To** section.  
2. **Add phone number** → enter your mobile with country code (e.g. India `91XXXXXXXXXX`).  
3. Confirm the code in WhatsApp on your phone.

Only numbers added here (plus production rules after go-live) can receive messages from the **test** sender in dev mode.

---

## 3. Expose localhost with ngrok

Meta webhooks require a **public HTTPS** URL. `http://127.0.0.1:8000` is not reachable from Meta.

### 3.1 Start the backend first

```powershell
cd cat\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verify: open http://127.0.0.1:8000/health — should return `{"status":"ok",...}`.

### 3.2 Start ngrok (new terminal)

```powershell
ngrok http 8000
```

Copy the **Forwarding** HTTPS URL, e.g. `https://a1b2c3d4.ngrok-free.app` (no trailing slash).

### 3.3 Webhook URL to register in Meta

```
https://<your-ngrok-host>/api/whatsapp/webhook
```

Example: `https://a1b2c3d4.ngrok-free.app/api/whatsapp/webhook`

Keep ngrok running for the whole test session. If the URL changes (free tier restarts), update Meta and `APP_PUBLIC_URL`.

---

## 4. Create and approve message templates

The platform sends **template** messages only. Names and variable **order** must match the code.

### 4.1 Template names (must match exactly)

Defined in `cat/backend/app/data/whatsapp_templates.py`:

| Template name (Meta + code) | Body variables (in order) |
|----------------------------|---------------------------|
| `profile_completion_invite_v2` | `{{1}}` name, `{{2}}` link |
| `onboarding_reminder_v1` | `{{1}}` link |
| `document_request_v3` | `{{1}}` company, `{{2}}` doc_list, `{{3}}` link |

Variable mapping is in `cat/backend/app/data/whatsapp_template_params.py`.

### 4.2 Create templates in Meta

1. **WhatsApp Manager** (linked from your app) → **Message templates** → **Create template**.  
2. Category: **Utility** or **Marketing** (follow Meta rules for onboarding invites).  
3. Use the **exact** template name from the table (e.g. `onboarding_reminder_v1`).  
4. Add languages **English** (`en`) and/or **Tamil** (`ta`) as needed.  
5. Body text should use the same number of placeholders as the table (Meta shows `{{1}}`, `{{2}}`, …).  
6. Submit for approval. **UTILITY** templates often approve in minutes in test apps; marketing may take longer.

### 4.3 Quick smoke test (optional)

Meta’s default **`hello_world`** template is not wired in this app. For a first API check only, you can use **API Setup → Send test message** in the Meta console to your verified phone — that confirms token + number ID without using Onboarding Drives.

For **Onboarding Drives**, you must use an **approved** template from the table above.

---

## 5. Configure `cat/backend/.env`

Edit `cat/backend/.env` (copy from `.env.example` if missing):

```env
# --- existing ---
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174
ENROLL_PUBLIC_URL=http://localhost:5174

# --- WhatsApp LIVE local ---
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxx...paste_temporary_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_API_VERSION=v21.0
WHATSAPP_DRY_RUN=false

WHATSAPP_DEFAULT_LANGUAGE=en
PLATFORM_REGISTRATION_URL=http://localhost:5173

# ngrok HTTPS base URL (no trailing slash)
APP_PUBLIC_URL=https://a1b2c3d4.ngrok-free.app

WHATSAPP_WEBHOOK_VERIFY_TOKEN=msme-webhook-verify
WHATSAPP_APP_SECRET=paste_app_secret_from_meta_basic_settings

WHATSAPP_RESPONSE_WINDOW_DAYS=30
WHATSAPP_SEND_DELAY_SECONDS=0.08
```

| Setting | Purpose |
|---------|---------|
| `WHATSAPP_DRY_RUN=false` | Actually call Meta (required for Path B) |
| `APP_PUBLIC_URL` | Shown in UI; must match ngrok host for webhook docs |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Must match what you type in Meta webhook setup |
| `WHATSAPP_APP_SECRET` | Validates `X-Hub-Signature-256` on webhook POSTs |
| `ENROLL_PUBLIC_URL` | Base URL for per-recipient enrollment links (`/enroll/{token}`) in campaign WhatsApp messages |
| `PLATFORM_REGISTRATION_URL` | Fallback link when no enrollment invite exists (legacy / non-campaign sends) |

**Restart uvicorn** after changing `.env`.

---

## 6. Register the webhook in Meta

With **backend + ngrok** running:

1. Meta app → **WhatsApp** → **Configuration** (or **Webhooks**).  
2. Click **Edit** on the webhook fields:

   | Field | Value |
   |-------|--------|
   | Callback URL | `https://<ngrok-host>/api/whatsapp/webhook` |
   | Verify token | `msme-webhook-verify` (same as `.env`) |

3. Click **Verify and save**. Meta sends a `GET` request; the backend must respond with the challenge.  
   - If verification fails: check uvicorn logs, ngrok URL, and that the path is exactly `/api/whatsapp/webhook`.  
4. Under **Webhook fields**, subscribe to **messages** (includes status and inbound message events).

### 6.1 Verify locally

```powershell
curl "http://127.0.0.1:8000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=msme-webhook-verify&hub.challenge=test123"
```

Expected response body: `test123`

---

## 7. Start the frontends

**Admin (TIDCO):**

```powershell
cd cat\frontend
npm run dev
```

Open http://localhost:5173 → log in as admin → **Onboarding Drives**.

**Enrollment (MSME public signup):**

```powershell
cd cat\enroll
npm install
npm run dev
```

Runs at http://localhost:5174. WhatsApp campaign links open `/enroll/{token}` on this app. Set `ENROLL_PUBLIC_URL` to your ngrok URL for the enroll app when testing on a phone (e.g. `https://xxxx.ngrok-free.app` with enroll app tunneled on port 5174).

You should see:

- **Live mode** banner (not dry-run)  
- **Webhook URL** matching `APP_PUBLIC_URL` + `/api/whatsapp/webhook`  
- Signature verification note if `WHATSAPP_APP_SECRET` is set  

---

## 8. Prepare recipients who will receive messages

Campaigns send to **phone numbers in your database**, not automatically to “every test number in Meta.”

### Option A — Use your phone on a company record

1. **Companies** → pick one company (or create one).  
2. Set **Contact phone** to your verified test number (E.164, e.g. `+919876543210`).  
3. Note **district** and **sector** codes for filtering.

### Option B — Outreach CSV (unregistered)

1. On **Onboarding Drives** → **Outreach contacts** → upload CSV:

   ```csv
   name,phone,district_code,sector_code
   My Test MSME,+919876543210,CBE,TXT_APP
   ```

2. Use audience **Not yet registered on platform**.

### Option C — Small seeded audience

After `python -m app.seed`, filter **Incomplete profile** + district **Coimbatore (`CBE`)** — only works if seeded companies have phones you control. Prefer Option A for a guaranteed test.

---

## 9. Run an end-to-end campaign

1. **Onboarding Drives** → **+ New campaign**.  
2. **Step 1** — Select a template that is **approved** in Meta (e.g. `onboarding_reminder_v1`). Choose **English** or **Tamil** (`en` / `ta`).  
3. **Step 2** — Preview message text.  
4. **Step 3** — Narrow audience so only **your** test number is included (district/sector/audience type). Confirm **Estimated reach: 1** (or very small).  
5. **Step 4** — Review → **Launch campaign**.  
6. Watch the table:
   - Status **running** → **Sending…** → **sent** count increases (background worker).  
   - **Delivered %** updates when Meta sends webhook status events (requires ngrok + webhook).  
   - **Responded** increases if you **reply** to the WhatsApp message on your phone.  
7. Page auto-refreshes every 4 seconds while status is `running`.

### What “complete” looks like

| Step | Success signal |
|------|----------------|
| Send | WhatsApp message arrives on your phone |
| Delivered | Delivered % &gt; 0 in UI (webhook) |
| Reply | Send any reply in WhatsApp → Responded count increases |
| Complete | Campaign status → **completed** when all messages are terminal |

---

## 10. Checklist before you start

- [ ] `python -m app.seed` run  
- [ ] Backend on port 8000, `/health` OK  
- [ ] ngrok running, HTTPS URL copied  
- [ ] `.env`: token, phone number ID, app secret, `WHATSAPP_DRY_RUN=false`, `APP_PUBLIC_URL` = ngrok base  
- [ ] Webhook verified in Meta, **messages** subscribed  
- [ ] At least one template **approved** with exact name from code  
- [ ] Your phone verified under Meta **API Setup → test recipients**  
- [ ] Test phone on a company or outreach row in audience filters  
- [ ] Frontend on :5173, logged in as admin  

---

## 11. Troubleshooting

### Webhook verification fails

- Backend running before clicking Verify in Meta  
- Callback URL is `https` and includes `/api/whatsapp/webhook`  
- Verify token matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN` exactly  
- ngrok free tier: open the ngrok URL in a browser once if interstitial blocks Meta  

### `401` / OAuth errors when sending

- Temporary token expired → regenerate on **API Setup**  
- Wrong token copied (spaces/truncation)  

### `400` template error from Meta

- Template name mismatch (case-sensitive)  
- Template not **approved** yet  
- Wrong language code (`en` vs `ta`) — template must exist for that language  
- Wrong number of body parameters — fix template in Meta or `whatsapp_template_params.py`  

### Message not received on phone

- Phone not added as Meta **test recipient**  
- Phone not in campaign audience / wrong district filter  
- Company has no valid `contact_phone`  
- Sending to a number that blocked the test business number  

### Delivered stays 0% (but message received)

- Webhook not subscribed to **messages**  
- ngrok stopped or URL changed — update Meta + `.env`  
- `WHATSAPP_APP_SECRET` wrong → signature check fails (check uvicorn logs)  

### UI still shows “Dry-run mode”

- `WHATSAPP_DRY_RUN=true` or token / phone number ID empty  
- Restart uvicorn after `.env` change  

### ngrok URL changed

1. Update `APP_PUBLIC_URL` in `.env`  
2. Update webhook callback URL in Meta  
3. Restart backend  

---

## 12. API reference (for debugging)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | None |
| GET | `/api/onboarding-drives/config` | Admin JWT |
| POST | `/api/onboarding-drives/campaigns/estimate` | Admin JWT |
| POST | `/api/onboarding-drives/campaigns` | Admin JWT |
| GET | `/api/whatsapp/webhook?hub.mode=subscribe&...` | Meta verify |
| POST | `/api/whatsapp/webhook` | Meta (+ signature if secret set) |

Admin JWT: `POST /api/auth/login` with `admin@tidco.com` / `admin123`, use `access_token` as `Authorization: Bearer ...`.

---

## 13. After local testing

Before production (TIDCO):

1. Business verification and a **production** WhatsApp number  
2. Permanent **system user** token (not temporary)  
3. Deploy backend with stable HTTPS `APP_PUBLIC_URL` (no ngrok)  
4. All templates approved for production use  
5. Opt-in / policy compliance for bulk outreach  
6. Set `WHATSAPP_DRY_RUN=false` only on production servers with secrets in a secure store  

---

## Related files in this repo

| File | Purpose |
|------|---------|
| `cat/backend/.env.example` | All WhatsApp env vars |
| `cat/backend/app/data/whatsapp_templates.py` | Template IDs and previews |
| `cat/backend/app/data/whatsapp_template_params.py` | Body variable order |
| `cat/backend/app/api/whatsapp_webhook.py` | Webhook routes |
| `cat/frontend/src/pages/OnboardingDrivesPage.tsx` | Admin UI |
