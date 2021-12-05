const mongoose = require("mongoose");

const connectDb = async () => {
	try {
		await mongoose.connect("mongodb://localhost:27017/musicverso");
		console.log("Db connected");
	} catch (error) {
		console.log("Db failed connection");
	}
};

connectDb();