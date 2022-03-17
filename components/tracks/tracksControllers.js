const fs = require("fs");
const path = require("path");
const Track = require("./tracksModel");
const getTrackData = require("../../services/trackdataApi");
const formatTrackStringToApi = require("./services/formatTrackStringToApi");
const formatTrackStringToDb = require("./services/formatTrackStringToDb");
const checkQueryNumber = require("../../services/ckeckQueryNumber");
const throwError = require("../../services/throwError");

exports.upload = async (req, res, next) => {
	try {
		if (!req.file) {
			throwError("You need to send a valid mp3 audio file.", 400);
		}

		const { name, artist } = req.body;
		const formatedNameToDb = formatTrackStringToDb(name);
		const formatedArtistToDb = formatTrackStringToDb(artist);

		const formatedNameToApi = formatTrackStringToApi(name);
		const formatedArtistToApi = formatTrackStringToApi(artist);

		//# llamado a api externa para obtener cover y album de la cancion que se quiere subir
		const trackExtraInf = await getTrackData(
			formatedNameToApi,
			formatedArtistToApi
		);
		const lastField = "#text";

		const album = trackExtraInf?.album?.title;
		const cover = trackExtraInf?.album?.image[3][lastField];

		//# se crea y se guarda la nueva cancion
		const newTrack = new Track({
			name: formatedNameToDb,
			artist: formatedArtistToDb,
			album: album && album,
			//# si la api externa no provee un cover se guarda como cover una url al servidor que aloje el backend apuntando al cover general guardado en la carpeta public
			cover: cover
				? cover
				: `${req.protocol}://${req.get("host")}/general_cover.jpg`,
			identifier: req.file.filename.replace(".mp3", ""),
			uploadedByUser: req.user._id,
		});

		await newTrack.save();

		//# se agraga al usuario la cancion que subio
		const logedUser = req.user;
		logedUser.uploadedTracks = [...logedUser.uploadedTracks, newTrack._id];

		await logedUser.save();

		return res.status(201).json({
			message: "Track uploaded successfully.",
			newTrack,
		});
	} catch (error) {
		next(error);
	}
};

exports.getTrackMp3 = (req, res) => {
	try {
		const trackId = req.params.id;

		const trackPath = path.join(process.cwd(), "tracks", `${trackId}.mp3`);

		const trackStats = fs.statSync(trackPath);

		res.status(200).sendFile(trackPath, {
			headers: {
				"Content-Type": "audio/mp3",
				"accept-ranges": "bytes",
				"Content-Length": trackStats.size,
			},
		});
	} catch (error) {
		next(error);
	}
};

//* Controlador para obtener todas la canciones
exports.getTracks = async (req, res, next) => {
	try {
		const limit = req.query.limit ? +req.query.limit : undefined;
		const offset = req.query.offset ? +req.query.offset : undefined;
		const validLimit = checkQueryNumber(limit);
		const validOffset = checkQueryNumber(offset);
		//# si hay un query valido para search se hara una busqueda en base a lo solicitado si no es el caso se buscan las canciones en base a la fecha que se han creado
		const search = req.query.search;
		const toFind = search
			? { name: { $regex: new RegExp(search), $options: "i" } }
			: {};

		//# si el limite y el offset son validos se realiza la paginacion
		if (validLimit && validOffset) {
			const tracks = await Track.find(toFind)
				.skip(offset * limit)
				.limit(limit)
				.sort({ createdAt: -1 });

			return res.status(200).json({
				tracks,
				message: `Sended tracks with an offset of ${offset} and a limit of ${limit}, if you want a different number of tracks send a different limit and offset values.`,
			});
		}

		//# si el limite y el offset no son validos se envia las canciones con un limite de 20

		const tracks = await Track.find(toFind).limit(20);

		return res.status(200).json({
			tracks,
			message: `Sended tracks with a limit of 20, if you want a different number of tracks send a limit and offset queries with valid values.`,
		});
	} catch (error) {
		next(error);
	}
};

exports.download = async (req, res) => {
	try {
		const trackIdentifier = req.params.id;

		const track = await Track.findOne({ identifier: trackIdentifier });

		const trackPath = path.resolve(
			process.cwd(),
			"tracks",
			`${trackIdentifier}.mp3`
		);

		const trackName = `${track.name}.mp3`;

		res.download(trackPath, trackName);
	} catch (error) {
		next(error);
	}
};

exports.delete = async (req, res) => {
	try {
		const { id } = req.body;
		const user = req.user;

		//# verifico que el usuario posea el id enviado como para de las canciones que ha subido, si no es el caso arrojo un error porque este usuario no fue el que subio la cancion
		const uploadedByUser = user.uploadedTracks.some((trackId) =>
			trackId.equals(id)
		);

		if (!uploadedByUser) {
			throwError(
				"You didn't upload this track, you can only delete tracks uploaded by you",
				403
			);
		}

		const track = await Track.findByIdAndDelete(id);

		if (!track) {
			throwError("There is no track with that id, please try again", 401);
		}

		const indexOfDeletedTrack = user.uploadedTracks.findIndex((trackId) =>
			trackId.equals(id)
		);

		user.uploadedTracks.splice(indexOfDeletedTrack, 1);

		await user.save();

		const trackPath = path.join(
			`${process.cwd()}`,
			"tracks",
			`${track.identifier}.mp3`
		);

		fs.unlinkSync(trackPath);

		res.status(200).json({
			message: "Track deleted",
		});
	} catch (error) {
		next(error);
	}
};
