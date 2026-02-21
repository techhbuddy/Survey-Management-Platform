const mongoose = require('mongoose');

// Configure Mongoose settings
mongoose.set('strictQuery', true);

/**
 * MongoDB Connection Configuration with Connection Pooling
 * Connection Pool allows reusing connections for better performance
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Enhanced connection options with timeout settings
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds to select a server
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 30000, // 30 seconds to connect
      maxPoolSize: 10, // Maximum connection pool size
      minPoolSize: 5, // Minimum connection pool size
      retryWrites: true, // Enable retry logic for write operations
      w: 'majority', // Wait for majority of replicas to acknowledge writes
      readPreference: 'primary', // Always read from primary
    };

    // Establish connection
    const connection = await mongoose.connect(mongoURI, connectionOptions);

    // Connection success handlers
    mongoose.connection.on('connected', () => {
      console.log('✓ MongoDB connected successfully');
      console.log(`  Host: ${mongoose.connection.host}`);
      console.log(`  Database: ${mongoose.connection.name}`);
    });

    // Connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB connection error:', err.message);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✓ MongoDB connection closed on app termination');
        process.exit(0);
      } catch (err) {
        console.error('✗ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return connection;
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });

    // Additional debugging information
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n📝 Please ensure:');
      console.error('  1. MONGODB_URI is set in your .env file');
      console.error('  2. For MongoDB Atlas, use format: mongodb+srv://user:pass@cluster.net/db');
      console.error('  3. Username and password are URL encoded');
      console.error('  4. Network access is allowed in MongoDB Atlas IP Whitelist');
    }

    // Retry after delay in development
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔄 Retrying connection in 5 seconds...');
      setTimeout(() => connectDB(), 5000);
    } else {
      process.exit(1);
    }
  }
};

/**
 * Get current connection status
 */
const getConnectionStatus = () => {
  const connection = mongoose.connection;
  return {
    state: connection.readyState,
    readyStates: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    },
    currentState: connection.readyState === 1 ? 'connected' : 'disconnected',
    host: connection.host || 'N/A',
    database: connection.name || 'N/A',
  };
};

/**
 * Check if connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Gracefully disconnect
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected successfully');
  } catch (error) {
    console.error('✗ Error disconnecting MongoDB:', error.message);
    throw error;
  }
};

module.exports = {
  connectDB,
  getConnectionStatus,
  isConnected,
  disconnectDB,
  mongoose,
};
