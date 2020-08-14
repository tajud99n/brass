const mongoose = require("mongoose");
const Float = require("mongoose-float").loadType(mongoose);
const { Schema } = require("mongoose");
const { config } = require("../config/config");

const transactionsSchema = new mongoose.Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "users",
		},
		amount: {
			type: Float,
			required: true,
		},
		availableBalance: {
			type: Float,
			required: true,
		},
		previousBalance: {
			type: Float,
			required: true,
		},
		type: {
			type: String,
			enum: ["DEBIT", "CREDIT"],
			default: null,
		},
		meta: {
			comment: { type: String },
			accountNumber: { type: String },
			accountName: { type: String },
			bankCode: { type: String },
			purpose: {
				type: String,
				enum: ["FUND", "WITHDRAW", "TRANSFER"],
				default: null,
			},
			receiverId: {
				type: Schema.Types.ObjectId,
				ref: "users",
			},
			senderId: {
				type: Schema.Types.ObjectId,
				ref: "users",
			},
		},
		walletId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "wallets",
		},
		status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"] },
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);


exports.TransactionModel = mongoose.model(config.mongodb.collections.transaction, transactionsSchema);
