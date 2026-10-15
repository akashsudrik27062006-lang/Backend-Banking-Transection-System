import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:[true,"Name is required for creating an account"],
        },
        email:{
            type:String,
            required:[true,"Email is required for creating a user"],
            trim:true,
            lowercase:true,
            match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Invalid Email address"],
            unique:[true,"Email already exists"]
        },
        password:{
            type:String,
            required:[true,"Password is required for creating an account"],
            minlength:[6,"Password should contain more than 6 chaaracters"],
        },
        refreshToken:{
            type:String
        }
    },
    {timestamps:true}
)

userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            name:this.name,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            name:this.name,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema)