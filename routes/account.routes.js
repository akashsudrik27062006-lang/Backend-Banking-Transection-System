import { Router } from "express"
import { createAccountController } from "../controller/account.controller.js";
import {verifyJWT} from "../middleware/auth.middleware.js"

const router=Router();

router.route("/create-account").post(verifyJWT,createAccountController)

export default router;