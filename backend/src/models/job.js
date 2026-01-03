const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    platforms: [String], // ['twitter', 'linkedin', 'email']
    originalContent: String,

    generatedContent: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    error: String,
  },
  {
    timestamps: true,
  }
);

// ✅ SAFE EXPORT (prevents OverwriteModelError)
module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
