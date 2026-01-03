const User = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not defined" });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // 🔥 CRITICAL COOKIE FIX
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,        // must be false on localhost
    sameSite: "lax",      // 🔥 REQUIRED
    path: "/",            // 🔥 REQUIRED
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "User logged in successfully",
    status: 200,
    data: {
      id: user._id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
    },
    error: null,
  });
}

module.exports = login;
