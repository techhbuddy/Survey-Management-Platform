# Database Connection Testing & Verification Guide

Quick guide to test and verify your MongoDB connection setup.

## Test Connection Immediately After Setup

### Option 1: Using Node REPL

```bash
# Go to backend directory
cd survey-saas/backend

# Start Node REPL
node

# Then in REPL:
> const { connectDB, isConnected } = require('./src/config/database');
> connectDB().then(() => {
...   console.log('Connected:', isConnected());
... });
```

### Option 2: Test Endpoint

After starting the server, visit in your browser:

```
http://localhost:5000/api/health/detailed
```

**Expected response:**
```json
{
  "status": "OK",
  "database": {
    "connected": true,
    "currentState": "connected",
    "host": "cluster0.uw6oyf7.mongodb.net",
    "database": "survey-saas"
  }
}
```

### Option 3: Check Application Logs

Start the server and look for:
```
✓ MongoDB connected successfully
  Host: cluster0.uw6oyf7.mongodb.net
  Database: survey-saas
```

---

## Debugging Connection Issues

### Enable Verbose Logging

Add to `.env`:
```env
LOG_LEVEL=debug
```

### Check Connection String

Verify your `MONGODB_URI` is correct:

```bash
# MongoDB Atlas format (should be)
mongodb+srv://username:password@cluster.mongodb.net/survey-saas?retryWrites=true&w=majority

# Local format (if using local MongoDB)
mongodb://localhost:27017/survey-saas
```

### Test from Command Line

**For MongoDB Atlas:**
```bash
# Using mongosh (MongoDB Shell)
mongosh "mongodb+srv://username:password@cluster.mongodb.net/survey-saas"

# If mongosh is not installed, use mongo instead
mongo "mongodb+srv://username:password@cluster.mongodb.net/survey-saas"
```

**For Local MongoDB:**
```bash
mongo mongodb://localhost:27017/survey-saas
```

If connection succeeds from CLI but not from app:
- Check environment variables are loaded correctly
- Verify .env file exists and has correct format
- Restart application after .env changes

---

## Performance Monitoring Commands

### Check Connection Pool Usage

```bash
# In Node REPL
> const mongoose = require('mongoose');
> const db = mongoose.connection;
> db.readyState  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
1

# Get pool stats
> db.getClient().topology.s.sessionPool
```

### Monitor Queries

Add this to your server.js to log all queries:

```javascript
// Add to server.js after connectDB()
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true); // Log all queries
}
```

### Check Memory Usage

```bash
# While server is running, in another terminal
# Using Node's built-in heap snapshot
> require('v8').writeHeapSnapshot()  // Creates heap snapshot file

# Or use standard metrics
curl http://localhost:5000/api/health/detailed | grep memory
```

---

## Connection String Examples

### Correct Examples

✓ **MongoDB Atlas with Standard Credentials:**
```
mongodb+srv://survey_user:password123@cluster0.mongodb.net/survey-saas?retryWrites=true&w=majority
```

✓ **MongoDB Atlas with Special Characters (URL Encoded):**
```
mongodb+srv://user:my%40pass%23123@cluster0.mongodb.net/survey-saas?retryWrites=true&w=majority
```

✓ **Local MongoDB:**
```
mongodb://localhost:27017/survey-saas
```

✓ **Local MongoDB with Authentication:**
```
mongodb://username:password@localhost:27017/survey-saas
```

### Incorrect Examples

✗ **Missing credentials:**
```
mongodb+srv://cluster0.mongodb.net/survey-saas
```

✗ **Special characters not encoded:**
```
mongodb+srv://user:my@pass#123@cluster0.mongodb.net/survey-saas
```

✗ **Wrong port for Atlas:**
```
mongodb://cluster0.mongodb.net:27017  # Atlas doesn't use standard port
```

---

## Verification Checklist

Before deploying to production:

- [ ] Connection test passes with `/api/health/detailed`
- [ ] No authentication errors in logs
- [ ] Pool size configured appropriately for your environment
- [ ] Connection timeouts are appropriate
- [ ] Graceful shutdown works (Ctrl+C closes connection cleanly)
- [ ] Automatic reconnection works (stop MongoDB and restart, should reconnect)
- [ ] Error handling returns proper JSON responses
- [ ] Environment variables use secure methods for passwords
- [ ] IP whitelist configured in MongoDB Atlas
- [ ] Backup enabled for database cluster
- [ ] Monitoring enabled for connection metrics

---

## Load Testing

### Simple Load Test

```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 http://localhost:5000/api/health/detailed

# Using wrk
wrk -t4 -c100 -d30s http://localhost:5000/api/health/detailed
```

### Monitor Pool During Load

In another terminal, keep checking:
```bash
curl http://localhost:5000/api/health/detailed | grep -A 5 database
```

Watch for:
- Connection count increasing to pool max
- No timeout errors
- Successful completion of all requests

---

## Common Test Scenarios

### Test 1: Basic Connectivity
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"Server is running"...}
```

### Test 2: Database Connectivity
```bash
curl http://localhost:5000/api/health/detailed
# Database.connected should be true
```

### Test 3: Authentication (Before Login)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
# Should return error (user not found)
```

### Test 4: Create User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "password":"securepass123"
  }'
# Should return user object with token
```

### Test 5: Verify Data in MongoDB

Using mongosh:
```javascript
use survey-saas
db.users.find()  // Should show your created user
```

---

## Disaster Recovery

### Connection Recovery Test

**Test automatic reconnection:**

1. Start server
2. Stop MongoDB (Ctrl+C if local, or pause cluster in Atlas)
3. Watch logs - should show "disconnected"
4. Restart MongoDB
5. Watch logs - should show "reconnected"

### Data Persistence Test

After reconnection, verify data is still there:

```bash
# In mongosh
db.users.find()        # Should have your test data
db.surveys.find()      # Should have any surveys created
```

---

## Performance Optimization Tips

### For High Traffic Applications

```env
# Increase pool size
MONGODB_POOL_SIZE=20

# Reduce timeout for faster failures
MONGODB_SOCKET_TIMEOUT=30000

# Optimize read preference
MONGODB_READ_PREFERENCE=secondaryPreferred
```

### Query Optimization

Monitor slow queries:
```javascript
// In mongoConfig.js, slow query logs
db.setProfilingLevel(1, { slowms: 100 })  // Log queries > 100ms
```

### Connection Pooling Optimization

```javascript
// Check pool efficiency
const efficiency = connections_used / pool_size
// Aim for 60-80% utilization
```

---

## Troubleshooting Checklist

If connection fails:

1. ✓ Check `/api/health/detailed` endpoint first
2. ✓ Review error message from log
3. ✓ Verify MONGODB_URI in .env is correct
4. ✓ Test connection string in mongosh CLI
5. ✓ Check MongoDB Atlas cluster status
6. ✓ Verify IP whitelist includes your machine
7. ✓ Check username and password
8. ✓ URL encode special characters in password
9. ✓ Check internet connectivity
10. ✓ Review firewall settings

---

## Resources

- [MongoDB Atlas Connection Guide](https://docs.mongodb.com/guides/cloud/connection-strings/)
- [Mongoose Connection Documentation](https://mongoosejs.com/docs/connections.html)
- [MongoDB Connection Pooling](https://www.mongodb.com/docs/manual/administration/connection-string-uri/#connection-pool-options)
- [Connection Pool Troubleshooting](https://www.mongodb.com/docs/manual/reference/connection-string/#connection-pool-management)
