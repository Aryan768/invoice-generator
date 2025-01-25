import mongoose from 'mongoose';


// db.js


// Replace with your MongoDB connection string
const uri = 'mongodb://localhost:27017/invoiceDB'; // Local MongoDB instance

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};
export default connectDB;
