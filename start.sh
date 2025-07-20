#!/bin/bash

# AI Procurement Management - Startup Script
# This script starts backend and frontend servers with health checks
# All configuration is read from .env files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables (will be loaded from .env)
BACKEND_PORT=""
FRONTEND_PORT=""
DATABASE_URL=""
REDIS_URL=""
NODE_ENV=""
CORS_ORIGIN=""

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Load environment variables from .env file
load_env() {
    log "Loading environment configuration from .env file..."
    
    # Load main .env file
    if [ -f ".env" ]; then
        set -a  # automatically export all variables
        source .env
        set +a
        
        # Set our configuration variables
        BACKEND_PORT="${PORT:-3001}"
        DATABASE_URL="${DATABASE_URL}"
        REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
        NODE_ENV="${NODE_ENV:-development}"
        CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000}"
        
        # Extract frontend port from CORS_ORIGIN or use default
        FRONTEND_PORT=$(echo "$CORS_ORIGIN" | sed -n 's/.*:\([0-9]*\).*/\1/p')
        if [ -z "$FRONTEND_PORT" ]; then
            FRONTEND_PORT="3000"
        fi
        
        success "Environment configuration loaded successfully"
    else
        error ".env file not found"
        return 1
    fi
}

# Check if required commands exist
check_dependencies() {
    log "Checking system dependencies..."
    
    local deps=("node" "npm" "psql" "redis-cli")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    success "All system dependencies are installed"
}

# Check if .env files exist and validate required variables
check_env_files() {
    log "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        warning ".env file not found in project root"
        echo "Creating .env from .env.example..."
        cp .env.example .env
        warning "Please update .env with your actual configuration values"
    fi
    
    # Load environment variables
    load_env
    
    # Validate required environment variables
    local required_vars=("DATABASE_URL" "JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        echo "Please set these variables in backend/.env file"
        return 1
    fi
    
    # Display loaded configuration
    echo "Configuration loaded:"
    echo "  NODE_ENV: $NODE_ENV"
    echo "  BACKEND_PORT: $BACKEND_PORT"
    echo "  FRONTEND_PORT: $FRONTEND_PORT"
    echo "  DATABASE_URL: ${DATABASE_URL:0:20}... (truncated)"
    echo "  REDIS_URL: $REDIS_URL"
    echo "  CORS_ORIGIN: $CORS_ORIGIN"
    
    success "Environment files are ready and validated"
}

# Check database connection
check_database() {
    log "Checking database connection..."
    
    # DATABASE_URL should already be loaded from .env
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL not set in .env file"
        return 1
    fi
    
    # Parse DATABASE_URL (format: postgresql://username:password@host:port/database)
    local db_url="$DATABASE_URL"
    local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    local db_user=$(echo "$db_url" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    
    # Test database connection
    if ! pg_isready -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" &> /dev/null; then
        error "Cannot connect to PostgreSQL database"
        echo "Database details: $db_user@$db_host:$db_port/$db_name"
        echo "Please ensure PostgreSQL is running and the DATABASE_URL is correct"
        return 1
    fi
    
    success "Database connection is healthy ($db_user@$db_host:$db_port/$db_name)"
}

# Check Redis connection
check_redis() {
    log "Checking Redis connection..."
    
    # REDIS_URL should already be loaded from .env
    local redis_url="$REDIS_URL"
    
    # Extract Redis connection details
    local redis_host=$(echo "$redis_url" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    local redis_port=$(echo "$redis_url" | sed -n 's/.*:\([0-9]*\).*/\1/p')
    
    if [ -z "$redis_host" ]; then
        redis_host="localhost"
    fi
    if [ -z "$redis_port" ]; then
        redis_port="6379"
    fi
    
    # Test Redis connection
    if ! redis-cli -h "$redis_host" -p "$redis_port" ping &> /dev/null; then
        error "Cannot connect to Redis server"
        echo "Redis details: $redis_host:$redis_port"
        echo "Please ensure Redis is running and the REDIS_URL is correct"
        return 1
    fi
    
    success "Redis connection is healthy ($redis_host:$redis_port)"
}

# Check Node.js and npm versions
check_node_version() {
    log "Checking Node.js and npm versions..."
    
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    echo "Node.js version: $node_version"
    echo "npm version: $npm_version"
    
    # Check if Node.js version is >= 18
    local node_major=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
    if [ "$node_major" -lt 18 ]; then
        error "Node.js version 18 or higher is required"
        exit 1
    fi
    
    success "Node.js and npm versions are compatible"
}

# Install dependencies
install_dependencies() {
    log "Installing backend dependencies..."
    cd backend
    npm install --production=false
    cd ..
    
    log "Installing frontend dependencies..."
    cd frontend
    npm install --production=false
    cd ..
    
    success "Dependencies installed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd backend
    if npm run migrate &> /dev/null; then
        success "Database migrations completed"
    else
        warning "Database migrations failed or not configured"
    fi
    cd ..
}

# Start backend server
start_backend() {
    log "Starting backend server on port $BACKEND_PORT..."
    cd backend
    PORT=$BACKEND_PORT npm run dev &
    local backend_pid=$!
    cd ..
    
    # Wait for backend to start
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
            success "Backend server is running on port $BACKEND_PORT"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    
    error "Backend server failed to start within 30 seconds"
    return 1
}

# Start frontend server
start_frontend() {
    log "Starting frontend server on port $FRONTEND_PORT..."
    cd frontend
    PORT=$FRONTEND_PORT npm run dev &
    local frontend_pid=$!
    cd ..
    
    # Wait for frontend to start
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            success "Frontend server is running on port $FRONTEND_PORT"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    
    error "Frontend server failed to start within 30 seconds"
    return 1
}

# Health check for running servers
health_check() {
    log "Performing health checks..."
    
    # Check backend health
    if curl -f -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    success "All health checks passed"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    pkill -f "node.*src/index.ts" || true
    pkill -f "next dev" || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "============================================"
    echo "AI Procurement Management - Startup Script"
    echo "============================================"
    echo
    
    check_dependencies
    check_node_version
    check_env_files
    check_database
    check_redis
    install_dependencies
    run_migrations
    
    echo
    log "Starting servers..."
    
    start_backend
    start_frontend
    
    echo
    health_check
    
    echo
    success "All servers are running successfully!"
    echo
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Backend:  http://localhost:$BACKEND_PORT"
    echo "Health:   http://localhost:$BACKEND_PORT/api/health"
    echo
    echo "Press Ctrl+C to stop all servers"
    
    # Keep the script running
    while true; do
        sleep 10
        # Optional: periodic health checks
        if ! health_check > /dev/null 2>&1; then
            error "Health check failed - servers may have stopped"
            break
        fi
    done
}

# Check if script is run from project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "This script must be run from the project root directory"
    exit 1
fi

main "$@"
