const User = require("../../models/user");

const onBoard = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      companyName,
      platforms,
      brandVoice,
    } = req.body;

    // 🔍 Validation
    if (!companyName || !Array.isArray(platforms)) {
      return res.status(400).json({
        message: "companyName and platforms are required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        companyName,
        platforms,
        brandVoice: {
          tone: brandVoice?.tone || "Professional",
          description: brandVoice?.description || "",
        },
        onboardingCompleted: true,
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      status: 200,
      message: "Onboarding completed",
      data: updatedUser,
      error: null,
    });
  } catch (err) {
    console.error("❌ ONBOARD ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = onBoard;
