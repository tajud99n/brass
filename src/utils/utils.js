/**
 * Utils object.
 * contains various helper function
 */
const { config } = require("../config/config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const Utils = {
	async hashPassword(password) {
		const salt = await bcrypt.genSalt(config.salt);
		const hash = await bcrypt.hash(password, salt);
		return hash;
	},

	async validatePassword(password, passwordHash) {
		const isMatch = await bcrypt.compare(password, passwordHash);
		if (!isMatch) {
			return false;
		}
		return true;
	},

	verifyToken(token) {
		try {
			const decoded = jwt.verify(token, config.jwt.SECRETKEY, {
				subject: config.appName,
				algorithms: [config.jwt.alg],
				issuer: config.jwt.issuer,
			});
			return decoded;
		} catch (error) {
			throw new Error("Invalid Token");
		}
	},

	async validateRequest(requestBody, validationSchema) {
		const errors = validationSchema.validate(requestBody);

		if (errors.error) {
			return errors.error.details[0].message;
		}
	},

	async paginator(dataArray, limit = 10, page = 1) {
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const data = {};

		if (endIndex < dataArray.length) {
			data.next = {
				page: page + 1,
				limit: limit,
			};
		}

		if (startIndex > 0) {
			data.previous = {
				page: page - 1,
				limit: limit,
			};
		}
		data.result = dataArray.slice(startIndex, endIndex);
		data.count = dataArray.length;

		return data;
	},
	async generateAccountNumber() {
		const prefix = "A";
		let suffix = uuidv4().toString().toUpperCase().substring(0, 8);
		return prefix.concat(suffix);
	},
};

module.exports = Utils;
