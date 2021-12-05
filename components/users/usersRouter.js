const expres = require("express");
const router = expres.Router();
const usersControllers = require("./usersControllers");

router.post("/singin", usersControllers.singin)
router.post("/login", usersControllers.login)

module.exports = router;