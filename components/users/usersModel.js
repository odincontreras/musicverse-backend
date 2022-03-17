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
		avatar: {
			type: String,
		},
		verified: {
			type: Boolean,
			default: false,
		},
		confirmationToken: {
			type: String,
		},
		uploadedTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		likedTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		playlists: [{ type: Schema.Types.ObjectId, ref: "Playlist" }],
	},
	{ collection: "users" }
);

module.exports = mongoose.model("User", usersSchema);
