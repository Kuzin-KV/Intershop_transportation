# cross-platform-logistics-system

Initial repository setup for pr-poehali-dev/cross-platform-logistics-system

## Local launch

Quick start (one command):
- `npm run start:local`

It will:
- prepare local PostgreSQL database (safe re-run),
- open one terminal for local API (`http://127.0.0.1:8000`),
- open one terminal for frontend (`http://127.0.0.1:5173`).

Manual start:
1. Start local DB and apply migrations:
   - `npm run db:setup`
2. Install local Python backend deps:
   - `C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312\python.exe -m pip install -r backend/requirements-local.txt`
3. Start local API bridge:
   - `C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312\python.exe backend/local_api.py`
4. Start frontend:
   - `npm run dev`

Frontend now uses local API routes (`/api/*`) and Vite proxies them to `http://127.0.0.1:8000`.

Default test user:
- `admin / 1234`