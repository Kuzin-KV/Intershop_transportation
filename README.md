# cross-platform-logistics-system

Initial repository setup for cross-platform-logistics-system

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

## Linux deployment

### Prerequisites
- Node.js 20+
- Python 3.10+
- PostgreSQL 14+
- Nginx

### Local run on Linux
1. Make scripts executable:
   - `chmod +x scripts/setup-local.sh scripts/start-local.sh`
2. Install frontend deps:
   - `npm install`
3. Start all local services:
   - `./scripts/start-local.sh`

### Build for production
- `npm install`
- `npm run build`
- `python3 -m pip install -r backend/requirements-local.txt`
- `./scripts/setup-local.sh`

### systemd services
Copy unit files from `deploy/systemd` and adjust paths/users if needed:
- `intershop-backend.service`
- `intershop-frontend.service`

Example:
- `sudo cp deploy/systemd/intershop-*.service /etc/systemd/system/`
- `sudo systemctl daemon-reload`
- `sudo systemctl enable --now intershop-backend intershop-frontend`
- `sudo systemctl status intershop-backend intershop-frontend`

### Nginx reverse proxy
Use `deploy/nginx/intershop.local.conf`:
- `sudo cp deploy/nginx/intershop.local.conf /etc/nginx/sites-available/intershop.local.conf`
- `sudo ln -s /etc/nginx/sites-available/intershop.local.conf /etc/nginx/sites-enabled/intershop.local.conf`
- `sudo nginx -t && sudo systemctl reload nginx`

### One-command update on server
1. Make script executable once:
   - `chmod +x scripts/update.sh`
2. Run update:
   - `./scripts/update.sh`

What it does:
- pulls latest code from `origin/main`,
- installs npm + Python dependencies,
- applies DB setup/migrations,
- builds frontend,
- restarts `intershop-backend` and `intershop-frontend`,
- reloads Nginx.