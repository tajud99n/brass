/**
 * http_responder object.
 * to manage reponse for all incoming request
 *
 */
const { OK, INTERNAL_SERVER_ERROR } = require("http-status-codes");

const http_responder = {
	async errorResponse(res, message = "",statusCode = INTERNAL_SERVER_ERROR) {
		return res.status(statusCode).send({
			error: true,
			code: statusCode,
			message,
		});
	},

	async successResponse(res, data = {}, message = "", statusCode = OK) {
		return res.status(statusCode).send({
			error: false,
			code: statusCode,
			message,
			data,
		});
	},
};

module.exports = { http_responder };
