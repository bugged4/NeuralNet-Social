const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB) {
    throw new Error('MONGODB environment variable is required');
  }

  const connection = await mongoose.connect(process.env.MONGODB);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDB;
