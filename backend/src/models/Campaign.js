const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    prompt: {
      type: String,
      required: true,
    },

    content: {
      twitter: String,
      linkedin: String,
      blog: String,
      email: {
        subject: String,
        body: String,
      },
    },

    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);
