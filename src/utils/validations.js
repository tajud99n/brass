const Joi = require("joi");

exports.CredentialSchema = Joi.object({
	email: Joi.string().required().lowercase().email(),
	password: Joi.string().required().min(6),
});

exports.CreateUserSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().required().email(),
	password: Joi.string().required().min(5),
});

exports.transferValidation = Joi.object({
	amount: Joi.number().integer().min(1).required(),
	recipientId: Joi.string().required(),
});
