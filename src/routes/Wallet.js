const { Router } = require("express");
const WalletController = require("../controllers/WalletController");
const { authToken, authUser } = require("../middlewares/Auth");

const router = Router();

router.get("/:id", authToken, authUser, WalletController.getWallet);

module.exports = router;
