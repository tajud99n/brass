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
const {  TransactionModel} = require("../models/transaction");

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
		const { amount } = req.body;
		if (!amount || !parseFloat(amount) || amount < 1) {
			return http_responder.errorResponse(res, "amount is required, must be a number and it must be greater than 0", httpCodes.BAD_REQUEST);
		}
		const userWallet = await WalletService.getUserWallet(userId);

		const tx = new TransactionModel({
			userId: userId,
			amount,
			availableBalance: userWallet.availableBalance + amount,
			previousBalance: userWallet.availableBalance,
			type: "CREDIT",
			meta: {
				purpose: "FUND",
			},
			walletId: userWallet._id,
			status: "COMPLETED",
		});

		new Fawn.Task()
			.save("transactions", tx)
			.update("wallets", { _id: userWallet._id }, { $inc: { availableBalance: amount }})
			.run();
		
		return http_responder.successResponse(
			res,
			{ tx },
			"Account successfully credited",
			httpCodes.CREATED
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
