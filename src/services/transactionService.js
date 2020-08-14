/**
 * TransactionService object.
 * handles business logic relating to TransactionModel
 */
const { TransactionModel } = require("../models/transaction");

const TransactionService = {
	async getAllUserTransactions(userId) {
		try {
			const transactions = await TransactionModel.find({ userId });
			return transactions;
		} catch (error) {
			throw error;
		}
    },
    
	async getTransactionById(id) {
		try {
			const transaction = await TransactionModel.findOneById(id);
			return transaction;
		} catch (error) {
			throw error;
		}
	},
};

module.exports = TransactionService;
