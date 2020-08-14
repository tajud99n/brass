/**
 * Setup the winston logger.
 *
 * Documentation: https://github.com/winstonjs/winston
 */
const { config } = require("./config");
const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

// Import Functions
const { File, Console } = transports;

// Init Logger
const wintstonLogger = createLogger({
	level: "info",
});

/**
 * For production write to all logs with level `info` and below
 * to `info.log. Write all logs error (and below) to `error.log`.
 * For development, print to the console.
 */
if (config.environment === "production") {
	const fileFormat = format.combine(format.timestamp(), format.json());
	const errTransport = new File({
		filename: "./logs/error.log",
		format: fileFormat,
		level: "error",
	});
	const infoTransport = new File({
		filename: "./logs/info.log",
		format: fileFormat,
	});
	wintstonLogger.add(errTransport);
	wintstonLogger.add(infoTransport);
} else {
	const errorStackFormat = format((info) => {
		if (info.stack) {
			console.log(info.stack);
			return false;
		}
		return info;
	});
	const consoleTransport = new Console({
		format: format.combine(
			format.colorize(),
			format.simple(),
			errorStackFormat()
		),
	});
	wintstonLogger.add(consoleTransport);
}

// Export logger
exports.logger = wintstonLogger;
