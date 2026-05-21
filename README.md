# Image Processor

Stateless image processing app with Next.js frontend and FastAPI backend, deployed on Render.

## Architecture

- **Frontend**: Next.js (App Router) — upload UI, trial selection, final generation
- **Backend**: FastAPI — image validation, trial generation, final PNG export
- **Storage**: Stateless (Option A) — no temp storage, file re-uploaded for `/final`

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/trials` | POST | Upload image → 3 base64 trial previews |
| `/final` | POST | Upload image + style + W×H → final PNG bytes |
| `/health` | GET | Health check |

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend proxies `/api/*` to the backend during dev.

## Deploy on Render

1. Push this repo to GitHub
2. In Render Dashboard → **Blueprints** → **New Blueprint Instance**
3. Connect your repo — Render reads `render.yaml` and provisions both services
4. Update `NEXT_PUBLIC_API_URL` in `render.yaml` to match your backend's actual Render URL

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (e.g. `https://api.example.com`) |

## File Structure

```
.
├── backend/
│   ├── main.py           # FastAPI routes
│   ├── processing.py     # Pillow image logic
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx      # Main UI
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Styles
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
└── render.yaml           # Render Blueprint
```
