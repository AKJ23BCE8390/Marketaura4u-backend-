const User = require("../../models/user");

const onBoard = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      companyName,
      industry,
      brandTone,
      uvp,
      targetAudience,
      platforms,
      platformIds
    } = req.body;

    // 🔍 Basic Validation
    if (!companyName || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        message: "companyName and platforms are required",
      });
    }

    // 🧠 Prepare updates
    const updates = {
      onboardingCompleted: true,
      
      companyName: companyName, 
      platforms: platforms,
      
      // ✅ CHANGE: Default to empty Object {}, not String ""
      platformIds: platformIds || {}, 
      
      industry: industry || "",
      targetAudience: targetAudience || "",

      brandVoice: {
        tone: brandTone || "Professional",
        description: uvp || "",
      },
    };

    // 🗄️ Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Success Response
    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      data: updatedUser,
      error: null,
    });
  } catch (err) {
    console.error("❌ ONBOARD ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error during onboarding",
    });
  }
};

module.exports = onBoard;