/**
 * Setup redis connection.
 *
 */
const redis = require("redis");
const { config } = require("./config");
const { logger } = require("./logger");

const redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on("connect", function () {
	logger.info("Connection to redis has been established successfully.");
});

redisClient.on("error", function () {
	logger.error("Unable to connect to the redis instance");
	process.exit(1);
});
export default redisClient;
