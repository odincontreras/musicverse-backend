require("./services/db");
const express = require("express");
const cors = require("cors");
const app = express();
const router = require("./services/router");
const errorHandler = require("./middlewares/errorHandler");

app.use(express.json());
app.use(cors());
app.use(router);
app.use(errorHandler);

module.exports = app;
