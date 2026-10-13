import express from "express"
import mongoose from 'mongoose';
import cookieParser from "cookie-parser";

const app=express();
app.use(cookieParser())

export default app