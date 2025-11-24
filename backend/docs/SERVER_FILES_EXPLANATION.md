# Server Files Explanation

## LOW PRIORITY FIX: Documentation for Duplicate Server Files

This document explains the purpose of different server files in the project.

## File Structure

### `backend/server.js`
**Purpose**: Main Express.js server for local development and traditional hosting

**Use Cases**:
- Local development (`npm run dev`)
- Production deployment on VPS/dedicated servers
- Docker containers
- Traditional Node.js hosting

**Features**:
- Full Express.js application
- All middleware and routes
- Database connection pooling
- File system access
- Background jobs and cleanup tasks

**Start Command**: `npm start` or `npm run dev`

---

### `api/index.js`
**Purpose**: Vercel serverless function handler for serverless deployment

**Use Cases**:
- Vercel deployment (free tier)
- Serverless architecture
- Edge functions
- Cloud functions

**Features**:
- Optimized for serverless execution
- Stateless design
- Connection pooling for serverless
- Minimal cold start time
- Auto-scaling

**Deployment**: Automatically deployed when using Vercel

---

## When to Use Which

### Use `backend/server.js` when:
- ✅ Running locally for development
- ✅ Deploying to traditional hosting (VPS, dedicated server)
- ✅ Using Docker containers
- ✅ Need persistent connections and background jobs
- ✅ Full control over server lifecycle

### Use `api/index.js` when:
- ✅ Deploying to Vercel (free tier)
- ✅ Want serverless auto-scaling
- ✅ Prefer pay-per-use model
- ✅ Need global edge deployment
- ✅ Stateless application design

## Migration Between Servers

Both servers use the same:
- Database configuration
- Route handlers
- Controllers and services
- Middleware

The main difference is:
- `backend/server.js`: Full Express app with persistent connections
- `api/index.js`: Serverless function optimized for Vercel

## Configuration

Both servers read from the same `.env` file, but:
- `backend/server.js` uses `backend/.env`
- `api/index.js` uses root `.env` (for Vercel environment variables)

## Notes

- Both servers are maintained and functional
- Choose based on your deployment strategy
- Can run both simultaneously for different purposes
- Code is shared between both implementations

