const UserService = require("../services/UserService");
const httpCodes = require("http-status-codes");
const { logger } = require("../config/logger");
const { http_responder } = require("../utils/http_response");
const { CredentialSchema } = require("../utils/validations");
const Utils = require("../utils/utils");

/**
 * loginUser
 * @desc As a user with correct credentials you should be able login
 * Route: POST: '/api/v1/login'
 * @param {Object} req request object
 * @param {Object} res response object
 * @returns {void|Object} object
 */
exports.loginUser = async(req, res) => {
	try {
		const errors = await Utils.validateRequest(req.body, CredentialSchema);
		if (errors) {
			return http_responder.errorResponse(res, errors, httpCodes.BAD_REQUEST);
		}

		// check if user exists
		const email = req.body.email.toLowerCase();

		const user = await UserService.getUserByEmail(email);
		if (!user) {
			const errMessage = "Invalid login credentials";
			return http_responder.errorResponse(res, errMessage, httpCodes.NOT_FOUND);
		}

		// verify password and generate token
		const passwordMatch = await Utils.validatePassword(
			req.body.password,
			user.password
		);
		if (!passwordMatch) {
			const errMessage = "Invalid login credentials";
			return http_responder.errorResponse(
				res,
				errMessage,
				httpCodes.UNAUTHORIZED
			);
		}
		const token = user.generateAuthToken();

		const message = "User login successful";
		return http_responder.successResponse(
			res,
			{ user, token },
			message,
			httpCodes.OK
		);
	} catch (error) {
		logger.error(JSON.stringify(error));
		return http_responder.errorResponse(
			res,
			error.message,
			httpCodes.INTERNAL_SERVER_ERROR
		);
	}
}
