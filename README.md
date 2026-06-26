# 🚛 Truck Management System

A full-stack fleet management web app for tracking loads, trucks, drivers, routes, and live vehicle locations via Samsara.

**Stack:** FastAPI · React · SQLite · Google Maps API · Samsara API · Docker · Nginx

---

## Features

- Create and manage loads with full details (load #, ship from/to, pickup/delivery times, status, rate, commodity, weight)
- Auto-calculate mileage via Google Maps Distance Matrix API
- Interactive route map embedded in each load detail page
- Live truck location via Samsara Fleet API (plug in your API key to enable)
- Truck & driver registry
- Dashboard with real-time status counts
- Search and filter loads by status, truck, keyword
- Status workflow: Pending → At Shipper → Rolling → Stopped / Issue → At Receiver → Delivered
- Docker Compose for easy local dev and production deploy
- Bash scripts for backup, deploy, health checks, and cron setup

---

## Local Development

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/truck-management.git
cd truck-management
cp .env.example .env
# Edit .env — add your Google Maps API key at minimum
```

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- API Docs (auto-generated): http://localhost:8000/docs

### 3. Run without Docker (development)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Yes* | For mileage calculation and geocoding |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes* | For embedded route map in frontend |
| `SAMSARA_API_KEY` | No | Enables live vehicle tracking |
| `DATABASE_URL` | No | Defaults to SQLite. Use PostgreSQL URL for production |
| `AWS_S3_BUCKET` | No | For S3 backup uploads |

*Without Google Maps key the app still works — mileage and maps will show placeholder messages.

---

## Deploying to a Free Server (Oracle Cloud Always Free)

Oracle Cloud offers **2 ARM VMs free forever** — perfect for this project.

### Step 1: Create Oracle Cloud account
1. Go to https://cloud.oracle.com and sign up (credit card required for verification, not charged)
2. Create an **Always Free** ARM instance (Ubuntu 22.04)
3. Note your server's public IP

### Step 2: Configure SSH access
```bash
# Oracle gives you a .key file — use it to connect:
ssh -i ~/Downloads/your-key.key ubuntu@YOUR_SERVER_IP
```

### Step 3: Install Docker on the server
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt install -y git sqlite3
```

### Step 4: Clone and run
```bash
sudo mkdir -p /opt/truck-management
sudo chown $USER:$USER /opt/truck-management
git clone https://github.com/YOUR_USERNAME/truck-management.git /opt/truck-management
cd /opt/truck-management
cp .env.example .env
nano .env   # Fill in your API keys
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Step 5: Set up crons
```bash
bash /opt/truck-management/scripts/setup_crons.sh
```

### Step 6: Open firewall ports (Oracle Cloud console)
In Oracle Cloud → Networking → Virtual Cloud Networks → Security Lists, add ingress rules for:
- Port 80 (HTTP)
- Port 443 (HTTPS)

Then on the server:
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Visit `http://YOUR_SERVER_IP` — your app is live!

---

## GitHub Setup

```bash
cd truck-management
git init
git add .
git commit -m "Initial commit: Truck Management System"
git remote add origin https://github.com/YOUR_USERNAME/truck-management.git
git push -u origin main
```

### GitHub Secrets (for CI/CD pipeline)

Go to your repo → Settings → Secrets and Variables → Actions, and add:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `SERVER_HOST` | Your server IP |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Contents of your SSH private key |
| `VITE_API_URL` | `http://YOUR_SERVER_IP:8000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps API key |

---

## Samsara Integration

To enable live tracking:

1. Get your API key from Samsara Dashboard → Developer Tools → API Tokens
2. Add to `.env`: `SAMSARA_API_KEY=your-key-here`
3. When adding a load or truck, enter the **Samsara Vehicle ID** in the form
4. On the Load Detail page, click "Refresh Location" to see live position
5. Visit the Tracking page to see all fleet vehicles

---

## Bash Scripts

| Script | Purpose |
|---|---|
| `scripts/backup.sh` | Backup DB + .env, compress, rotate 7 days, optional S3 upload |
| `scripts/deploy.sh` | Safe deploy: backup → git pull → rebuild → restart → health check |
| `scripts/health_check.sh` | Ping endpoints, alert via email/Slack, auto-restart if down |
| `scripts/setup_crons.sh` | Install all cron jobs (backup every night, health check every 5 min) |

---

## API Reference

Auto-generated docs available at `/docs` (Swagger UI) when the backend is running.

Key endpoints:

```
GET    /api/loads/stats          Dashboard counts by status
GET    /api/loads/               List all loads (search, filter, paginate)
POST   /api/loads/               Create load (auto-calculates mileage)
GET    /api/loads/{id}           Get load detail
PATCH  /api/loads/{id}           Update load (recalculates mileage if route changed)
DELETE /api/loads/{id}           Delete load

GET    /api/trucks/              List trucks
POST   /api/trucks/              Add truck

POST   /api/maps/route           Calculate mileage + geocode two addresses

GET    /api/samsara/status       Check Samsara connection
GET    /api/samsara/vehicles     List Samsara fleet vehicles
GET    /api/samsara/vehicles/{id}/location   Get live location
```
