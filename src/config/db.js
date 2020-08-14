/**
 * Setup mongodb connection using mongoose.
 */
const mongoose = require("mongoose");
const { config } = require("./config");
const { logger } = require("./logger");

const URI =
	config.environment === "test" ? config.mongodb.testUri : config.mongodb.uri;

exports.connectDB = async () => {
	try {
		await mongoose.connect(URI, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		});

		logger.info("MongoDB Connected...");
	} catch (err) {
		logger.error(err.message);
		// Exit process with failure
		process.exit(1);
	}
};
