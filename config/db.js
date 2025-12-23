/**
 * MongoDB Database Connection Configuration
 * 
 * WHY: Centralized database connection ensures consistent connection handling
 * across the entire application. This is a best practice in enterprise applications.
 * 
 * HOW: Uses Mongoose to connect to MongoDB with error handling and connection
 * state monitoring. Connection string comes from environment variables for security.
 * 
 * REAL-WORLD: Companies like Nykaa, Amazon use similar patterns to:
 * - Handle connection pooling
 * - Monitor connection health
 * - Gracefully handle connection failures
 */

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;






