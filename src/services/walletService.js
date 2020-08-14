/**
 * WalletService object.
 * handles business logic relating to WalletModel
 */
const { WalletModel } = require("../models/wallet");

const WalletService = {
	async createWallet(data) {
		try {
			const wallet = new WalletModel(data);

			await wallet.save();

			return wallet;
		} catch (error) {
			throw error;
		}
	},

	async getUserWallet(id) {
		try {
			const wallet = await WalletModel.findOne({ userId: id, isDeleted: false });
			return wallet;
		} catch (error) {
			throw error;
		}
	},

};

module.exports = WalletService;
