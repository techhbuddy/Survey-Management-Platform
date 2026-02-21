const mongoose = require('mongoose');

/**
 * Database Monitoring Utility
 * Provides real-time monitoring of MongoDB connection pool and performance metrics
 */

class DatabaseMonitor {
  constructor() {
    this.metrics = {
      connectionsCreated: 0,
      connectionsClosed: 0,
      queriesExecuted: 0,
      errors: [],
      startTime: new Date(),
    };

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for mongoose events
   */
  setupEventListeners() {
    const db = mongoose.connection;

    // Track queries
    db.on('open', () => {
      console.log('✓ Database connection opened');
    });

    // Error tracking
    db.on('error', (err) => {
      this.metrics.errors.push({
        timestamp: new Date(),
        message: err.message,
        code: err.code,
      });

      // Keep only last 50 errors
      if (this.metrics.errors.length > 50) {
        this.metrics.errors.shift();
      }

      console.error('✗ Database error:', err.message);
    });

    // Connection timeout
    db.on('timeout', () => {
      console.warn('⚠ Database connection timeout');
    });

    // Disconnection
    db.on('disconnected', () => {
      this.metrics.connectionsClosed += 1;
      console.warn('⚠ Database disconnected');
    });

    // Reconnection
    db.on('reconnected', () => {
      this.metrics.connectionsCreated += 1;
      console.log('✓ Database reconnected');
    });
  }

  /**
   * Get current pool statistics
   */
  getPoolStats() {
    const db = mongoose.connection;

    // Get connection pool info
    const client = db.getClient();
    const poolStats = client?.topology?.s?.sessionPool;

    return {
      poolSize: process.env.MONGODB_POOL_SIZE || 10,
      minPoolSize: 2,
      currentConnections: db.readyState, // 0-3 representing state
      isBusy: db.readyState === 0 || db.readyState === 2,
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics() {
    const uptime = new Date() - this.metrics.startTime;

    return {
      uptime: {
        milliseconds: uptime,
        seconds: Math.round(uptime / 1000),
        minutes: Math.round(uptime / 60000),
      },
      connections: {
        created: this.metrics.connectionsCreated,
        closed: this.metrics.connectionsClosed,
        active: mongoose.connection.readyState === 1,
      },
      performance: {
        queriesExecuted: this.metrics.querieExecuted,
        avgQueryTime: 'N/A', // Can be enhanced with query timing
      },
      errors: {
        count: this.metrics.errors.length,
        recent: this.metrics.errors.slice(-5),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const db = mongoose.connection;
    const isHealthy = db.readyState === 1 && this.metrics.errors.length < 10;

    return {
      healthy: isHealthy,
      status: isHealthy ? 'OK' : 'WARNING',
      connectionState: this.getStateDescription(db.readyState),
      lastErrors: this.metrics.errors.slice(-3),
    };
  }

  /**
   * Convert connection state number to description
   */
  getStateDescription(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      connectionsCreated: 0,
      connectionsClosed: 0,
      querieExecuted: 0,
      errors: [],
      startTime: new Date(),
    };
    console.log('✓ Metrics reset');
  }

  /**
   * Log pool status to console
   */
  logPoolStatus() {
    const poolStats = this.getPoolStats();
    const health = this.getHealthStatus();

    console.log('\n📊 Database Pool Status:');
    console.log('─'.repeat(40));
    console.log(`Connected: ${health.status}`);
    console.log(`State: ${health.connectionState}`);
    console.log(`Pool Size: ${poolStats.poolSize}`);
    console.log(`Is Busy: ${poolStats.isBusy ? 'Yes' : 'No'}`);
    console.log(`Recent Errors: ${health.lastErrors.length}`);
    console.log('─'.repeat(40) + '\n');
  }
}

// Create singleton instance
let monitor = null;

/**
 * Get or create monitor instance
 */
const getMonitor = () => {
  if (!monitor) {
    monitor = new DatabaseMonitor();
  }
  return monitor;
};

module.exports = {
  getMonitor,
  DatabaseMonitor,
};
