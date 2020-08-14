const httpCodes = require("http-status-codes");
const UserService = require("../services/userService");
const WalletService = require("../services/walletService");
const { http_responder } = require("../utils/http_response");
const { CreateUserSchema } = require("../utils/validations");
const utils = require("../utils/utils");
const { logger } = require("../config/logger");

/**
 * newUser
 * @desc A new user should be created
 * Route: POST: '/api/v1/register'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.newUser = async(req, res) => {
	try {
		// validate request object
		const errors = await utils.validateRequest(req.body, CreateUserSchema);
		if (errors) {
			return http_responder.errorResponse(res, errors, httpCodes.BAD_REQUEST);
		}
		const { name, email, password } = req.body;

		// check if user exists
		const existingUser = await UserService.getUserByEmail(email.toLowerCase());
		if (existingUser) {
			const errMessage = "User already exists";
			return http_responder.errorResponse(
				res,
				errMessage,
				httpCodes.BAD_REQUEST
			);
		}

		const accountId = await utils.generateAccountNumber();
		const userObject = {
			name: name.toLowerCase(),
			email: email.toLowerCase(),
			password: password,
			accountId
		};

		// create user
		const user = await UserService.createUser(userObject);

		const walletObject = {
			userId: user._id,
		};

        const wallet = await WalletService.createWallet(walletObject);

		// * create token
		const token = user.generateAuthToken();

		const message = "User created successfully";
		// * return newly created user
		return http_responder.successResponse(
			res,
			{ user, token },
			message,
			httpCodes.CREATED
		);
	} catch (error) {
		logger.error(JSON.stringify(error));
		console.log(error.message);
		return http_responder.errorResponse(
			res,
			"Server Error",
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}
