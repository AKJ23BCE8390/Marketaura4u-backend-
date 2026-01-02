// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   email: { 
//     type: String, 
//     required: true, 
//     unique: true 
//   },
//   password: { 
//     type: String, 
//     required: true 
//   },
//   companyName: { 
//     type: String, 
//     default: '' 
//   },

// // --- AFTER (The easy fix) ---
//   brandVoice: {
//     tone: { 
//       type: String, 
//       // enum: ['Professional', 'Friendly', 'Casual'], // <-- REMOVED THIS LINE
//       default: 'Professional'
//     },
//     description: { 
//       type: String, 
//       default: '' 
//     }
//   },

 
//   platforms: [{
//     type: String,
//     enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'blog']
//   }],

//   // Basic usage tracking
//   monthlyCredits: { 
//     type: Number, 
//     default: 100 
//   },
//   creditsUsed: { 
//     type: Number, 
//     default: 0 
//   }
//   ,
//    onboardingCompleted: { 
//     type: Boolean, 
//     default: false 
//   }

// }, {
//   timestamps: true
// });


// module.exports = mongoose.models.User || mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // --- 1. AUTHENTICATION ---
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // --- 2. APP STATE ---
  onboardingCompleted: { 
    type: Boolean, 
    default: false 
  },
  credits: { 
    monthly: { type: Number, default: 100 },
    used: { type: Number, default: 0 }
  },

  // --- 3. BRAND PROFILE ---
  brandProfile: {
    companyName: { 
      type: String, 
      default: '' 
    },
    industry: {
      type: String,
      default: ''
    },
    
    // *** NEW ADDITION HERE ***
    // This stores "What makes us unique/different"
    uvp: { 
      type: String, 
      default: '' 
    },

    targetAudience: { 
      type: String, 
      default: '' 
    },
    marketingGoal: { 
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
    platforms: [{
      type: String,
      enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'blog']
    }]
  }

}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);