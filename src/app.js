const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { NOT_FOUND, INTERNAL_SERVER_ERROR } = require("http-status-codes");
const { logger } = require("./config/logger");
const { connectDB } = require("./config/db");
// const redisClient = require("./config/redis");
const { http_responder } = require("./utils/http_response");
const BaseRouter = require("./routes");

// Init express
const app = express();

// Connect database
connectDB();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route
app.use("/api/v1", BaseRouter);

app.get("/", (req, res) => {
	return http_responder.successResponse(
		res,
		{ githubUrl: "https://github.com/tajud99n/brass.git" },
		"welcome to Brass Service"
	);
});

// handle errors
app.all("/*", (req, res) => {
	return http_responder.errorResponse(
		res,
		`${NOT_FOUND} - Not found`,
		NOT_FOUND
	);
});

app.use((err, req, res) => {
	logger.error(JSON.stringify(err.stack));
	return http_responder.errorResponse(
		res,
		err.message,
		err.status || INTERNAL_SERVER_ERROR
	);
});

module.exports = { app };
