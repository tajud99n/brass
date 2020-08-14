const httpCodes = require("http-status-codes");
const WalletService = require("../services/walletService");
const { http_responder } = require("../utils/http_response");
const { logger } = require("../config/logger");
const mongoose = require("mongoose");
const Fawn = require("fawn");
const UserService = require("../services/userService");
const { transferValidation } = require("../utils/validations");
const utils = require("../utils/utils");
Fawn.init(mongoose);
const { TransactionModel } = require("../models/transaction");

/**
 * getWallet
 * @desc get the details of a wallet
 * Route: GET: '/api/v1/wallets/:walletId'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.getWallet = async(req, res) => {
	try {
		const transactionId = req.params.id;
		const userId = req.user._id;
		
		const transaction = await TransactionService.findTicket(userId, transactionId);

		if (!transaction) {
			return http_responder.errorResponse(res, "transaction not found", httpCodes.NOT_FOUND);
		}

        redisClient.setex(`${transaction.transactionId}`, 3600, JSON.stringify(transaction));

		return http_responder.successResponse(res, { transaction }, "transaction found", httpCodes.OK);
	} catch (error) {
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}

/**
 * fundWallet
 * @desc update(increment) the available balance of a wallet
 * Route: PUT: '/api/v1/fund'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.fundWallet = async(req, res) => {
	try {
		const userId = req.user._id;
		const { amount,
			expiryMonth,
			accountNumber,
			expiryYear,
			birthday,
			bankCode,
			cvv,
			cardNumber,
			fundType, } = req.body;
	
		
		if (!amount || !parseFloat(amount) || amount < 1) {
			return http_responder.errorResponse(res, "amount is required, must be a number and it must be greater than 0", httpCodes.BAD_REQUEST);
		}
		const userWallet = await WalletService.getUserWallet(userId);
		if (!userWallet) {
			return http_responder.errorResponse(res, "no user wallet", httpCodes.BAD_REQUEST);
		}
		const paymentDetails = (fundType.toLowerCase().trim() === "card") ? [cvv, cardNumber, expiryMonth, expiryYear] : [bankCode, accountNumber, birthday];
		const paymentData = await processCreditPayment(req.user, amount, fundType, paymentDetails);

		const tx = new TransactionModel({
			userId: userId,
			amount,
			type: "CREDIT",
			previousBalance: userWallet.availableBalance,
			meta: {
				purpose: "FUND",
				proccessor: "paystack",
				ref: paymentData.data.reference
			},
			channel: fundType.toLowerCase().trim(),
			walletId: userWallet._id,
		});

		if (paymentData.status === "success") {
			tx.status = "COMPLETED";
			tx.availableBalance = userWallet.availableBalance + amount;
			
			new Fawn.Task()
				.save("transactions", tx)
				.update("wallets", { _id: userWallet._id }, { $inc: { availableBalance: amount } })
				.run();
		} else {
			tx.status = "PENDING";
			tx.availableBalance = userWallet.availableBalance;
			tx.save();
		} 
		return http_responder.successResponse(
			res,
			{ tx },
			"Account successfully credited",
			httpCodes.OK
		);

	} catch (error) {
		console.log(error)
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}

/**
 * withdrawWallet
 * @desc update(deduction) the available balance of a wallet
 * Route: PUT: '/api/v1/withdraw'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.withdrawWallet = async(req, res) => {
	try {
		const userId = req.user._id;
		const { ammount, accountNumber, bankCode, fullName, comment } = req.body;

		if (!amount || !parseFloat(amount) || amount < 1) {
			return http_responder.errorResponse(
				res,
				"amount is required, must be a number and it must be greater than 0",
				httpCodes.BAD_REQUEST
			);
		}
		const userWallet = await WalletService.getUserWallet(userId);
		if (!userWallet) {
			return http_responder.errorResponse(
				res,
				"no user wallet",
				httpCodes.BAD_REQUEST
			);
		}
		if (amount > wallet.availableBalance)
			return http_responder.errorResponse(
				res,
				"insufficient balance",
				httpCodes.BAD_REQUEST
			);

		const createRecipientData = {
			type: "nuban",
			currency: "NGN",
			account_number: accountNumber,
			name: fullName,
			bank_code: bankCode,
			description: comment,
		};

		const createRecipient = await axios.post(
			createRecipientURL,
			createRecipientData,
			{ headers: { Authorization: `Bearer ${payToken}` } }
		);
		if (!createRecipient)
			return http_responder.errorResponse(
				res,
				"unable to create transfer profile",
				httpCodes.BAD_REQUEST
			);
	
		const transferData = {
			source: "balance",
			reason: comment,
			amount,
			recipient: createRecipient.data.data.recipient_code,
		};


		const initiateTransfer = await transfer(transferData);
		if (initiateTransfer.status === false)
			return http_responder.errorResponse(
				res,
				error.message,
				httpCodes.BAD_REQUEST
			);

		const tx = new Transaction({
			userId,
			amount,
			previousBalance: userWallet.availableBalance
			type: "DEBIT",
		})
	} catch (error) {
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}

/**
 * creditTransfer
 * @desc transfer certain amount from the available balance of a user's wallet to another user's wallet
 * Route: PUT: '/api/v1/transfer'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.creditTransfer = async (req, res) => {
	try {
		const userId = req.user._id;
		const errors = await utils.validateRequest(req.body, transferValidation);
		if (errors) {
			return http_responder.errorResponse(res, errors, httpCodes.BAD_REQUEST);
		}
		const { amount, recipientId, comment } = req.body;

		if (recipientId == req.user.accountId) {
			return http_responder.errorResponse(res, "recipient must be a different user", httpCodes.BAD_REQUEST);
		}

		const receiver = await UserService.getUserByAccountId(recipientId);
		const senderWallet = await WalletService.getUserWallet(userId);
		if (amount > senderWallet.availableBalance) {
			return http_responder.errorResponse(
				res,
				"Insufficient balance",
				httpCodes.BAD_REQUEST
			);
		}
		const receiverWallet = await WalletService.getUserWallet(receiver._id);
		if (!receiver) {
			return http_responder.errorResponse(
				res,
				"Invalid recipient",
				httpCodes.BAD_REQUEST
			);
		}

		const tx = {
			userId,
			amount,
			availableBalance: senderWallet.availableBalance - amount,
			previousBalance: senderWallet.availableBalance,
			type: "DEBIT",
			meta: {
				comment,
				purpose: "TRANSFER",
				receiverId: receiver._id,
			},
			walletId: senderWallet._id,
			status: "COMPLETED",
		};
		const creditTx = {
			userId: receiver._id,
			amount,
			availableBalance: receiverWallet.availableBalance + amount,
			previousBalance: receiverWallet.availableBalance,
			type: "CREDIT",
			meta: {
				purpose: "TRANSFER",
				senderId: receiver._id
			},
			walletId: receiverWallet._id,
			status: "COMPLETED"
		}
		
		await new Fawn.Task()
			.save("transactions", tx)
			.save("transactions", creditTx)
			.update(
				"wallets",
				{ _id: senderWallet._id },
				{
					$inc: { availableBalance: -amount },
				}
			)
			.update(
				"wallets",
				{ _id: receiverWallet._id },
				{
					$inc: { availableBalance: amount },
				}
			)
			.run();
		return http_responder.successResponse(
			res,
			{ tx },
			"transfer successfully completed",
			httpCodes.CREATED
		);
	} catch (error) {
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
};

const processCreditPayment = async (user, amount, fundType, paymentDetails) => {
	try {
		if (fundType.toLowerCase().trim() === "card") {
			const fundObj = {
				email: user.email,
				amount: amount.toString(),
				card: {
					cvv: paymentDetails[0].toString(),
					number: paymentDetails[1].toString(),
					expiry_month: paymentDetails[2].toString(),
					expiry_year: paymentDetails[3].toString(),
				},
			};
			const fund = await axios.post(fundUrl, fundObj, {
				headers: { Authorization: `Bearer ${payToken}` },
			});
			// fund.data.data.status can be success, send_pin, open_url, failed
			return { status: fund.data.data.status, data: fund.data.data };
		} else if (fundType.toLowerCase().trim() === "bank") {
			const fundObj = {
				email: user.email,
				amount: amount.toString(),
				bank: {
					code: paymentDetails[0].toString(),
					account_number: paymentDetails[1].toString(),
				},
				birthday: paymentDetails[2].toString(),
			};
			const fund = await axios.post(fundUrl, fundObj, {
				headers: { Authorization: `Bearer ${payToken}` },
			});
			// fund.data.data.status can be success, send_birthday, send_otp
			return { status: fund.data.data.status, data: fund.data.data };
		} else {
			return { data: "transaction type is not sent", status: null };
		}
	} catch (error) {
		console.error(error.response);
		return {
			data: error.response.data.data,
			message: error.response.data.message,
			status: error.response.data.status,
		};
	}
};

const withdrawFromWallet = async (req, res) => {
	try {
		const { id } = req.decoded;
		const user = await FindUser.isUserFound(req, res);
		if (user.data === null)
			return res.status(400).send(Response.error(400, "user not found"));
		const { accountNumber, bankCode, fullName, description } = req.body;
		let { amount } = req.body;
		amount *= 100;
		let wallet = await Wallet.findOne({ userId: id });
		if (!wallet)
			return res.status(400).send(Response.error(400, "wallet not found"));
		if (amount > wallet.availableBalance)
			return res
				.status(400)
				.send(Response.error(400, "amount is greater than available balance"));
		const createRecipientData = {
			type: "nuban",
			currency: "NGN",
			account_number: accountNumber,
			name: fullName,
			bank_code: bankCode,
			description,
		};
		const createRecipient = await axios.post(
			createRecipientURL,
			createRecipientData,
			{ headers: { Authorization: `Bearer ${payToken}` } }
		);
		if (!createRecipient)
			return res
				.status(400)
				.send(Response.error(400, "unable to create transfer profile"));

		const transferData = {
			source: "balance",
			reason: description,
			amount,
			recipient: createRecipient.data.data.recipient_code,
		};
		const initiateTransfer = await transfer(transferData);
		if (initiateTransfer.status === false)
			return res.status(400).send(
				Response.error(400, {
					message: initiateTransfer.message,
				})
			);
		const transaction = new Transaction();
		if (initiateTransfer.status === "success") {
			let wallet = await Wallet.findOneAndUpdate(
				{ userId: id },
				{ $inc: { availableBalance: -amount } },
				{ new: true }
			);
			transaction.meta.comment = `Transfer was successful`;
			transaction.amount = amount;
			transaction.availableBalance = wallet.availableBalance;
			transaction.status = "COMPLETED";
			transaction.channel = "APP";
			transaction.userType = user.data.userType;
			transaction.userId = id;
			transaction.type = "DEBIT";
			await transaction.save();
			wallet = JSON.parse(JSON.stringify(wallet));
			wallet.availableBalance /= 100;
			const data = { transactionId: transaction._id, wallet };
			return res
				.status(200)
				.send(Response.success(200, `Transfer was successful`, data));
		} else if (initiateTransfer.status === "otp") {
			transaction.meta.comment = `Transfer requires OTP to continue`;
			transaction.amount = amount;
			transaction.availableBalance = wallet.availableBalance;
			transaction.status = "PENDING";
			transaction.channel = "APP";
			transaction.userType = user.data.userType;
			transaction.userId = id;
			transaction.type = "DEBIT";
			await transaction.save();
			wallet = JSON.parse(JSON.stringify(wallet));
			wallet.availableBalance /= 100;
			const data = { transactionId: transaction._id, wallet };
			return res
				.status(200)
				.send(
					Response.success(
						200,
						`Transfer requires OTP to confirm payment`,
						data
					)
				);
		} else if (
			initiateTransfer.status === "pending" ||
			initiateTransfer.status === "failed"
		) {
			const response =
				initiateTransfer.status === "pending"
					? `Transfer has been queued`
					: `Transfer failed, kindly try again`;
			transaction.meta.comment = `Transfer has been queued`;
			transaction.amount = amount;
			transaction.availableBalance = wallet.availableBalance;
			transaction.status = "PENDING";
			transaction.channel = "APP";
			transaction.userType = user.data.userType;
			transaction.userId = id;
			transaction.type = "DEBIT";
			await transaction.save();
			wallet = JSON.parse(JSON.stringify(wallet));
			wallet.availableBalance /= 100;
			const data = { transactionId: transaction._id, wallet };
			return res.status(200).send(Response.success(200, response, data));
		}
	} catch (error) {
		console.error(error);
		return res.status(500).send(Response.error(500, "Internal server error"));
	}
};

const transfer = async (transferData) => {
	try {
		const result = await axios.post(transferURL, transferData, {
			headers: { Authorization: `Bearer ${payToken}` },
		});
		return {
			status: result.data.data.status,
			message: result.data.data.message,
			data: result.data.data,
		};
	} catch (error) {
		console.error(error.response);
		return {
			data: error.response.data.data,
			message: error.response.data.message,
			status: error.response.data.status,
		};
	}
};