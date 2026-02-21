# 🚀 MongoDB Connection - Quick Reference Card

## ⚡ Quick Setup (2 minutes)

```bash
# 1. Edit .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey-saas?retryWrites=true&w=majority

# 2. Start server
npm run dev

# 3. Verify connection
curl http://localhost:5000/api/health/detailed
```

---

## 🔗 Connection Strings

### MongoDB Atlas
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Local MongoDB
```
mongodb://localhost:27017/survey-saas
```

### With Authentication (Local)
```
mongodb://username:password@localhost:27017/survey-saas
```

---

## 🎯 Environment Variables

```env
# Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.net/db

# Pool Configuration
MONGODB_POOL_SIZE=10
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_CONNECT_TIMEOUT=10000

# Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 📊 Health Check Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /api/health` | Basic status | Uptime, status |
| `GET /api/health/detailed` | Full status | DB connection, memory, pool |

**Test:**
```bash
curl http://localhost:5000/api/health/detailed | jq '.database'
```

---

## 🔧 Pool Size Guidelines

| Environment | MONGODB_POOL_SIZE |
|------------|-----------------|
| Development | 5 |
| Staging | 10 |
| Production | 20 |
| Testing | 2 |

---

## 🛡️ Connection Pooling

```
┌──────────────────┐
│ Your App         │
└────────┬─────────┘
         │
    ┌────▼───────────┐
    │ Connection Pool │
    │ (Max: 10)      │
    └────┬───────────┘
         │
    ┌────▼──────────┐
    │  MongoDB      │
    │  Database     │
    └───────────────┘
```

**Benefits:**
- ✅ Faster queries (reuse connections)
- ✅ Lower memory usage
- ✅ Better performance

---

## 🔐 URL Encoding Special Characters

| Char | Code | Example |
|------|------|---------|
| @ | %40 | pass@word → pass%40word |
| : | %3A | user:pass → user%3Apass |
| # | %23 | word#123 → word%23123 |

**Test:** `https://www.urlencoder.org/`

---

## 🐛 Troubleshooting Checklist

```
❌ ECONNREFUSED
   → Start MongoDB server
   → Check MongoDB Atlas cluster status

❌ ENOTFOUND
   → Verify cluster name spelling
   → Check internet connection

❌ Authentication failed
   → Verify username/password
   → Check URL encoding
   → Ensure user exists in Atlas

❌ ETIMEDOUT
   → Check network connection
   → Increase timeout values
   → Check MongoDB Atlas status

❌ Pool exhausted
   → Increase MONGODB_POOL_SIZE
   → Check for connection leaks
```

---

## 📋 Configuration by Environment

### Development
```env
NODE_ENV=development
MONGODB_POOL_SIZE=5
MONGODB_CONNECT_TIMEOUT=20000
MONGODB_SOCKET_TIMEOUT=60000
```

### Production
```env
NODE_ENV=production
MONGODB_POOL_SIZE=20
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_SOCKET_TIMEOUT=45000
```

---

## 🧪 Testing Commands

```bash
# Test connection
curl http://localhost:5000/api/health/detailed

# Create test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@test.com","password":"pass123"}'

# Get connection status
npm run dev
# Look for: "✓ MongoDB connected successfully"
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/config/database.js` | Connection utility |
| `src/config/dbMonitor.js` | Performance monitoring |
| `src/server.js` | Server setup & health checks |
| `MONGODB_SETUP.md` | Setup guide |
| `DATABASE_TESTING.md` | Testing guide |

---

## 🔌 Connection Methods

### In Code
```javascript
// Import
const { connectDB, isConnected } = require('./config/database');

// Connect
await connectDB();

// Check status
if (isConnected()) {
  console.log('Connected to MongoDB');
}

// Monitor
const { getMonitor } = require('./config/dbMonitor');
const monitor = getMonitor();
monitor.logPoolStatus();
```

---

## ⏱️ Timeout Values (milliseconds)

| Type | Dev | Prod |
|------|-----|------|
| Connection | 20000 | 10000 |
| Socket | 60000 | 45000 |
| Selection | 20000 | 10000 |

---

## 📱 API Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* data here */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "status": 500
}
```

---

## 🚀 Startup Checklist

- [ ] `.env` file exists with MONGODB_URI
- [ ] MONGODB_URI is correct format
- [ ] MongoDB server is running or Atlas cluster is active
- [ ] Network access is allowed (Atlas)
- [ ] Username/password are correct
- [ ] Special characters are URL encoded
- [ ] All dependencies installed (`npm install`)
- [ ] Run `npm run dev`
- [ ] Check `/api/health/detailed` shows `"connected": true`

---

## 📞 Quick Help Commands

```bash
# Check if server is running
curl http://localhost:5000/api/health

# Check database connection
curl http://localhost:5000/api/health/detailed

# Test MongoDB CLI connection (local)
mongo mongodb://localhost:27017/survey-saas

# Test MongoDB CLI connection (Atlas)
mongosh "your_mongodb_uri"

# View server logs
npm run dev

# Check Node version
node --version

# Check npm version
npm --version
```

---

## 🎯 Common Operations

### Monitor Connection Health
```javascript
const { getMonitor } = require('./config/dbMonitor');
const monitor = getMonitor();

// Get metrics
const metrics = monitor.getMetrics();
console.log(metrics);

// Get health status
const health = monitor.getHealthStatus();
console.log(health);

// Log status
monitor.logPoolStatus();
```

### Check Connection Status
```javascript
const { isConnected, getConnectionStatus } = require('./config/database');

if (isConnected()) {
  console.log('Connected!');
  console.log(getConnectionStatus());
}
```

### Graceful Disconnect
```javascript
const { disconnectDB } = require('./config/database');

await disconnectDB();
console.log('Database disconnected');
```

---

## 📈 Performance Tips

1. **Increase pool size** if handling many concurrent requests
   ```env
   MONGODB_POOL_SIZE=20
   ```

2. **Reduce timeouts** for fast networks
   ```env
   MONGODB_SOCKET_TIMEOUT=30000
   ```

3. **Enable query logging** in development
   ```javascript
   mongoose.set('debug', true);
   ```

4. **Monitor pool usage**
   ```bash
   curl http://localhost:5000/api/health/detailed
   ```

---

## ❌ Never Do

```javascript
// ❌ Don't hardcode credentials
const uri = "mongodb+srv://user:pass@...";

// ❌ Don't skip URL encoding
"mongodb+srv://user:my@pass#123@..."

// ❌ Don't commit .env file
git add .env  // WRONG!

// ❌ Don't use 0.0.0.0/0 in production
// Allow only specific IPs in MongoDB Atlas

// ❌ Don't ignore connection errors
// Handle and log all errors
```

---

## ✅ Always Do

```javascript
// ✅ Use environment variables
const uri = process.env.MONGODB_URI;

// ✅ URL encode special characters
password: "my%40pass%23123"

// ✅ Ignore .env in git
echo ".env" >> .gitignore

// ✅ Whitelist specific IPs
// In MongoDB Atlas > Network Access

// ✅ Handle connection errors
.catch(err => console.error(err));
```

---

## 🔗 Documentation

- **Setup**: `MONGODB_SETUP.md`
- **Testing**: `DATABASE_TESTING.md`
- **Implementation**: `MONGODB_CONNECTION_IMPLEMENTATION.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 Ready to Go!

1. ✅ Connection pooling configured
2. ✅ Error handling in place
3. ✅ Health checks available
4. ✅ Documentation complete

**Update .env and start building!** 🚀

---

*Quick Reference - Last Updated: 2024-02-09*
