const mongoose = require('mongoose');
const { config } = require("../config/config");
const jwt = require("jsonwebtoken");
const utils = require("../utils/utils");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			minlength: 5,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			minlength: 5,
			trim: true,
			unique: true,
        },
        accountId: {
            type: String,
			trim: true,
        },
		password: {
			type: String,
			require: true,
			minlength: 6,
			trim: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.methods.toJSON = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj._id;
	return obj;
};

userSchema.pre("save", async function (next) {
	const user = this;

	if (user.isModified("password")) {
		const hashed = await utils.hashPassword(user.get("password"));
		user.set("password", hashed);
    }
    
	next();
});

userSchema.methods.generateAuthToken = function () {
	const tokenData = {
		id: this._id,
	};
	const token = jwt.sign(tokenData, config.jwt.SECRETKEY, {
		subject: config.appName,
		algorithm: config.jwt.alg,
		expiresIn: config.jwt.expires,
		issuer: config.jwt.issuer,
	});
	return token;
};

exports.UserModel = mongoose.model(config.mongodb.collections.user, userSchema);