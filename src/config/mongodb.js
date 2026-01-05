import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

export const connectMongoDB = async () => {
    try {
        const options = {
            dbName: process.env.MONGO_DB_NAME || 'scholarsync',
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000
        };

        await mongoose.connect(MONGO_URI, options);
        
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
        console.log(`📁 Database: ${mongoose.connection.name}`);
        
        // Monitor connection
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB Error:', err.message);
        });
        
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

// Clean shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

export default mongoose;