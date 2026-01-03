const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  companyName: { 
    type: String, 
    default: '' 
  },
  
  // Added these fields because your controller is sending them
  industry: {
    type: String,
    default: ''
  },
  targetAudience: {
    type: String,
    default: ''
  },

  brandVoice: {
    tone: { 
      type: String, 
      default: 'Professional'
    },
    description: { 
      type: String, 
      default: '' 
    }
  },

  // Stores the list of active platforms (e.g., ['twitter', 'linkedin'])
  platforms: [{
    type: String,
    enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'blog', 'youtube']
  }],

  // ✅ UPDATED: Using Map for Key-Value pairs 
  // Stores specific IDs (e.g., { twitter: "@username", linkedin: "profile-url" })
  platformIds: {
    type: Map,
    of: String, // The value of each key must be a string
    default: {} 
  },

  // Basic usage tracking
  monthlyCredits: { 
    type: Number, 
    default: 100 
  },
  creditsUsed: { 
    type: Number, 
    default: 0 
  },

  onboardingCompleted: { 
    type: Boolean, 
    default: false 
  }

}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);