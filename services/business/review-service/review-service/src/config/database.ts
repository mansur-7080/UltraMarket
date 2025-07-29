import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// MongoDB connection options
const mongoOptions: mongoose.ConnectOptions = {
  // Connection settings
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 1, // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long to wait for a response

  // Buffering settings
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering

  // Monitoring
  heartbeatFrequencyMS: 10000, // How often to check server status

  // Write concern
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 30000,
  },

  // Read preference
  readPreference: 'primary',

  // Compression
  compressors: ['zlib'],

  // SSL/TLS (for production)
  ssl: process.env.NODE_ENV === 'production',

  // Application name for monitoring
  appName: 'ultramarket-review-service',
};

// Database connection state
let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectDB = async (): Promise<void> => {
  try {
    if (isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket_reviews';

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    logger.info('Connecting to MongoDB...', {
      uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials in logs
    });

    // Connect to MongoDB
    await mongoose.connect(mongoUri, mongoOptions);

    isConnected = true;

    logger.info('✅ MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
    });

    // Setup connection event listeners
    setupConnectionListeners();
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    if (!isConnected) {
      logger.info('MongoDB already disconnected');
      return;
    }

    await mongoose.disconnect();
    isConnected = false;

    logger.info('✅ MongoDB disconnected successfully');
  } catch (error) {
    logger.error('❌ MongoDB disconnection failed:', error);
    throw error;
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = (): {
  isConnected: boolean;
  readyState: number;
  host?: string;
  port?: number;
  database?: string;
} => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name,
  };
};

/**
 * Setup connection event listeners
 */
const setupConnectionListeners = (): void => {
  // Connection opened
  mongoose.connection.on('connected', () => {
    logger.info('🔗 MongoDB connection established');
    isConnected = true;
  });

  // Connection error
  mongoose.connection.on('error', (error) => {
    logger.error('❌ MongoDB connection error:', error);
    isConnected = false;
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    logger.warn('🔌 MongoDB connection lost');
    isConnected = false;
  });

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
    isConnected = true;
  });

  // Connection close
  mongoose.connection.on('close', () => {
    logger.info('🔒 MongoDB connection closed');
    isConnected = false;
  });

  // Fullset event (replica set)
  mongoose.connection.on('fullsetup', () => {
    logger.info('🔗 MongoDB replica set connection established');
  });

  // All servers disconnected (replica set)
  mongoose.connection.on('all', () => {
    logger.warn('⚠️ All MongoDB servers disconnected');
  });

  // Server selection failed
  mongoose.connection.on('serverSelectionError', (error) => {
    logger.error('🔍 MongoDB server selection failed:', error);
  });
};

/**
 * Health check for MongoDB connection
 */
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: any;
}> => {
  try {
    const connectionStatus = getConnectionStatus();

    if (!connectionStatus.isConnected || connectionStatus.readyState !== 1) {
      return {
        status: 'unhealthy',
        details: {
          message: 'MongoDB not connected',
          ...connectionStatus,
        },
      };
    }

    // Test database operation
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      details: {
        message: 'MongoDB connection healthy',
        responseTime: `${responseTime}ms`,
        ...connectionStatus,
      },
    };
  } catch (error) {
    logger.error('MongoDB health check failed:', error);
    return {
      status: 'unhealthy',
      details: {
        message: 'MongoDB health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...getConnectionStatus(),
      },
    };
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (): Promise<any> => {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();

    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      fileSize: stats.fileSize,
      nsSizeMB: stats.nsSizeMB,
      ok: stats.ok,
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    throw error;
  }
};

/**
 * Create database indexes
 */
export const createIndexes = async (): Promise<void> => {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }

    logger.info('Creating database indexes...');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const collection of collections) {
      const collectionName = collection.name;

      // Skip system collections
      if (collectionName.startsWith('system.')) {
        continue;
      }

      logger.info(`Creating indexes for collection: ${collectionName}`);

      // Create indexes based on collection name
      if (collectionName === 'reviews') {
        await createReviewIndexes();
      }
    }

    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('❌ Failed to create database indexes:', error);
    throw error;
  }
};

/**
 * Create indexes for reviews collection
 */
const createReviewIndexes = async (): Promise<void> => {
  try {
    const reviewsCollection = mongoose.connection.db.collection('reviews');

    // Create indexes
    await Promise.all([
      // Single field indexes
      reviewsCollection.createIndex({ productId: 1 }),
      reviewsCollection.createIndex({ userId: 1 }),
      reviewsCollection.createIndex({ rating: 1 }),
      reviewsCollection.createIndex({ verified: 1 }),
      reviewsCollection.createIndex({ moderationStatus: 1 }),
      reviewsCollection.createIndex({ featured: 1 }),
      reviewsCollection.createIndex({ createdAt: -1 }),
      reviewsCollection.createIndex({ updatedAt: -1 }),

      // Compound indexes
      reviewsCollection.createIndex({ productId: 1, rating: -1 }),
      reviewsCollection.createIndex({ productId: 1, moderationStatus: 1 }),
      reviewsCollection.createIndex({ productId: 1, createdAt: -1 }),
      reviewsCollection.createIndex({ userId: 1, createdAt: -1 }),
      reviewsCollection.createIndex({ moderationStatus: 1, createdAt: 1 }),
      reviewsCollection.createIndex({ featured: 1, 'helpful.yes': -1 }),

      // Complex compound indexes
      reviewsCollection.createIndex({
        productId: 1,
        moderationStatus: 1,
        rating: -1,
        createdAt: -1,
      }),

      // Text search index
      reviewsCollection.createIndex(
        {
          title: 'text',
          content: 'text',
          pros: 'text',
          cons: 'text',
        },
        {
          weights: {
            title: 10,
            content: 5,
            pros: 3,
            cons: 3,
          },
          name: 'review_text_search',
        }
      ),

      // Geospatial index (if needed for location-based features)
      reviewsCollection.createIndex({ 'metadata.location': '2dsphere' }),
    ]);

    logger.info('✅ Review collection indexes created successfully');
  } catch (error) {
    logger.error('❌ Failed to create review indexes:', error);
    throw error;
  }
};

/**
 * Drop database indexes
 */
export const dropIndexes = async (collectionName?: string): Promise<void> => {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }

    if (collectionName) {
      await mongoose.connection.db.collection(collectionName).dropIndexes();
      logger.info(`Dropped indexes for collection: ${collectionName}`);
    } else {
      const collections = await mongoose.connection.db.listCollections().toArray();

      for (const collection of collections) {
        if (!collection.name.startsWith('system.')) {
          await mongoose.connection.db.collection(collection.name).dropIndexes();
          logger.info(`Dropped indexes for collection: ${collection.name}`);
        }
      }
    }

    logger.info('✅ Database indexes dropped successfully');
  } catch (error) {
    logger.error('❌ Failed to drop database indexes:', error);
    throw error;
  }
};

/**
 * Graceful shutdown
 */
export const gracefulShutdown = async (): Promise<void> => {
  try {
    logger.info('Initiating graceful database shutdown...');

    // Close mongoose connection
    await mongoose.connection.close();

    logger.info('✅ Database shutdown completed');
  } catch (error) {
    logger.error('❌ Database shutdown failed:', error);
    throw error;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

export default {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  healthCheck,
  getDatabaseStats,
  createIndexes,
  dropIndexes,
  gracefulShutdown,
};
