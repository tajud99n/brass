const httpCodes = require("http-status-codes");
const TransactionService = require("../services/transactionService");
const { http_responder } = require("../utils/http_response");
const { logger } = require("../config/logger");
const utils = require("../utils/utils");

/**
 * getTransaction
 * @desc get the details of a transaction
 * Route: GET: '/api/v1/transactions/:transactionId'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.getTransaction = async(req, res) => {
	try {
		const transactionId = req.params.id;
		const userId = req.user._id;
		
		const transaction = await TransactionService.findtransaction(userId, transactionId);

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
 * getTransactions
 * @desc get the details of all transactions
 * Route: GET: '/api/v1/transactions'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.getTransactions = async(req, res) => {
	try {
		const userId = req.user._id;
		const defaultStartDate = new Date("1970-01-01").toISOString();
		const defaultEndDate = new Date().toISOString();
		const { limit, page } = req.query;
		const query = {
			startDate: req.query.startDate ? new Date(req.query.startDate).toISOString() : defaultStartDate,
			endDate: req.query.endDate ? new Date(req.query.endDate).toISOString() : defaultEndDate,
			status: req.query.status ? [req.query.status] : ["COMPLETED", "PENDING", "FAILED"]
		}
		
		const transactions  = await TransactionService.getUserTransactions(userId, query);

		if (!transactions.length) {
			return http_responder.errorResponse(res, "no transactions found", httpCodes.NOT_FOUND);
		}
		const status = req.query.status ? req.query.status : "all";
		
		redisClient.setex(`${userId}:${status}`, 3600, JSON.stringify(transactions));
		const result = await utils.paginator(transactions, limit, page);
        

		return http_responder.successResponse(res, result, "transactions found", httpCodes.OK);

	} catch (error) {
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}
