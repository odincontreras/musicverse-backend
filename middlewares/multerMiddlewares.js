const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const Track = require("../components/tracks/tracksModel");

//! Filters

//* Filtrado de canciones
const tracksFilter = async (req, file, cb) => {
	if (file.mimetype !== "audio/mpeg") {
		cb(new Error("Wrong file type, you can only upload mp3 audio files."));
	}

	const { name, artist } = req.body;

	const alredyExistsSong =
		(await Track.countDocuments({ name, artist })) === 0 ? false : true;

	if (alredyExistsSong) {
		return cb(new Error("This track already exist!"));
	}

	if (!name || !artist) {
		return cb(
			new Error(
				"Lack of information in body, you need to provide a valid name and artist!"
			)
		);
	}

	cb(null, true);
};

//* Filtrado para los archivos que seran imagenes
const imagesFilter = (req, file, cb) => {
	if (file) {
		if (
			file.mimetype !== "image/png" &&
			file.mimetype !== "image/jpeg" &&
			file.mimetype !== "image/webp"
		) {
			// console.log(file.mimetype);
			cb(
				new Error(
					"Wrong file type, you can only upload images with these extensions: png, jpg or webp"
				)
			);
		} else if (file.size > 5242880) {
			cb(new Error("You can not upload files larger than 5mb in size"));
		} else {
			cb(null, true);
		}
	}

	cb(null, false);
};

//! Storage handlers

//* Para las canciones
const tracksStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "tracks");
	},
	filename: function (req, file, cb) {
		const fileId = new mongoose.Types.ObjectId();
		cb(null, `${fileId}.mp3`);
	},
});

//* Para los covers que tendran las playlists
const playlistCoverStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		const dest = path.join(process.cwd(), "public", "playlistsCovers");
		cb(null, dest);
	},
	filename(req, file, cb) {
		const _id = new mongoose.Types.ObjectId();
		const fileExtension = file.mimetype.slice(6);
		cb(null, `${_id}.${fileExtension}`);
	},
});

//* Para los avatars que pueden tener los usuarios
const userAvatarStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		const dest = path.join(process.cwd(), "public", "avatars");
		cb(null, dest);
	},
	filename(req, file, cb) {
		const _id = new mongoose.Types.ObjectId();
		const fileExtension = file.mimetype.slice(6);
		cb(null, `${_id}.${fileExtension}`);
	},
});

//! Middlewares

const uploadTrackMiddleware = multer({
	fileFilter: tracksFilter,
	storage: tracksStorage,
});

const uploadPlaylistCoverMiddleware = multer({
	fileFilter: imagesFilter,
	storage: playlistCoverStorage,
});

const uploadUserAvatarMiddlerwate = multer({
	fileFilter: imagesFilter,
	storage: userAvatarStorage,
});

module.exports = {
	uploadTrackMiddleware,
	uploadPlaylistCoverMiddleware,
	uploadUserAvatarMiddlerwate,
};
