const User = require('../../models/user'); 

const completeOnboarding = async (req, res) => {
  // brandTone is a string (e.g., "Witty")
  // brandVoice (in the schema) should be an object { tone: "Witty", ... }
  const { companyName, industry, brandTone, teamSize, platforms } = req.body;
  const userId = req.user.id;

  try {
    const updates = {
      companyName,
      industry,  
      teamSize,
      platforms, // This is correct (e.g., ["instagram", "blog"])
      
      // --- 👇 THIS IS THE FIX 👇 ---
      // Save brandVoice as an object, so "user.brandVoice.tone" will work
      brandVoice: {
        tone: brandTone,
        description: "" // You can add this to your form later
      },
      // --- 👆 END OF FIX 👆 ---

      onboardingCompleted: true
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Onboarding completed successfully',
      status: 200,
      user: updatedUser,
      error: null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = completeOnboarding;