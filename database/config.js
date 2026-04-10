import dotenv from 'dotenv';
dotenv.config();

const mongoUrl = process.env.MONGODB_URI;

export default { url: mongoUrl };