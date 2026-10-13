import express from "express"
import { Router } from "express"
import {registerUser} from "../controller/auth.controller.js"
import { loginUser } from "../controller/auth.controller.js";

const router=Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

export default router