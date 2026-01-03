const User = require("../../models/user");

const profile = async (req, res) => {
  try {
    console.log("👤 Profile request by:", req.user);

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      data: user,
      error: null,
    });
  } catch (err) {
    console.error("❌ PROFILE ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = profile;
