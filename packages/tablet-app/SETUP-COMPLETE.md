# ✅ Tablet App Setup Complete

## Environment Configuration

Your tablet app is now configured and ready to use!

### Database Connection
- **Database**: MongoDB (shared with main Orca app)
- **Connection**: `mongodb://localhost:27017/orca?replicaSet=rs0`
- **Clinic**: Smile Orthodontics
- **Clinic ID**: `693c2fd4f85967012a04ca0a`

### Configuration Files Created
- ✅ `.env` - Environment variables (copied from main Orca)
- ✅ `package.json` - Dependencies (minimal, ~15 packages)
- ✅ `next.config.ts` - Next.js configuration (standalone mode)
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tailwind.config.ts` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration

### Code Copied from Main Orca
- ✅ `prisma/` - Database schema
- ✅ `src/lib/autoclave-service.ts` - Autoclave communication (nginx + MQX firmware)
- ✅ `src/lib/lenient-http.ts` - HTTP client for malformed headers
- ✅ `src/lib/qr-code.ts` - QR code generation
- ✅ `src/components/sterilization/` - Label printing components
- ✅ `src/components/ui/` - Essential shadcn/ui components

### API Routes Created (No Authentication)
All routes automatically use clinic ID: `693c2fd4f85967012a04ca0a`

- `GET /api/autoclaves` - List all autoclaves
- `POST /api/autoclaves` - Create new autoclave
- `GET /api/autoclaves/[id]` - Get single autoclave
- `PUT /api/autoclaves/[id]` - Update autoclave
- `DELETE /api/autoclaves/[id]` - Soft delete autoclave
- `POST /api/autoclaves/[id]/test` - Test connection

## Quick Start

### 1. Start the Development Server

```bash
cd packages/tablet-app
npm run dev
```

Visit: http://localhost:3001

### 2. Verify Database Connection

```bash
cd packages/tablet-app
npx tsx scripts/get-clinic-id.ts
```

Should show:
```
✓ Using the only clinic found.
Clinic: Smile Orthodontics
ID: 693c2fd4f85967012a04ca0a
```

### 3. Test API Routes

```bash
# List autoclaves (should be empty initially)
curl http://localhost:3001/api/autoclaves

# Create an autoclave
curl -X POST http://localhost:3001/api/autoclaves \
  -H "Content-Type: application/json" \
  -d '{
    "name": "StatClave 1",
    "ipAddress": "192.168.0.15",
    "port": 80
  }'

# Test connection
curl -X POST http://localhost:3001/api/autoclaves/[autoclave-id]/test
```

## Next Steps

### Phase 2: Build UI Pages
1. **Home Dashboard** - Grid of autoclave cards showing status
2. **Settings Page** - Add/edit/delete autoclaves
3. **Import Page** - Import cycles from autoclave
4. **Print Page** - Preview and print labels

### Phase 3: Label Printing
- Integrate QR code generation
- Create label preview
- Test with Zebra thermal printer

### Phase 4: Electron Wrapper
- Create Electron main process
- Configure fullscreen/kiosk mode
- Build Windows installer

## Autoclave Network Info

Your autoclaves (from previous session):
- **Autoclave 1**: 192.168.0.15 (MQX firmware)
- **Autoclave 2**: 192.168.0.23 (firmware TBD)
- **Network**: Same WiFi (192.168.0.x)

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code
npm run lint

# Get clinic ID
npx tsx scripts/get-clinic-id.ts
```

## Differences from Main Orca

| Feature | Main Orca | Tablet App |
|---------|-----------|------------|
| Authentication | NextAuth + Multi-user | None (kiosk mode) |
| Clinic Support | Multi-clinic | Single clinic (hard-coded) |
| Dependencies | 90+ packages | ~15 packages |
| Bundle Size | ~380MB | ~135MB |
| Port | 3000 | 3001 |
| Use Case | Full practice management | Autoclave monitoring only |

## Troubleshooting

### MongoDB Not Running
```bash
# From main Orca directory
docker-compose up -d mongodb
```

### Port 3001 Already in Use
Change `PORT` in `.env` to another port (e.g., 3002)

### Database Connection Error
Verify `DATABASE_URL` in `.env` matches main Orca app

### Clinic ID Not Found
Run: `npx tsx scripts/get-clinic-id.ts`

## Support

Refer to:
- [README.md](./README.md) - Full documentation
- [Implementation Plan](../../.claude/plans/crystalline-seeking-oasis.md) - Detailed plan
- Main Orca documentation in `/docs`
