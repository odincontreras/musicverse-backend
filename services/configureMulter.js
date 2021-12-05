const multer = require("multer");
const { nanoid } = require("nanoid");
const Track = require("../components/tracks/tracksModel");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "tracks");
	},
	filename: function (req, file, cb) {
		const fileExtension = file.mimetype === "audio/mpeg" && "mp3";
		cb(null, `${nanoid()}.${fileExtension}`);
	},
});

const fileFilter = async (req, file, cb) => {
	const { name, artist } = req.body;
	const alredyExistsSong = await Track.findOne({ name, artist });

	if (alredyExistsSong) {
		req.repeated = true;
		return cb(null, false);
	}

	if (!name || !artist) {
		req.badRequest = true;
		return cb(null, false);
	}

	cb(null, true);
};

const limits = {
	fieldSize: 6000000,
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
