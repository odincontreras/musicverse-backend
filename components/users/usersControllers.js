const User = require("./usersModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.singin = async (req, res, next) => {
	const { username, email, password } = req.body;

	try {
		const existingUser =
			(await User.countDocuments({ email })) === 0 ? false : true;


		if (existingUser) {
			const error = new Error("Alredy exist a user with this email");
			error.status = 401;
			throw error;
		}

		const encryptPassword = await bcrypt.hash(password, 10);

		const newUser = new User({
			username,
			email,
			password: encryptPassword,
		});

		await newUser.save();

		res.status(201).json({
			message: "User created!",
		});
	} catch (error) {
		next(error);
	}
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const existUser = await User.findOne({ email });

		if (!existUser) {
			const error = new Error("Doesn't exist a user with this email");
			error.status = 401;
			throw error;
		}

		const rightPassword = await bcrypt.compare(password, existUser.password);

		if (!rightPassword) {
			const error = new Error("Wrong password try again");
			error.status = 401;
			throw error;
		}

		const jwtSecret = process.env.JWT_SECRET;

		const token = jwt.sign(
			{
				email,
				password,
				userId: existUser._id,
			},
			jwtSecret,
			{ expiresIn: "12h" }
		);

		res.status(202).json({
			message: "Succesfuly login",
			token,
		});
	} catch (error) {
		next(error);
	}
};
