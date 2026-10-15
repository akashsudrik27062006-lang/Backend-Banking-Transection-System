import {User} from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {sendRegistrationEmail} from "../services/email.services.js"

const registerUser=asyncHandler(async(req,res)=>{
    const {email,password,name}=req.body
    if(!email || !password || !name){
        throw new ApiError(400,"All fields are required");
    }

    const existingUser=await User.findOne({email})
    if(existingUser){
        throw new ApiError(409,"User with this email already exists");
    }

    const user=await User.create({
        name,
        email,
        password
    })
    if(!user){
        throw new ApiError(409,"Something went wrong while regestring a user");
    }

    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();

    const createdUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    await sendRegistrationEmail(user.email,user.name);

    return res.status(201)
    .cookie("Access_Token",accessToken,options)
    .cookie("Refresh_Token",refreshToken,options)
    .json(new ApiResponse(
        201,createdUser,"User regestered succesfully"
    ))
})

const loginUser=asyncHandler(async(req,res)=>{
    const {email,password}=req.body
    if(!email || !password){
        throw new ApiError(400,"All fields are required");
    }

    const user=await User.findOne({email}).select("+password");
    if(!user){
        throw new ApiError(404,"User not found");
    }

    const passwordCorrect=await user.isPasswordCorrect(password);
    if(!passwordCorrect){
        throw new ApiError(401,"Incorrect password");
    }

    const accessToken=await user.generateAccessToken();
    const refreshToken=await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
    
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(201)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        201,loggedInUser,"User loggedIn succesfully"
    ))

})

export {registerUser,loginUser}