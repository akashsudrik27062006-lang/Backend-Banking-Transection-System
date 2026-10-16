import mongoose from "mongoose";
import {Ledger} from "./ledger.models.js"

const accountSchema=new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:[true,"Account must be associated with a user"],
            index:true
        },
        status:{
            type:String,
            enum:{
                values:["ACTIVE","FROZEN","CLOSED"],
                message:"Status can be either ACTIVE, FROZEN or CLOSED",
            },
            default:"ACTIVE"
        },
        currency:{
            type:String,
            required:[true,"Currency is required for creanting an account"],
            default:"INR"
        },
    },
    {timestamps:true}
)

accountSchema.index({user:1 , status:1})

accountSchema.methods.getBalance=async function(){
    const balance=await Ledger.aggregate([
        {
            $match:{
                account:this._id,
            }
        },
        {
            // Calculate total debit and total credit
            $group:{
                _id:null,
                totalDebit:{
                    $sum:{
                        // Add amount only when the entry is a DEBIT
                        $cond:[
                            {$eq:["$type","DEBIT"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        // Add amount only when the entry is a CREDIT
                        $cond:[
                            {$eq:["$type","CREDIT"]},
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            // Calculate final balance = total credit - total debit
            $project:{
                _id:0,
                balance:{$subtract:["$totalCredit","$totalDebit"]}
            }
        }
    ])

    // If no ledger entries exist, the account balance is 0
    if(balance.length===0){
        return 0
    }

    return balance[0].balance
}

export const Account=mongoose.model("Account",accountSchema)