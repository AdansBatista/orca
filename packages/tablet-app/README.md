# Autoclave Monitor - Tablet App

A lightweight, standalone Electron app for autoclave monitoring and thermal label printing. Designed for Windows tablets in orthodontic clinics.

## Overview

This is a simplified version of the Orca autoclave integration, optimized for single-clinic kiosk operation on tablets. No authentication required.

## Features

- Connect to multiple autoclaves (nginx and MQX firmware)
- Import sterilization cycles from autoclaves
- Print thermal labels (Zebra 2x1" format)
- Generate QR codes for cycle tracking
- Persistent storage using shared MongoDB
- Touch-optimized UI for tablets

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: TailwindCSS + shadcn/ui components
- **Database**: MongoDB (shared with main Orca app via Prisma)
- **Desktop**: Electron (Windows-only)

## Setup

### 1. Environment Configuration

Create a `.env` file:

```bash
# Copy example
cp .env.example .env

# Edit with your values
DATABASE_URL="mongodb://localhost:27017/orca"
CLINIC_ID="your-clinic-id-here"
PORT=3001
```

### 2. Install Dependencies

From the repo root:

```bash
npm install
```

### 3. Database

The tablet app shares the MongoDB database with the main Orca application. Ensure MongoDB is running:

```bash
# From main Orca directory
docker-compose up -d mongodb
```

### 4. Run Development Server

```bash
cd packages/tablet-app
npm run dev
```

Visit http://localhost:3001

### 5. Run with Electron (TODO)

```bash
npm run electron:dev
```

## Project Structure

```
packages/tablet-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (no auth)
│   │   │   └── autoclaves/   # Autoclave management
│   │   ├── layout.tsx
│   │   └── page.tsx           # Home dashboard
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── sterilization/     # Label printing components
│   │
│   ├── lib/
│   │   ├── db.ts              # Prisma client (no auth wrapper)
│   │   ├── autoclave-service.ts  # Autoclave communication
│   │   ├── lenient-http.ts    # Handles malformed headers
│   │   └── qr-code.ts         # QR generation
│   │
│   └── types/                 # TypeScript definitions
│
├── prisma/                    # Copied from main Orca app
├── electron/                  # Electron main process (TODO)
├── public/                    # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## API Routes

All routes use the hard-coded `CLINIC_ID` from environment.

### Autoclaves

- `GET /api/autoclaves` - List all autoclaves
- `POST /api/autoclaves` - Create autoclave
- `GET /api/autoclaves/[id]` - Get single autoclave
- `PUT /api/autoclaves/[id]` - Update autoclave
- `DELETE /api/autoclaves/[id]` - Soft delete autoclave
- `POST /api/autoclaves/[id]/test` - Test connection & update status

## Differences from Main Orca App

1. **No Authentication**: Direct access, kiosk mode
2. **Single Clinic**: Hard-coded `CLINIC_ID` instead of multi-clinic isolation
3. **Minimal Dependencies**: ~15-20 packages vs 90+
4. **Simplified UI**: Touch-optimized for tablets
5. **No External Services**: No OpenAI, Stripe, Twilio, etc.

## Development Status

### ✅ Completed (Phase 1)
- [x] Monorepo workspace configuration
- [x] Next.js 15 project structure
- [x] TypeScript path aliases
- [x] Prisma schema copied
- [x] Sterilization services copied
- [x] UI components copied
- [x] Database layer created
- [x] Autoclave API routes

### 🚧 In Progress
- [ ] Home Dashboard UI
- [ ] Settings page UI
- [ ] Import page UI
- [ ] Print page UI

### 📋 TODO (Phase 2-5)
- [ ] Label printing integration
- [ ] Electron wrapper
- [ ] Windows installer
- [ ] Testing with actual autoclaves
- [ ] Zebra thermal printer testing

## Building for Production

```bash
# Build Next.js app
npm run build

# Build Electron app
npm run electron:build

# Output: dist/Autoclave-Monitor-1.0.0.exe
```

## Bundle Size

- **Estimated total**: ~135-140MB
- **vs Full Orca wrapper**: 380-400MB (255MB+ savings)

## Deployment

1. Build Windows installer (.exe)
2. Install on clinic tablets (Surface Pro, Dell Latitude, etc.)
3. Configure autoclave IPs in Settings
4. Print labels!

## License

Proprietary - Part of Orca Practice Management System
