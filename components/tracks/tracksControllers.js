const fs = require("fs");
const path = require("path");
const Track = require("./tracksModel");
const getTrackData = require("../../services/trackdataApi");

exports.upload = async (req, res, next) => {
	try {
		if (req.repeated) {
			return res.status(401).json({
				message: "This track already exist",
			});
		}

		if (req.badRequest) {
			return res.status(400).json({
				message: "Lack of information in body",
			});
		}

		const { name, artist } = req.body;

		const trackExtraInf = await getTrackData(name, artist);
		const lastField = "#text";

		const album = trackExtraInf.album.title;
		const cover = trackExtraInf.album.image[3][lastField];

		const newTrack = new Track({
			name,
			artist,
			album: album && album,
			cover: cover && cover,
			identifier: req.file.filename.replace(".mp3", ""),
			uploadedByUser: req.user._id,
		});

		await newTrack.save();

		const logedUser = req.user;
		logedUser.uploadedTracks = [...logedUser.uploadedTracks, newTrack._id];

		await logedUser.save();

		res.status(201).json({
			message: "track uploaded",
		});
	} catch (error) {
		res.status(400).json({
			message: "failed to upload track",
			error,
		});
		console.log(error);
	}
};

exports.getTrackMp3 = (req, res) => {
	try {
		const trackId = req.params.id;

		const trackPath = path.join(process.cwd(), "tracks", `${trackId}.mp3`);

		const trackStats = fs.statSync(trackPath);

		res.status(200).set({
			"Content-Type": "audio/mp3",
			"accept-ranges": "bytes",
			"Content-Length": trackStats.size,
		});

		const streamTrack = fs.createReadStream(trackPath);

		streamTrack.pipe(res);
	} catch (error) {
		console.log(error);
	}
};

exports.getTracks = async (req, res) => {
	try {
		const tracks = await Track.find();

		res.status(200).json({
			tracks,
		});
	} catch (error) {
		console.log(error);
	}
};

exports.dowload = async (req, res) => {
	const trackIdentifier = req.params.id;

	const track = await Track.findOne({ identifier: trackIdentifier });

	const trackPath = path.resolve(
		process.cwd(),
		"tracks",
		`${trackIdentifier}.mp3`
	);

	const trackName = `${track.name}.mp3`;

	res.download(trackPath, trackName);
};
