import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Transaction } from "../models/transaction.models.js";
import { Account } from "../models/account.models.js";
import {sendTransactionFailureEmail,sendTransactionEmail,sendRegistrationEmail} from "../services/email.services.js"
import mongoose from "mongoose";
import { Ledger } from "../models/ledger.models.js";
import { User } from "../models/user.models.js";
//createTransaction 

// Validate request   
// Validate idempotency key   
// Check account status        
// Derive sender balance from Ledger       
// Create Transaction (PENDING)       
// Create DEBIT ledger entry       
// Create CREDIT ledger entry       
// Mark Transaction COMPLETED     
// Commit MongoDB session       
// Send email notification
const createTransaction=asyncHandler(async(req,res)=>{
    const {fromAccount,toAccount,amount,idempotencyKey}=req.body
    if(!fromAccount || !toAccount || !amount || amount<=0 || !idempotencyKey || !mongoose.isValidObjectId(fromAccount) || !mongoose.isValidObjectId(toAccount)){
        throw new ApiError(400,"fromAccount, toAccount, amount, idempotencyKey are required")
    }

    // Sender and receiver cannot be the same account
    if(fromAccount.toString() === toAccount.toString()){
        throw new ApiError(400,"fromAccount and toAccount cannot be the same")
    }

    // Find both sender and receiver accounts in the database
    const fromUserAccount=await Account.findById(fromAccount);
    const toUserAccount=await Account.findById(toAccount);

    // Make sure both accounts actually exist
    if(!fromUserAccount){
        throw new ApiError(400,"fromAccountUser doesnot exists")
    }
    if(!toUserAccount){
        throw new ApiError(400,"toAccountUser doesnot exists")
    }

    // Make sure the logged-in user owns the sender account
    if(fromUserAccount.user.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to use this account")
    }

    // Check if this request was already processed using the idempotency key
    const isTransactionAlreadyExists=await Transaction.findOne({idempotencyKey:idempotencyKey});

    if(isTransactionAlreadyExists){
        // If already completed, return the existing transaction
        if(isTransactionAlreadyExists.status==="COMPLETED"){
            return res.status(200).
            json(new ApiResponse(200,isTransactionAlreadyExists,"Transection already comleted"))
        }

        // If still pending, return its current status
        if(isTransactionAlreadyExists.status==="PENDING"){
            return res.status(200).
            json(new ApiResponse(200,isTransactionAlreadyExists,"Transection is still pending")
            );
        }

        // If failed, ask the client to retry with a new request/key
        if(isTransactionAlreadyExists.status==="FAILED"){
            return res.status(500).
            json(new ApiResponse(500,isTransactionAlreadyExists,"Transection was failed, please retry")
            );
        }

        // If reversed, the transaction should not be processed again
        if(isTransactionAlreadyExists.status==="REVERSED"){
            return res.status(500).
            json(new ApiResponse(500,isTransactionAlreadyExists,"Transection was reversed, please retry")
            );
        }
    }

    // Both sender and receiver accounts must be active
    if(fromUserAccount.status!=="ACTIVE" || toUserAccount.status!=="ACTIVE"){
        throw new ApiError(400,"Both fromAccount and toAccount must be ACTIVE to provess transaction")
    }

    // Calculate the current balance of the sender from ledger entries
    const fromUserAccountBalance=await fromUserAccount.getBalance();

    // Make sure the sender has enough money
    if(fromUserAccountBalance<amount){
        throw new ApiError(400,`Insufficient Balance. Current balance is ${fromUserAccountBalance}. Requested amount is ${amount}.`)
    }

    // Start a MongoDB session and transaction
    // All database operations below will be treated as one atomic operation
    let transaction;
    try {
        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await Transaction.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        const debitLedgerEntry = await Ledger.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        })()

        const creditLedgerEntry = await Ledger.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        transaction.status = "COMPLETED";
        await Transaction.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()
    } catch (error) {
        return res.status(400)
        .json(new ApiResponse(400,null,"Transaction is Pending due to some issue, please retry after sometime"))
    }

    // Send transaction confirmation email after successful commit
    await sendTransactionEmail(req.user.email,req.user.name,amount,toAccount)

    //Send the successful response to the client
    return res.status(201)
    .json(new ApiResponse(201,transaction,"Transaction completed succesfully")
    )
})

const createInitialFundsTransaction=asyncHandler(async(req,res)=>{
    const {toAccount,amount,idempotencyKey}=req.body
    if(!toAccount || !mongoose.isValidObjectId(toAccount) || !amount || amount<=0 || !idempotencyKey){
        throw new ApiError(400,"toAccount, amount, idempotencyKey are required")
    }

    const toUserAccount=await Account.findById(toAccount)
    if(!toUserAccount){
        throw new ApiError(400,"toAccountUser doesnot exists")
    }

    const fromUserAccount=await Account.findOne({
        user:req.user._id
    })
    if(!fromUserAccount){
        throw new ApiError(400,"System user account not found")
    }

    const session=await mongoose.startSession();
    session.startTransaction();

    const transaction=new Transaction({
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING",
    })

    const debitLedgerEntry=await Ledger.create([{
        account:fromUserAccount,
        amount,
        transaction:transaction._id,
        type:"DEBIT",
    }],{session})
    const creditLedgerEntry=await Ledger.create([{
        account:toUserAccount,
        amount,
        transaction:transaction._id,
        type:"CREDIT",
    }],{session})

    transaction.status="COMPLETED"
    await transaction.save({session})

    await session.commitTransaction();
    session.endSession()

    return res.status(201)
    .json(new ApiResponse(201,transaction,"Initial funds transaction completed succesfully")
    )
})

export {createTransaction,createInitialFundsTransaction}