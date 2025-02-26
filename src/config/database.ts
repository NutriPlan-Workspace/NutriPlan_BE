import dotenv from 'dotenv';
import { connect } from 'mongoose';

dotenv.config();

const MONGO_URI_LINK: string = process.env.MONGO_URI || 'Default string';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await connect(MONGO_URI_LINK);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
