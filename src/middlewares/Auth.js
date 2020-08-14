const httpCodes = require("http-status-codes");
const { http_responder } = require("../utils/http_response");
const Utils = require("../utils/utils");
const UserService = require("../services/userService");

/**
 * authToken
 * @desc A middleware to authenticate users token
 * @param {Object} req request any
 * @param {Object} res response object
 * @param {Function} next nextFunction middleware
 * @returns {void|Object} object
 */
exports.authToken = (req, res, next) => {
	const bearerToken = req.headers["authorization"];
	if (!bearerToken) {
		const errMessage = "Access denied. No token provided.";

		return http_responder.errorResponse(
			res,
			errMessage,
			httpCodes.UNAUTHORIZED
		);
	}
	const token = bearerToken.split(" ")[1];
	// Verify token
	try {
		const decoded = Utils.verifyToken(token);

		req.id = decoded.id;
		next();
	} catch (err) {
		const errMessage = "Invalid token. Please login";
		return http_responder.errorResponse(
			res,
			errMessage,
			httpCodes.UNAUTHORIZED
		);
	}
};

/**
 * authUser
 * @desc A middleware to authenticate users
 * @param {Object} req request any
 * @param {Object} res response object
 * @param {Function} next nextFunction middleware
 * @returns {void|Object} object
 */
exports.authUser = async (req, res, next) => {
	try {
		const user = await UserService.checkIfUserExist(req.id);
		if (!user) {
			const errMessage = "Invalid token. Please login";
			return http_responder.errorResponse(
				res,
				errMessage,
				httpCodes.UNAUTHORIZED
			);
		}
		req.user = user;
		next();
	} catch (err) {
		const errMessage = "Invalid token. Please login";
		return http_responder.errorResponse(
			res,
			errMessage,
			httpCodes.UNAUTHORIZED
		);
	}
};
