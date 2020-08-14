const { Router } = require("express");
const TransactionController = require("../controllers/TransactionController");
const { authToken, authUser } = require("../middlewares/Auth");
// const { cachedTransaction, cachedTransactions, cachedUserTransactions } from "../middlewares/Cache";

const router = Router();

router.get("/history", authToken, authUser, cachedUserTransactions, TransactionController.getTransactions);
router.get("/:id", authToken, authUser, TransactionController.getTransaction);

module.exports = router;
