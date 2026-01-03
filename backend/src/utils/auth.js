const jwt = require("jsonwebtoken");

const verify = (req, res, next) => {
  console.log("🔥 AUTH MIDDLEWARE HIT");

  try {
    console.log("Cookies:", req.cookies);

    const token = req.cookies.token;
    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ message: "No token" });
    }

    console.log("Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    console.log("✅ req.user set:", req.user);

    next();
  } catch (err) {
    console.error("❌ AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Auth failed" });
  }
};

module.exports = verify;
