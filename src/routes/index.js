const express = require("express");
const { authToken, authUser } = require("../middlewares/Auth");
const { loginUser } = require("../controllers/AuthController");
const { newUser } = require("../controllers/UserController");
const { creditTransfer, fundWallet } = require("../controllers/WalletController");
const { http_responder } = require("../utils/http_response");

// Init router and path
const router = express.Router();

router.use("/health", (req, res) => {
	const message = "pay Server is up & Running";
	return http_responder.successResponse(res, [], message);
});

// Add sub-routes

router.post("/login", loginUser);
router.post("/register", newUser);
router.post("/transfer", authToken, authUser, creditTransfer);
router.post("/fund", authToken, authUser, fundWallet);

// Export the base-router
module.exports = router;
