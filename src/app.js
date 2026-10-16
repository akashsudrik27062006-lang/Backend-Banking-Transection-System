import express from "express"
import mongoose from 'mongoose';
import cookieParser from "cookie-parser";
import authRouter from "../routes/auth.routes.js";
import accountRouter from "../routes/account.routes.js"
import transectionRouter from "../routes/transaction.routes.js"

const app=express();

app.use(express.json());
app.use(cookieParser())

//routes

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running");
});

app.use("/api/auth",authRouter);
app.use("/api/account",accountRouter)
app.use("/api/transaction",transectionRouter);

export default app