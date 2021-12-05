const express = require("express");
const router = express.Router();
const upload = require("../../services/configureMulter");
const trackControllers = require("./tracksControllers");
const isAuth = require("../../middlewares/isAuth");

router.get("/", trackControllers.getTracks);

router.post("/upload", [isAuth, upload.single("track")], trackControllers.upload);

router.get("/:id/mp3", trackControllers.getTrackMp3);

router.get("/:id/download", trackControllers.dowload);

module.exports = router;
