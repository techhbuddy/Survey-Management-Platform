/**
 * MongoDB Connection Configuration Presets
 * Different configurations for various deployment scenarios
 */

const getMongooseOptions = (environment = process.env.NODE_ENV) => {
  const baseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    strictQuery: true,
    serverMonitoringMode: 'auto',
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    family: 4,
    keepAlive: true,
    keepAliveInitialDelay: 30000,
  };

  switch (environment) {
    // Development: Fast connection, loose timeouts
    case 'development':
      return {
        ...baseOptions,
        maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 5,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 60000,
      };

    // Production: Strict timeouts, good pool size
    case 'production':
      return {
        ...baseOptions,
        maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 20,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 60000,
        waitQueueTimeoutMS: 10000,
      };

    // Testing: Minimal connections
    case 'test':
      return {
        ...baseOptions,
        maxPoolSize: 2,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      };

    // Staging: Balanced settings
    case 'staging':
      return {
        ...baseOptions,
        maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 15,
        minPoolSize: 3,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      };

    default:
      return baseOptions;
  }
};

/**
 * Connection string builders for different MongoDB setups
 */
const connectionStringBuilders = {
  /**
   * MongoDB Atlas (Cloud)
   * URI: mongodb+srv://username:password@cluster.mongodb.net/database
   */
  atlas: (username, password, cluster, database = 'survey-saas') => {
    return `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${database}?retryWrites=true&w=majority`;
  },

  /**
   * MongoDB Community (Local)
   * URI: mongodb://localhost:27017/database
   */
  community: (host = 'localhost', port = 27017, database = 'survey-saas') => {
    return `mongodb://${host}:${port}/${database}`;
  },

  /**
   * MongoDB Replica Set
   * URI: mongodb://host1:port1,host2:port2,host3:port3/database?replicaSet=rs0
   */
  replicaSet: (hosts = [], database = 'survey-saas', replicaSet = 'rs0') => {
    const hostString = hosts.join(',');
    return `mongodb://${hostString}/${database}?replicaSet=${replicaSet}`;
  },

  /**
   * Sharded Cluster
   * URI: mongodb://mongos1:port1,mongos2:port2/database
   */
  sharded: (mongosHosts = [], database = 'survey-saas') => {
    const hostString = mongosHosts.join(',');
    return `mongodb://${hostString}/${database}`;
  },
};

/**
 * Recommended connection pool sizes by deployment type
 */
const poolSizeRecommendations = {
  development: {
    min: 1,
    max: 5,
    recommended: 3,
    description: 'Minimal for local development',
  },
  staging: {
    min: 3,
    max: 15,
    recommended: 10,
    description: 'Moderate for staging environment',
  },
  production: {
    min: 5,
    max: 50,
    recommended: 20,
    description: 'Larger pool for production',
  },
  testing: {
    min: 1,
    max: 3,
    recommended: 2,
    description: 'Minimal for unit/integration testing',
  },
};

/**
 * Timeout recommendations (in milliseconds)
 */
const timeoutRecommendations = {
  serverSelection: {
    development: 20000,
    staging: 15000,
    production: 10000,
    testing: 5000,
    description: 'Time to select a server before failing',
  },
  socketTimeout: {
    development: 60000,
    staging: 45000,
    production: 45000,
    testing: 30000,
    description: 'Time to wait for response from server',
  },
  connect: {
    development: 10000,
    staging: 10000,
    production: 5000,
    testing: 5000,
    description: 'Time to establish initial connection',
  },
};

/**
 * Error codes and their meanings
 */
const mongoDBErrorCodes = {
  'ECONNREFUSED': 'Connection refused - MongoDB server not running',
  'ENOTFOUND': 'DNS lookup failed - invalid host',
  'ETIMEDOUT': 'Connection timeout - server not responding',
  'EHOSTUNREACH': 'Host is unreachable',
  'NETWORK_TIMEOUT': 'Network timeout occurred',
  'AUTHENTICATION_FAILED': 'Invalid credentials provided',
  'UNAUTHORIZED': 'Not authorized to access the database',
  'SERVER_SELECTION_FAILED': 'Could not select a server for operation',
  'UNKNOWN_SERVER': 'Server unknown/uninitialized',
};

/**
 * Troubleshooting guide based on error codes
 */
const troubleshootingGuide = {
  'ECONNREFUSED': {
    common_causes: [
      'MongoDB server is not running',
      'Server is running on different port',
      'Firewall blocking connection',
    ],
    solutions: [
      'Ensure MongoDB is running: mongod (local) or check Atlas cluster status',
      'Check MONGODB_URI port number',
      'Check firewall/security group settings',
    ],
  },
  'ENOTFOUND': {
    common_causes: [
      'Invalid hostname/cluster name',
      'DNS resolution failure',
      'Network connectivity issue',
    ],
    solutions: [
      'Verify MongoDB Atlas cluster name',
      'Check internet connection',
      'Verify DNS settings',
    ],
  },
  'AUTHENTICATION_FAILED': {
    common_causes: [
      'Incorrect username or password',
      'Credentials not URL encoded',
      'User not created in MongoDB',
    ],
    solutions: [
      'Verify credentials in MongoDB Atlas',
      'URL encode special characters: @ -> %40, : -> %3A',
      'Check user exists with correct database access',
    ],
  },
};

/**
 * Best practices for MongoDB connections
 */
const bestPractices = {
  connection_pooling: 'Enable connection pooling to reuse connections and improve performance',
  retry_logic: 'Enable retryWrites and retryReads for automatic failure recovery',
  timeouts: 'Set appropriate timeouts to fail fast on connection issues',
  monitoring: 'Monitor connection pool usage and errors in production',
  graceful_shutdown: 'Properly close connections on application shutdown',
  url_encoding: 'Always URL encode special characters in connection strings',
  replicas: 'Use replica sets (w: majority) for data durability',
  ipv4: 'Prefer IPv4 (family: 4) over IPv6 for better compatibility',
  keepalive: 'Enable keepAlive to maintain persistent connections',
};

module.exports = {
  getMongooseOptions,
  connectionStringBuilders,
  poolSizeRecommendations,
  timeoutRecommendations,
  mongoDBErrorCodes,
  troubleshootingGuide,
  bestPractices,
};
