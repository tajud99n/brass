/**
 * load in environmental variables using dotenv
 * declare environmental variable in config object
 */
const dotenv = require("dotenv");
dotenv.config();

exports.config = {
	appName: "pay",
	environment: process.env.NODE_ENV || "development",
	port: Number(process.env.PORT),
	jwt: {
		SECRETKEY: process.env.JWT_SECRET_KEY,
		expires: Number(process.env.JWT_EXPIRY),
		issuer: process.env.ISSUER,
		alg: process.env.JWT_ALG,
	},
	mongodb: {
		uri: process.env.MONGO_DB_URI,
		testUri: process.env.MONGO_DB_TEST,
		collections: {
			user: "user",
			transaction: "transaction",
			wallet: "wallet",
		},
	},
	salt: Number(process.env.SALT_ROUND),
	redis: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT)
	}
};
