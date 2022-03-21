const Playlist = require("./playlistsModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const throwError = require("../../services/throwError");
const checkQueryNumber = require("../../services/ckeckQueryNumber");

exports.addPlaylist = async (req, res, next) => {
	try {
		const { name, desciption, type } = req.body;
		const logedUser = req.user;
		const filename = req.file?.filename;

		const newPlaylist = new Playlist({
			name,
			desciption,
			cover: filename || "general_cover.jpg",
			public: type === "public" ? true : false,
			createdByUser: logedUser._id,
		});

		await newPlaylist.save();

		logedUser.playlists = [...logedUser.playlists, newPlaylist._id];

		await logedUser.save();

		return res.status(201).json({
			message: "Success creating playlist!",
			newPlaylist,
		});
	} catch (error) {
		next(error);
	}
};

exports.getPlaylists = async (req, res, next) => {
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
			const playlists = await Playlist.find({ public: true, ...toFind })
				.skip(limit * offset)
				.limit(limit)
				.sort({ createdAt: -1 });

			return res.status(200).json({
				playlists,
				message: `Sended playlists with an offset of ${offset} and a limit of ${limit}, if you want a different number of playlists send a different limit and offset values.`,
			});
		}

		//# si el limite y el offset no son validos se envia las canciones con un limite de 20
		const playlists = await Playlist.find({ public: true, ...toFind })
			.limit(20)
			.sort({ createdAt: -1 });

		return res.status(200).json({
			playlists,
			message: `Sended playlists with a limit of 20, if you want a different number of playlists send a limit and offset queries with valid values.`,
		});
	} catch (error) {
		next(error);
	}
};

exports.getUserPlaylists = async (req, res, next) => {
	try {
		const { _id: userId } = req.user;
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
			const playlists = await Playlist.find({
				createdByUser: userId,
				...toFind,
			})
				.skip(limit * offset)
				.limit(limit)
				.sort({ createdAt: -1 });

			if (!playlists) {
				throwError("There isn't a playlist with that id.", 404);
			}

			return res.status(200).json({
				playlists,
				userPlaylistsQuantity: req.user.playlists.length,
				message: `Sended playlists with an offset of ${offset} and a limit of ${limit}, if you want a different number of playlists send a different limit and offset values.`,
			});
		}

		//# si el limite y el offset no son validos se envia las canciones con un limite de 20
		const playlists = await Playlist.find({ createdByUser: userId, ...toFind })
			.limit(20)
			.sort({ createdAt: -1 });

		if (!playlists) {
			throwError("There isn't a playlist with that id.", 404);
		}

		return res.status(200).json({
			playlists,
			message: `Sended playlists with a limit of 20, if you want a different number of playlists send a limit and offset queries with valid values.`,
		});
	} catch (error) {
		next(error);
	}
};

exports.getPlaylist = async (req, res, next) => {
	try {
		const { playlistId } = req.params;

		const playlist = await Playlist.findOne({
			_id: mongoose.Types.ObjectId(playlistId),
		});

		if (!playlist) {
			const error = new Error("There isn't a playlist with that id.");
			error.status = 404;
			throw error;
		}

		return res.status(200).json({
			playlist,
			message: `${playlist.name} playlist's data sended successfully.`,
		});
	} catch (error) {
		next(error);
	}
};

exports.getPlaylistDetails = async (req, res, next) => {
	try {
		const { playlistId } = req.params;
		const limit = req.query.limit ? +req.query.limit : undefined;
		const offset = req.query.offset ? +req.query.offset : undefined;
		const validLimit = checkQueryNumber(limit);
		const validOffset = checkQueryNumber(offset);

		//# si hay un query valido para search se hara una busqueda en base a lo solicitado si no es el caso se buscan las canciones en base a la fecha que se han creado
		const search = req.query.search;
		const toFind = search
			? { name: { $regex: new RegExp(search), $options: "i" } }
			: {};

		//# si el limite y el offset son validos se realiza la paginac
		if (validLimit && validOffset) {
			const playlistWithoutTracks = await Playlist.findOne({
				_id: playlistId,
			});

			const tracksQuantity = playlistWithoutTracks.tracks.length;

			const playlistWithTracks = await playlistWithoutTracks.populate({
				path: "tracks",
				options: {
					limit,
					skip: limit * offset,
					sort: { createdAt: -1 },
				},
				match: toFind,
			});

			const { _id, name, public, cover, createdByUser, tracks } =
				playlistWithTracks;

			return res.status(200).json({
				message: `Sended ${playlistWithTracks.name} playlist's data and playlist's tracks was sended with an offset of ${offset} and a limit of ${limit}, if you want a different number of tracks send a different limit and offset values.`,
				playlistDetails: {
					_id,
					name,
					public,
					cover,
					createdByUser,
					tracksQuantity,
				},
				tracks,
			});
		}

		//# si el limite y el offset no son validos se envia las canciones con un limite de 20
		const playlist = await Playlist.findOne({ _id: playlistId }).populate({
			path: "tracks",
			options: {
				limit: 20,
			},
		});

		return res.status(200).json({
			message: `Sended ${playlist.name} playlist's data and playlist's tracks was sended with a limit of 20, if you want a different number of tracks send a limit and offset queries with valid values.`,
			playlist,
		});
	} catch (error) {
		next(error);
	}
};

