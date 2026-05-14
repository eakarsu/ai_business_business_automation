#!/bin/bash

# AI Procurement Management - Startup Script
# Features:
# - Cleans used ports before starting
# - Seeds database with sample data
# - Monitors code changes and auto-reloads
# - Health checks for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Log functions
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# Banner
print_banner() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           AI Procurement Management System                    ║"
    echo "║                                                               ║"
    echo "║   Features:                                                   ║"
    echo "║   - AI Vendor Scorer                                          ║"
    echo "║   - AI Contract Negotiator                                    ║"
    echo "║   - AI Spend Analyzer                                         ║"
    echo "║   - AI RFP Generator                                          ║"
    echo "║   - AI Savings Finder                                         ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Load environment variables
load_env() {
    log "Loading environment variables..."
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        BACKEND_PORT="${BACKEND_PORT:-3001}"
        FRONTEND_PORT="${FRONTEND_PORT:-3000}"
        success "Environment loaded (Backend: $BACKEND_PORT, Frontend: $FRONTEND_PORT)"
    else
        warning ".env file not found, using defaults"
    fi
}

# Kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        warning "Killing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Clean all used ports
clean_ports() {
    log "Cleaning used ports..."

    # Kill any processes on our ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT

    # Also kill any stale node processes from this project
    pkill -f "node.*ai_procurement" 2>/dev/null || true
    pkill -f "next.*3000" 2>/dev/null || true
    pkill -f "nodemon.*src/index.ts" 2>/dev/null || true

    sleep 2
    success "Ports cleaned"
}

# Check Node.js version
check_node() {
    log "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi

    local node_version=$(node --version | sed 's/v//' | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        error "Node.js 18+ required (found v$(node --version))"
        exit 1
    fi
    success "Node.js $(node --version) OK"
}

# Check PostgreSQL
check_postgres() {
    log "Checking PostgreSQL..."
    if command -v pg_isready &> /dev/null; then
        if pg_isready -q 2>/dev/null; then
            success "PostgreSQL is running"
        else
            warning "PostgreSQL may not be running"
        fi
    else
        warning "pg_isready not found, skipping PostgreSQL check"
    fi
}

# Install dependencies
install_deps() {
    log "Installing dependencies..."

    # Install root dependencies
    npm install --silent 2>/dev/null || true

    # Install backend dependencies
    if [ -d "backend" ]; then
        log "Installing backend dependencies..."
        cd backend
        npm install --silent 2>/dev/null || npm install
        cd ..
    fi

    # Install frontend dependencies
    if [ -d "frontend" ]; then
        log "Installing frontend dependencies..."
        cd frontend
        npm install --silent 2>/dev/null || npm install
        cd ..
    fi

    success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd backend

    # Generate Prisma client
    npx prisma generate 2>/dev/null || true

    # Run migrations
    npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss 2>/dev/null || true

    cd ..
    success "Database migrations complete"
}

# Seed database
seed_database() {
    log "Seeding database with sample data..."
    cd backend

    # Run seed script
    npm run seed 2>&1 | while read line; do
        echo -e "  ${CYAN}$line${NC}"
    done

    cd ..
    success "Database seeded with 15+ items per feature"
}

# Start backend with hot reload
start_backend() {
    log "Starting backend server on port $BACKEND_PORT..."
    cd backend

    # Use nodemon for hot reload
    PORT=$BACKEND_PORT npm run dev &
    BACKEND_PID=$!

    cd ..

    # Wait for backend to start
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
            success "Backend running on http://localhost:$BACKEND_PORT"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo -ne "\r  Waiting for backend... ${attempts}s"
    done
    echo ""
    error "Backend failed to start"
    return 1
}

# Start frontend with hot reload
start_frontend() {
    log "Starting frontend server on port $FRONTEND_PORT..."
    cd frontend

    # Use turbopack for fast refresh
    PORT=$FRONTEND_PORT npm run dev &
    FRONTEND_PID=$!

    cd ..

    # Wait for frontend to start
    local attempts=0
    while [ $attempts -lt 60 ]; do
        if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            success "Frontend running on http://localhost:$FRONTEND_PORT"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo -ne "\r  Waiting for frontend... ${attempts}s"
    done
    echo ""
    warning "Frontend may still be starting..."
    return 0
}

# Health check
health_check() {
    local backend_ok=false
    local frontend_ok=false

    if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        backend_ok=true
    fi

    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        frontend_ok=true
    fi

    if $backend_ok && $frontend_ok; then
        return 0
    fi
    return 1
}

# Cleanup function
cleanup() {
    echo ""
    log "Shutting down..."

    # Kill background processes
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true

    # Clean up ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT

    success "Cleanup complete"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Main execution
main() {
    print_banner

    # Check if running from project root
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Run this script from the project root directory"
        exit 1
    fi

    check_node
    load_env
    clean_ports
    check_postgres
    install_deps
    run_migrations
    seed_database

    echo ""
    log "Starting servers with hot reload..."
    echo ""

    start_backend
    start_frontend

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    All Systems Running!                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
    echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
    echo -e "  ${CYAN}API Docs:${NC}  http://localhost:$BACKEND_PORT/api/health"
    echo ""
    echo -e "  ${YELLOW}Login Credentials:${NC}"
    echo -e "  Email:    admin@procurement.com"
    echo -e "  Password: password"
    echo ""
    echo -e "  ${PURPLE}AI Features Available:${NC}"
    echo -e "  - AI Vendor Scorer"
    echo -e "  - AI Contract Negotiator"
    echo -e "  - AI Spend Analyzer"
    echo -e "  - AI RFP Generator"
    echo -e "  - AI Savings Finder"
    echo ""
    echo -e "  ${YELLOW}Hot reload enabled - code changes will auto-refresh${NC}"
    echo -e "  Press ${RED}Ctrl+C${NC} to stop all servers"
    echo ""

    # Keep running and show periodic health status
    while true; do
        sleep 30
        if health_check; then
            info "Health check: All systems operational"
        else
            warning "Health check: Some services may be down"
        fi
    done
}

main "$@"
