import { Router } from "express"
import {verifyJWT} from "../middleware/auth.middleware.js"
import { verifySystemUserJWT } from "../middleware/auth.middleware.js";
import { createTransaction } from "../controller/transaction.controller.js"
import { createInitialFundsTransaction } from "../controller/transaction.controller.js"


const router=Router();

router.route("/create-transaction").post(verifyJWT,createTransaction);
router.route("/system/create-initialFunds").post(verifySystemUserJWT,createInitialFundsTransaction);

export default router