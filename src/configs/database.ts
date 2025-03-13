import { connect } from 'mongoose';

import { DATABASE_URL } from './secrets';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await connect(DATABASE_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
