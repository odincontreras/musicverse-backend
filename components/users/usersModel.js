const mongoose = require("mongoose");
const { Schema } = mongoose;

const usersSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		uploadedTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
	},
	{ collection: "users" }
);

module.exports = mongoose.model("User", usersSchema);
