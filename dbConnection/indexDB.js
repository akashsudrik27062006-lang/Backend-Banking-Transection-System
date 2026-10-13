import dotenv from "dotenv"
dotenv.config();
import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB=async()=>{
    try {
        const dbConnection=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMongoDB connected !! DB Host : ${dbConnection.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed",error);
    }
}

export default connectDB
