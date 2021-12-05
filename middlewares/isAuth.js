const jwt = require("jsonwebtoken");
const User = require("../components/users/usersModel");

module.exports = async (req, res, next) => {
	const authHeader = req.get("Authorization");
	try {
		if (!authHeader) {
			const error = new Error("Not authenticated.");
			error.statusCode = 401;
			throw error;
		}

		const token = req.get("Authorization").split(" ")[1];
		const jwtSecret = process.env.JWT_SECRET;

		const validToken = jwt.verify(token, jwtSecret);

		if (!validToken) {
			const error = new Error("Invalid Token, not authenticated.");
			error.status = 401;
			throw error;
		}

		const logedUser = await User.findOne({ _id: validToken.userId });

		req.user = logedUser;

		next();
	} catch (error) {
		next(error);
	}
};
