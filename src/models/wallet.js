const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { config } = require("../config/config");
const Float = require("mongoose-float").loadType(mongoose);

const walletSchema = mongoose.Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "users",
		},
		availableBalance: {
			type: Float,
			default: 0.0
		},
		active: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		}
	},
	{
		timestamps: true,
	}
);

exports.WalletModel = mongoose.model(config.mongodb.collections.wallet, walletSchema);
