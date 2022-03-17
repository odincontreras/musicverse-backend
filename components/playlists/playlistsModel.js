const mongoose = require("mongoose");
const { Schema } = mongoose;

const tracksSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		tracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		cover: {
			type: String,
		},
		public: {
			type: Boolean,
			required: true,
		},
		createdByUser: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ collection: "playlists", timestamps: true }
);

module.exports = mongoose.model("Playlist", tracksSchema);
