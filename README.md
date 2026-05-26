# Frontend

React + Vite app for the CAT project. Run the API locally alongside this app for full functionality.

## Prerequisites

- **Node.js** (npm)
- **Python 3** (used to create `venv` in `cat/backend`; see backend steps below)

## Start the frontend

From the repository root:

```powershell
cd frontend
npm install   # first time only
npm run dev
```

Vite prints the local URL (typically `http://localhost:5173`). Open that in your browser.

## Start the backend

In a **separate** terminal, from the repository root.

**First time only** — create the virtual environment and install dependencies:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
```

**Every time** — activate the venv and start the server:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`.

## MSME enrollment app (public signup)

Separate Vite app for MSME self-registration via WhatsApp enrollment links:

```powershell
cd cat/enroll
npm install   # first time only
npm run dev   # http://localhost:5174
```

Set `ENROLL_PUBLIC_URL=http://localhost:5174` in `cat/backend/.env` so campaign messages embed the correct links.

## Quick reference

| Service       | Directory      | Command                                                                           |
| ------------- | -------------- | --------------------------------------------------------------------------------- |
| Admin UI      | `cat/frontend` | `npm run dev` (port 5173)                                                         |
| Enrollment UI | `cat/enroll`   | `npm run dev` (port 5174)                                                         |
| Backend       | `cat/backend`  | Activate venv, then `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` |

Start the backend before or while using the frontends. All apps share one database via the API — no separate sync.
