# MongoDB Connection Setup Guide

A comprehensive guide to setting up MongoDB with your Survey Management SaaS application.

## Table of Contents
1. [MongoDB Atlas Setup](#mongodb-atlas-setup)
2. [Connection String Configuration](#connection-string-configuration)
3. [Environment Variables](#environment-variables)
4. [Connection Pooling](#connection-pooling)
5. [Error Handling](#error-handling)
6. [Troubleshooting](#troubleshooting)
7. [Production Deploy Tips](#production-deploy-tips)
8. [Monitoring](#monitoring)

---

## MongoDB Atlas Setup

MongoDB Atlas is the easiest way to get started with MongoDB. Here's how to set it up:

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Create an account"
3. Sign up with email or social account
4. Complete email verification

### Step 2: Create a Cluster
1. Click "Create a Project"
2. Name it "survey-saas" (or your preferred name)
3. Click "Create Project"
4. Click "Build a Database"
5. Choose the "Free" tier (M0)
6. Select your preferred region (closest to your location)
7. Click "Create Cluster"

### Step 3: Create Database User
1. Click "Create a Database User"
2. Enter username: `survey_saas_user` (or your preference)
3. Click "Auto-generate password" (save it securely)
4. Set user privilege to "Built-in role: Atlas admin"
5. Click "Create User"

### Step 4: Configure Network Access
1. Click "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (for development only!)
   - **Production**: Add specific IP addresses instead
4. Click "Confirm"

### Step 5: Get Connection String
1. Click "Clusters" in the left sidebar
2. Click "Connect" button on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your actual credentials
6. Replace `<name>` with `survey-saas`

Example format:
```
mongodb+srv://username:password@cluster0.mongodb.net/survey-saas?retryWrites=true&w=majority
```

---

## Connection String Configuration

### MongoDB Atlas Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Components:**
- `username`: Your database user
- `password`: Your user's password (must be URL encoded)
- `cluster`: Your cluster name (e.g., cluster0.uw6oyf7)
- `database`: Your database name (e.g., survey-saas)

### Local MongoDB Format
```
mongodb://localhost:27017/survey-saas
```

### Replica Set Format
```
mongodb://host1:27017,host2:27017,host3:27017/survey-saas?replicaSet=rs0
```

---

## Environment Variables

### Setting Up .env File

1. Copy the example file:
```bash
cp .env.example .env
```

2. Update with your values:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey-saas?retryWrites=true&w=majority
MONGODB_DB_NAME=survey-saas

# MongoDB Connection Options
MONGODB_POOL_SIZE=10        # Connection pool size
MONGODB_SOCKET_TIMEOUT=45000  # Socket timeout in ms
MONGODB_CONNECT_TIMEOUT=10000 # Connection timeout in ms

# JWT Configuration
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Important: URL Encoding

If your password contains special characters, you must URL encode them:

| Character | Code |
|-----------|------|
| @ | %40 |
| : | %3A |
| # | %23 |
| $ | %24 |
| % | %25 |
| / | %2F |
| ? | %3F |
| & | %26 |

**Example:**
- Password: `my@pass#123`
- URL Encoded: `my%40pass%23123`

---

## Connection Pooling

### What is Connection Pooling?

Connection pooling reuses database connections instead of creating new ones for each request. This improves performance and reduces resource usage.

### Pool Configuration

```env
# Recommended for different environments:
# Development: 5 connections
# Staging: 10 connections
# Production: 20+ connections

MONGODB_POOL_SIZE=10        # Maximum pool size
```

### Pool Size by Environment

| Environment | Min | Max | Recommended |
|-------------|-----|-----|-------------|
| Development | 1 | 5 | 3 |
| Staging | 3 | 15 | 10 |
| Production | 5 | 50 | 20 |
| Testing | 1 | 3 | 2 |

### How it Works

```
Request 1 → Connection from pool
Request 2 → Connection from pool
Request 3 → Wait for available connection
Operation finishes → Return connection to pool
Request 4 → Reuse returned connection
```

---

## Error Handling

The connection utility automatically handles:

1. **Connection Failures**: Retries with exponential backoff
2. **Timeouts**: Graceful timeout with detailed error messages
3. **Authentication Errors**: Clear indication of credential issues
4. **Network Errors**: Automatic reconnection attempts
5. **Graceful Shutdown**: Proper cleanup on application termination

### Common Error Responses

```javascript
// Connection Error
{
  code: "ECONNREFUSED",
  message: "Connection refused - MongoDB server not running"
}

// Authentication Error
{
  code: "AUTHENTICATION_FAILED",
  message: "Invalid credentials provided"
}

// Timeout Error
{
  code: "ETIMEDOUT",
  message: "Connection timeout - server not responding"
}
```

---

## Troubleshooting

### Issue 1: "ECONNREFUSED - Connection refused"

**Cause:** MongoDB server is not running or wrong port

**Solutions:**
```bash
# Check if MongoDB is running locally
mongo --version

# Start MongoDB (macOS/Linux)
brew services start mongodb-community

# Start MongoDB (Windows)
# Open Services and start MongoDB

# For Atlas, check cluster status in dashboard
```

### Issue 2: "ENOTFOUND - getaddrinfo ENOTFOUND"

**Cause:** Invalid host or DNS resolution failed

**Solutions:**
```
1. Verify cluster name in MongoDB Atlas
2. Check internet connection
3. Verify DNS settings
4. Use full cluster name with region (e.g., cluster0.uw6oyf7)
```

### Issue 3: "MongoAuthenticationError - authentication failed"

**Cause:** Invalid credentials

**Solutions:**
```
1. Verify username and password in Atlas
2. Check if user exists
3. Verify URL encoding of special characters
4. Ensure user has database access
```

### Issue 4: "MongoNetworkError - Server selection timed out"

**Cause:** Cannot connect to any MongoDB server

**Solutions:**
```
1. Check firewall settings
2. Adding IP to Network Access in Atlas
3. Verify network connectivity
4. Increase MONGODB_CONNECT_TIMEOUT value
```

### Issue 5: Database Connection Lost During Operation

**Cause:** Network interruption or server timeout

**Solution:**
The connection utility has automatic retry logic:
```javascript
retryWrites: true    // Automatically retry writes
retryReads: true     // Automatically retry reads
w: 'majority'        // Ensure writes to majority replicas
```

---

## Production Deploy Tips

### 1. Security

**Never store credentials in code:**
```javascript
// ❌ Bad
const uri = "mongodb+srv://user:pass@cluster.mongodb.net/db";

// ✓ Good
const uri = process.env.MONGODB_URI;
```

**Use IP Whitelisting in Atlas:**
1. Add only your server's IP address
2. Not "Allow access from anywhere" (0.0.0.0/0)
3. Update whitelist when deploying to new servers

### 2. Connection Pooling

**Production settings:**
```env
MONGODB_POOL_SIZE=20              # Larger pool for higher concurrency
MONGODB_SOCKET_TIMEOUT=45000      # Standard timeout
MONGODB_CONNECT_TIMEOUT=10000     # Timeout for initial connection
```

### 3. Replicas and Backups

**In MongoDB Atlas:**
1. Select M1 cluster (or higher) for production
2. Enable automatic backups
3. Use M2+ for dedicated resources
4. Enable redundancy (replica set)

### 4. Monitoring

**Enable monitoring in Atlas:**
1. Go to "Monitoring" tab
2. Monitor connection count and query performance
3. Set up alerts for high connection usage

### 5. Vertical Scaling

**If experiencing performance issues:**
```
1. Monitor connection pool usage
2. Check average query time
3. Scale up cluster tier if needed
4. Optimize slow queries
```

### 6. Load Balancing

**For horizontal scaling:**
```javascript
// Mongoose automatically spreads reads across replicas
// Ensure retryWrites: true for better reliability
```

---

## Monitoring

### Health Check Endpoints

**Basic health check:**
```
GET http://localhost:5000/api/health
```

Response:
```json
{
  "status": "Server is running",
  "timestamp": "2024-02-09T10:30:00.000Z",
  "uptime": 3600
}
```

**Detailed health check (includes database status):**
```
GET http://localhost:5000/api/health/detailed
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-02-09T10:30:00.000Z",
  "uptime": 3600,
  "server": {
    "environment": "production",
    "port": 5000
  },
  "database": {
    "connected": true,
    "state": 1,
    "currentState": "connected",
    "host": "cluster0.mongodb.net",
    "database": "survey-saas"
  },
  "memory": {
    "heapUsed": "45 MB",
    "heapTotal": "256 MB"
  }
}
```

### Monitoring Metrics

```javascript
// Get current metrics
const monitor = require('./config/dbMonitor').getMonitor();
const metrics = monitor.getMetrics();

// Get pool status
const poolStats = monitor.getPoolStats();

// Get health status
const health = monitor.getHealthStatus();
```

### Logs to Monitor

Watch for these logs:
```
✓ MongoDB connected successfully     // Connection established
✗ MongoDB Connection Error            // Connection failed
⚠ MongoDB disconnected               // Connection lost
✓ MongoDB reconnected                // Auto-reconnected
```

---

## Quick Reference

### Development Setup
```bash
1. Create .env file from .env.example
2. Add MongoDB Atlas connection string
3. npm install
4. npm run dev
5. Visit http://localhost:5000/api/health/detailed
```

### Environment Variables Checklist
- [ ] MONGODB_URI set correctly
- [ ] JWT_SECRET changed from example
- [ ] FRONTEND_URL points to React dev server
- [ ] NODE_ENV set to 'development'
- [ ] PORT not in use

### Connection String Validation
```bash
# Check if MongoDB is reachable
mongo "mongodb+srv://username:password@cluster.mongodb.net/survey-saas"

# If using local MongoDB
mongo mongodb://localhost:27017/survey-saas
```

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Connection Guide](https://mongoosejs.com/docs/connections.html)
- [MongoDB Driver Connection Pooling](https://www.mongodb.com/docs/drivers/python/master/fundamentals/connection/)
- [Best Practices for MongoDB](https://www.mongodb.com/docs/manual/administration/security-best-practices/)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review MongoDB Atlas logs
3. Check network connectivity
4. Verify environment variables
5. Check `/api/health/detailed` endpoint

For persistent issues, consider:
- Creating a test cluster with minimal configuration
- Checking MongoDB Atlas status page
- Reviewing application logs for detailed error messages
