import mongoose from "mongoose";

const transactionSchema=new mongoose.Schema(
    {
        fromAccount:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Account",
            required:[true,"Transaction must be associated with fromAccount"],
            index:true
        },
        toAccount:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Account",
            required:[true,"Transaction must be associated with toAccount"],
            index:true
        },
        status:{
            type:String,
            enum:{
                values:["PENDING","FAILED","COMPLETED","REVERSED"],
                message:"Status can be either PENDING, FAILED, COMPLETED or REVERSED",
            },
            default:"PENDING"
        },
        amount:{
            type:Number,
            required:[true,"Amount is required for creating a transaction"],    
            min:[0,"Transaction amount cannot be negative"]
        },
        idempotencyKey:{
            type:String,
            required:[true,"Idempotency key is requierd for creating a transaction"],
            index:true,
            unique:true
        }
    },
    {timestamps:true}
)

export const Transaction=mongoose.model("Transaction",transactionSchema)