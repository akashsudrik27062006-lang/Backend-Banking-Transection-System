import { Router } from "express"
import { createAccountController,getUserAccounts,getAccountBalance } from "../controller/account.controller.js";
import {verifyJWT} from "../middleware/auth.middleware.js"

const router=Router();

router.route("/create-account").post(verifyJWT,createAccountController)
router.route("/get-userAccounts").get(verifyJWT,getUserAccounts)
router.route("/get-accountBalance/:accountId").get(verifyJWT,getAccountBalance)
export default router;