import dotenv from "dotenv"
dotenv.config();
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { ApiResponse } from "../utils/ApiResponse.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized access");
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        if (!decodedToken) {
            throw new ApiError(401, "Invalid access token");
        }

        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const verifySystemUserJWT=asyncHandler(async(req,res,next)=>{
    const token = req.cookies.accessToken   ||  req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
        throw new ApiError(401,"Unauthorized access, token is missing")
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decoded._id).select("+systemUser")
        if(!user){
            throw new ApiError(401,"User not found")
        }
        if (!user.systemUser) {
            return res.status(403)
            .json(new ApiResponse(403,null,"Forbidden access, not a system user"))
        }

        req.user = user

        return next()
    }
    catch (err) {
        return res.status(401)
        .json(new ApiResponse(401,null,"Unauthorized access, token is invalid"))
    }
})