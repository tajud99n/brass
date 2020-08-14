/**
 * UserService object.
 * handles business logic relating to UserModel
 */
const { UserModel } = require("../models/user");

const UserService = {
	async createUser(data) {
		try {
			const user = new UserModel(data);

			await user.save();

			return user;
		} catch (error) {
			throw error;
		}
	},

	async checkIfUserExist(id) {
		try {
			const user = await UserModel.findOne({ _id: id, isDeleted: false });
			return user;
		} catch (error) {
			throw error;
		}
	},

	async getUserByEmail(email) {
		try {
			const user = await UserModel.findOne({ email: email, isDeleted: false });
			return user;
		} catch (error) {
			throw error;
		}
	},

	async getUserByAccountId(accountId) {
		try {
			const user = await UserModel.findOne({ accountId });
			return user;
		} catch (error) {
			throw error;
		}
	}
};

module.exports = UserService;
