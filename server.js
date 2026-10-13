import dotenv from "dotenv"
dotenv.config();
import app from "./src/app.js"
import connectDB from "./dbConnection/indexDB.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000,()=>{
        console.log("Server is running on port ",process.env.PORT);
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed : ",error);
    process.exit(1)
})