import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Account } from "../models/account.models.js";

const createAccountController=asyncHandler(async (req,res)=>{
    const user=req.user;
    if(!user){
        throw new ApiError(401,"Unauthorized access");
    }  

    const account=await Account.create({
        user:user._id,
    })
    if(!account){
        throw new ApiError(500,"Failed to create account");
    }

    return res.status(201)
    .json(new ApiResponse(  
        201,account,"Account created succesfully"
    ))
})

const getUserAccounts=asyncHandler(async(req,res)=>{
    const accounts=await Account.find({user:req.user._id})
    return res.status(200)
    .json(new ApiResponse(200,accounts,"User all accounts fetched succesfully"))
})

const getAccountBalance=asyncHandler(async(req,res)=>{
    const {accountId}=req.params
    if(!accountId){
        throw new ApiError(400,"accountId missing")
    }

    const account=await Account.findOne({
        _id:accountId,
        user:req.user._id
    })
    if(!account){
        throw new ApiError(404,"Account not found");
    }

    const accountBalance=await account.getBalance();

    return res.status(200)
    .json(new ApiResponse(200,accountBalance,"Account balance fetched succesfully"));
})

export {createAccountController,getUserAccounts,getAccountBalance}