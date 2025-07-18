# AI Procurement Management System

A comprehensive AI-powered procurement management platform built with Next.js, Node.js, and PostgreSQL.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis server (optional, for caching)
- OpenRouter API key
- HuggingFace API key

## Quick Start

### 1. Environment Setup

#### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your actual values:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/ai_procurement_db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=your-openrouter-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
CORS_ORIGIN=http://localhost:3000
```

#### Frontend Environment
```bash
cd frontend
# Frontend uses the default Next.js configuration
```

### 2. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 4. Start the Servers

#### Option 1: Start Both Servers (Recommended)
```bash
# From project root directory
npm run dev
```

#### Option 2: Start Individually

**Backend Server:**
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:3001

**Frontend Server:**
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:3000

## Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## API Endpoints

- Health Check: `GET /api/health`
- Authentication: `POST /api/auth/login`, `POST /api/auth/register`
- Vendors: `GET /api/vendors`, `POST /api/vendors`
- Bids: `GET /api/bids`, `POST /api/bids`
- Compliance: `GET /api/compliance`
- Dashboard: `GET /api/dashboard`

## Features

- 🤖 AI-powered vendor qualification
- 📊 Intelligent bid evaluation
- ✅ Automated compliance monitoring
- 📈 Real-time analytics dashboard
- 🔐 Role-based access control
- 📱 Mobile-responsive design
- 🔍 Advanced search and filtering
- 📋 Comprehensive audit trails

## Technology Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: OpenRouter (Claude 3.5 Sonnet), HuggingFace
- **Caching**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT with refresh tokens