const User = require('../../models/user'); // Adjust path as needed

const getUserProfile = async (req, res) => {
  try {
    // 1. Get the User ID from the request (set by your auth middleware)
    const userId = req.user.id;

    // 2. Fetch User Data (excluding password for security)
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // 3. Determine "Premium" Status
    // Logic: If they have more than 100 credits, we consider them Premium.
    // (Or you can check a subscription field if you add one later)
    const isPremium = user.monthlyCredits > 100;

    // 4. Send Response
    res.status(200).json({
      success: true,
      data: {
        // Status Flags
        isOnboarded: user.onboardingCompleted,
        isUserPremium: isPremium,

        // User Details
        id: user._id,
        email: user.email,
        companyName: user.companyName,
        
        // Brand & Audience
        industry: user.industry,
        targetAudience: user.targetAudience,
        brandVoice: user.brandVoice, // { tone, description }

        // Social Platforms
        platforms: user.platforms,
        platformIds: user.platformIds, // Returns the Map of handles

        // Usage Stats
        credits: {
          total: user.monthlyCredits,
          used: user.creditsUsed,
          remaining: user.monthlyCredits - user.creditsUsed
        },

        joinedAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

module.exports = getUserProfile ;