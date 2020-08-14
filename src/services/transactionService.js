/**
 * TransactionService object.
 * handles business logic relating to TransactionModel
 */
const { TransactionModel } = require("../models/transaction");

const TransactionService = {

	async findtransaction(userId, transactionId) {
		try {
			const transaction = await TransactionModel.findOne({
				userId,
				transactionId,
			})
				.populate({ path: "userId", select: "name email" })
				.populate({ path: "meta.receiverId", select: "name email" })
				.populate({ path: "meta.senderId", select: "name email" });

			return transaction;
		} catch (error) {
			throw error;
		}
	},


	async getUsertransactions(userId, query) {
		try {
			const transactions = await TransactionModel.find({
				userId,
				status: {
					$in: query.status,
				},
				createdAt: {
					$gte: new Date(query.startDate),
					$lt: new Date(query.endDate),
				},
			}).sort({ createdAt: -1 });

			return transactions;
		} catch (error) {
			throw error;
		}
	}
};

module.exports = TransactionService;
