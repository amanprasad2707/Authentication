import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config()

const connectDB = async () => {

  try {
    // Attach event listeners before attempting to connect
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Attempt to connect to MongoDB
    await mongoose.connect(`${process.env.MONGO_DB_URI}`);

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

export default connectDB;