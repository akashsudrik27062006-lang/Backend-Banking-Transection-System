import { Router } from "express"
import {verifyJWT} from "../middleware/auth.middleware.js"
import { createTransaction } from "../controller/transaction.controller.js"

const router=Router();

router.route("/create-transaction").post(verifyJWT,createTransaction);

export default router