exports.addPlaylistTrack = async (req, res, next) => {
	try {
		const { playlistId, trackId } = req.body;

		const playlist = await Playlist.findOne({ _id: playlistId });

		const existingTrack = playlist.tracks.some((track) =>
			track.equals(trackId)
		);

		if (existingTrack) {
			throwError(
				`This track already exist in the playlist ${playlist.name}, please choose another track.`,
				403
			);
		}

		playlist.tracks.push(trackId);

		await playlist.save();

		return res.status(201).json({
			message: `Song added to playlist: ${playlist.name}`,
		});
	} catch (error) {
		next(error);
	}
};

exports.deletePlaylist = async (req, res, next) => {
	try {
		const { playlistId } = req.params;
		const user = req.user;

		// Se valida que la playlist exista
		const playlistToDelete = await Playlist.findOne({
			_id: playlistId,
		});

		if (!playlistToDelete) {
			const error = new Error("There isn't a playlist with that id.");
			error.status = 404;
			throw error;
		}

		// se valida que el usuario sea el que creo la playlist
		const userOwner = user.playlists.some((userPlaylistId) =>
			userPlaylistId.equals(mongoose.Types.ObjectId(playlistId))
		);

		if (!userOwner) {
			const error = new Error("You can only delete playlist that you created.");
			error.status = 401;
			throw error;
		}

		// se obtiene el file path de la imagen guardada en el servidor
		const hascoverToDelete =
			playlistToDelete?.cover && playlistToDelete.cover !== "general_cover.jpg"
				? true
				: false;

		// Se elimina la playlist
		await playlistToDelete.remove();

		// Se elimina la imagen del servidor
		if (hascoverToDelete) {
			const playlistToDeleteCoverFilePath = path.join(
				process.cwd(),
				"public",
				"playlistsCovers",
				playlistToDelete.cover
			);

			fs.unlinkSync(playlistToDeleteCoverFilePath);
		}

		// Se remueve la playlist del usuario
		const indexOfDeletedPlaylist = user.playlists.findIndex((userPlaylistId) =>
			userPlaylistId.equals(mongoose.Types.ObjectId(playlistId))
		);
		user.playlists.splice(indexOfDeletedPlaylist, 1);
		await user.save();

		return res.status(200).json({
			message: `${playlistToDelete.name} playlist was deleted.`,
			userPlaylists: user.playlists,
		});
	} catch (error) {
		next(error);
	}
};

exports.updatePlaylist = async (req, res, next) => {
	try {
		const { playlistId } = req.params;
		const { newName } = req.body;
		const filename = req.file?.filename;

		if (!newName && !filename) {
			throwError("You need to provide valid changes.", 404);
		}

		const playlistToUpdate = await Playlist.findOne({ _id: playlistId });

		if (!playlistToUpdate) {
			throwError("There isn't a playlist with that id.", 400);
		}

		const previousCustomCover =
			playlistToUpdate?.cover && playlistToUpdate.cover !== "general_cover.jpg"
				? playlistToUpdate.cover
				: undefined;

		if (newName) {
			playlistToUpdate.name = newName;
		}

		if (filename) {
			playlistToUpdate.cover = filename;
		}

		await playlistToUpdate.save();

		if (filename && previousCustomCover) {
			const oldCoverFilePath = path.join(
				process.cwd(),
				"public",
				"playlistsCovers",
				previousCustomCover
			);
			fs.unlinkSync(oldCoverFilePath);
		}

		return res.status(200).json({
			message: "Success updating playlist!",
			changes: {
				name: playlistToUpdate.name,
				cover: playlistToUpdate.cover,
			},
		});
	} catch (error) {
		next(error);
	}
};

exports.removeTrack = async (req, res, next) => {
	try {
		const user = req.user;
		const { trackId, playlistId } = req.body;

		const playlist = await Playlist.findOne({ _id: playlistId });

		if (!playlist) {
			throwError(
				"Doesn't exist a playlist with this id, please try again",
				404
			);
		}

		const isUserPlaylistOwner = user.playlists.some((userPlaylistId) =>
			userPlaylistId.equals(playlistId)
		);

		if (!isUserPlaylistOwner) {
			throwError(
				"You didn't create this playlist, you can only remove tracks from playlist that you have created.",
				401
			);
		}

		const existTrackInPlaylist = playlist.tracks.some((playlistTrackId) =>
			playlistTrackId.equals(trackId)
		);

		if (!existTrackInPlaylist) {
			throwError("The track id sended doesn't exist in the playlist!", 404);
		}

		const indexOfTrackToRemove = playlist.tracks.findIndex((playlistTrackId) =>
			playlistTrackId.equals(trackId)
		);

		playlist.tracks.splice(indexOfTrackToRemove, 1);

		await playlist.save();

		return res.status(200).json({
			message: "Track deleted successfully.",
		});
	} catch (error) {
		next(error);
	}
};
