import { Router } from "express"
import {logoutUser, registerUser} from "../controller/auth.controller.js"
import { loginUser } from "../controller/auth.controller.js";

const router=Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);

export default router