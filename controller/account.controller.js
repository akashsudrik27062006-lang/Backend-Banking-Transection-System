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

export {createAccountController}