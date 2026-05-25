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
```

**Every time** — activate the venv and start the server:

```powershell
cd backend
\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`.

## Quick reference

| Service  | Directory      | Command                                                                           |
| -------- | -------------- | --------------------------------------------------------------------------------- |
| Frontend | `cat/frontend` | `npm run dev`                                                                     |
| Backend  | `cat/backend`  | Activate venv, then `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` |

Start the backend before or while using the frontend so auth and API calls work against `127.0.0.1:8000`.
