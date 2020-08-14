const httpCodes = require("http-status-codes");
const TransactionService = require("../services/transactionService");
const { http_responder } = require("../utils/http_response");
const { logger } = require("../config/logger");

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
	} catch (error) {
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}
