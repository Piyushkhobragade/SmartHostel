#!/bin/bash
# ─── SmartHostel AWS EC2 Setup & Fix Script ──────────────────────────────────
# Run this on your AWS EC2 instance to deploy/fix SmartHostel.
# It automatically fixes the .env file, DATABASE_URL, and starts the app.
#
# Usage:
#   git pull origin main && sudo bash setup-aws.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  SmartHostel — AWS EC2 Setup & Fix Script"
echo "═══════════════════════════════════════════════════════════"

# ─── Step 1: Add 2GB Swap (if not already present) ──────────────────────────
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

# ─── Step 2: Clean up old Ollama data ───────────────────────────────────────
echo ""
echo "▶ Cleaning up old Ollama containers and volumes..."
docker rm -f smarthostel-ollama 2>/dev/null && echo "  Removed ollama container" || echo "  No ollama container found"
docker rm -f ollama 2>/dev/null || true
docker volume rm smarthostel_ollama_data 2>/dev/null && echo "  Removed ollama data volume" || echo "  No ollama volume found"
docker volume rm smarthostel-main_ollama_data 2>/dev/null || true

# ─── Step 3: Prune unused Docker images ─────────────────────────────────────
echo ""
echo "▶ Pruning unused Docker images to free disk space..."
docker image prune -a -f 2>/dev/null | tail -1

# ─── Step 4: Fix .env file ───────────────────────────────────────────────────
echo ""
echo "▶ Fixing .env file..."

# Extract existing GEMINI_API_KEY (strip any quotes)
EXISTING_KEY=""
if [ -f .env ]; then
    EXISTING_KEY=$(grep -m1 'GEMINI_API_KEY' .env 2>/dev/null | sed 's/GEMINI_API_KEY=//' | tr -d '"' | tr -d "'" | xargs || true)
fi

# Use existing key if valid, otherwise use default placeholder
if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "your-api-key-here" ]; then
    GEMINI_KEY="$EXISTING_KEY"
    echo "  ✅ Found existing GEMINI_API_KEY"
else
    GEMINI_KEY="your-api-key-here"
    echo "  ⚠️  No GEMINI_API_KEY found — set it in .env after this script!"
fi

# Always write a clean, correct .env (no quotes, correct DATABASE_URL)
cat > .env << EOF
# ── AI ──────────────────────────────────────────────────────────────────────
GEMINI_API_KEY=${GEMINI_KEY}
GEMINI_MODEL=gemini-2.5-flash

# ── Database ─────────────────────────────────────────────────────────────────
POSTGRES_USER=smarthostel
POSTGRES_PASSWORD=smarthostel_secret
POSTGRES_DB=smarthosteldb
DATABASE_URL=postgresql://smarthostel:smarthostel_secret@postgres:5432/smarthosteldb

# ── App ──────────────────────────────────────────────────────────────────────
JWT_SECRET=smarthostel-production-jwt-secret-key-2024
NODE_ENV=production
PORT=3000
EOF

echo "  ✅ .env file written cleanly (no quotes, correct DATABASE_URL)"
echo ""
echo "  Current .env:"
cat .env
echo ""

# ─── Step 5: Pull latest code ────────────────────────────────────────────────
echo "▶ Pulling latest code from GitHub..."
git pull origin main

# ─── Step 6: Stop any running containers ────────────────────────────────────
echo ""
echo "▶ Stopping existing containers..."
docker compose down 2>/dev/null || true

# ─── Step 7: Build and start ─────────────────────────────────────────────────
echo ""
echo "▶ Starting SmartHostel (build is cached, will be fast)..."
docker compose up --build -d

# ─── Step 8: Wait and verify ─────────────────────────────────────────────────
echo ""
echo "▶ Waiting 30 seconds for backend to initialize..."
sleep 30

echo ""
echo "▶ Container status:"
docker compose ps

echo ""
echo "▶ Backend logs (last 20 lines):"
docker compose logs backend --tail=20

echo ""
echo "═══════════════════════════════════════════════════════════"
if docker compose ps | grep -q "smarthostel-backend.*Up"; then
    echo "  ✅ SmartHostel is RUNNING!"
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR-SERVER-IP')
    echo ""
    echo "  Access your app at: http://${PUBLIC_IP}"
else
    echo "  ⚠️  Backend may still be starting. Check with:"
    echo "     docker compose logs backend --tail=30"
fi
echo ""
echo "  Useful commands:"
echo "    docker compose ps              → Check all container status"
echo "    docker compose logs backend    → See backend logs"
echo "    docker compose logs -f backend → Follow live logs"
echo "═══════════════════════════════════════════════════════════"
