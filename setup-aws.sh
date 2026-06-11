#!/bin/bash
# ─── SmartHostel AWS EC2 Setup Script ─────────────────────────────────────────
# Run this ONCE on a fresh t2.micro (1GB RAM) instance to:
#   1. Add 2GB swap space (prevents OOM during Docker builds)
#   2. Clean up old Ollama data
#   3. Deploy SmartHostel using docker compose
#
# Usage:
#   chmod +x setup-aws.sh && sudo ./setup-aws.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  SmartHostel — AWS EC2 Free Tier Setup"
echo "═══════════════════════════════════════════════════════════"

# ─── Step 1: Add 2GB Swap (if not already present) ─────────────────────────
if [ ! -f /swapfile ]; then
    echo ""
    echo "▶ Creating 2GB swap file (prevents out-of-memory during builds)..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap enabled: 2GB"
else
    echo "✅ Swap already exists"
    swapon /swapfile 2>/dev/null || true
fi

echo ""
free -h | head -3

# ─── Step 2: Clean up old Ollama data ──────────────────────────────────────
echo ""
echo "▶ Cleaning up old Ollama containers and volumes..."
docker rm -f smarthostel-ollama 2>/dev/null && echo "  Removed ollama container" || echo "  No ollama container found"
docker rm -f ollama 2>/dev/null || true
docker volume rm smarthostel_ollama_data 2>/dev/null && echo "  Removed ollama data volume" || echo "  No ollama volume found"
docker volume rm smarthostel-main_ollama_data 2>/dev/null || true

# ─── Step 3: Prune unused Docker images ────────────────────────────────────
echo ""
echo "▶ Pruning unused Docker images..."
docker image prune -a -f 2>/dev/null | tail -1

# ─── Step 4: Check .env file ──────────────────────────────────────────────
echo ""
if [ ! -f .env ]; then
    echo "⚠️  No .env file found! Creating one..."
    cat > .env << 'EOF'
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-flash
POSTGRES_USER=smarthostel
POSTGRES_PASSWORD=smarthostel_secret
POSTGRES_DB=smarthosteldb
DATABASE_URL=postgresql://smarthostel:smarthostel_secret@postgres:5432/smarthosteldb
JWT_SECRET=smarthostel-default-production-jwt-secret-key-12345
NODE_ENV=production
PORT=3000
EOF
    echo "⚠️  IMPORTANT: Edit .env and add your real GEMINI_API_KEY!"
else
    echo "✅ .env file exists"
fi

# ─── Step 5: Pull latest code ──────────────────────────────────────────────
echo ""
echo "▶ Pulling latest code from GitHub..."
git pull origin main

# ─── Step 6: Build and start ───────────────────────────────────────────────
echo ""
echo "▶ Building and starting SmartHostel (this may take 5-10 minutes on first run)..."
docker compose down 2>/dev/null || true
docker compose up --build -d

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ SmartHostel deployment complete!"
echo ""
echo "  Access your app at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR-IP')"
echo ""
echo "  Check status:  docker compose ps"
echo "  View logs:     docker compose logs -f backend"
echo "═══════════════════════════════════════════════════════════"
