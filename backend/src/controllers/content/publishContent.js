const Campaign = require("../../models/Campaign");
const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");

// ===============================================================
// 🐦 TWITTER PUBLISH (STRICT FORMAT)
// Expected twitter content shape:
// twitter: [
//   { text: "...", image_url: "https://..." }
// ]
// ===============================================================

const publishToTwitter = async (twitterContent) => {
  console.log("🐦 Publishing to Twitter");

  // ✅ STRICT VALIDATION
  if (!Array.isArray(twitterContent) || !twitterContent[0]?.text) {
    throw new Error("Invalid Twitter content format");
  }

  const tweetText = twitterContent[0].text;
  const imageUrl = twitterContent[0].image_url || null;

  // -------- AUTH CHECK --------
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET,
  } = process.env;

  if (
    !TWITTER_API_KEY ||
    !TWITTER_API_SECRET ||
    !TWITTER_ACCESS_TOKEN ||
    !TWITTER_ACCESS_SECRET
  ) {
    throw new Error("Twitter API credentials missing");
  }

  const twitterClient = new TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
  });

  const rwClient = twitterClient.readWrite;
  let mediaId = null;

  // -------- IMAGE UPLOAD --------
  if (imageUrl) {
    console.log("🖼️ Downloading image:", imageUrl);

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
    });

    const imageBuffer = Buffer.from(response.data);
    const mimeType = response.headers["content-type"];

    if (!mimeType) {
      throw new Error("Unable to detect image MIME type");
    }

    // Twitter max: 5MB
    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new Error("Image exceeds Twitter 5MB limit");
    }

    mediaId = await twitterClient.v1.uploadMedia(imageBuffer, {
      mimeType,
    });

    console.log("✅ Twitter media uploaded:", mediaId);
  }

  // -------- POST TWEET --------
  const tweetPayload = { text: tweetText };
  if (mediaId) {
    tweetPayload.media = { media_ids: [mediaId] };
  }

  const { data } = await rwClient.v2.tweet(tweetPayload);

  console.log("✅ Tweet posted:", data.id);

  return {
    success: true,
    tweetId: data.id,
    url: `https://x.com/i/status/${data.id}`,
    real: true,
  };
};

// ===============================================================
// 🛎️ MAIN CONTROLLER
// ===============================================================

const publishContent = async (req, res) => {
  try {
    const { campaignId, platform } = req.body;
    const userId = req.user.id;

    if (!campaignId || !platform) {
      return res.status(400).json({
        success: false,
        message: "campaignId and platform are required",
      });
    }

    const normalizedPlatform = platform.toLowerCase();

    console.log(`📦 Publishing campaign ${campaignId} → ${normalizedPlatform}`);

    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // ✅ ENSURE CAMPAIGN IS READY
    if (campaign.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Campaign is not ready for publishing",
      });
    }

    const content = campaign.content?.[normalizedPlatform];
    if (!content) {
      return res.status(400).json({
        success: false,
        message: `No ${normalizedPlatform} content found`,
      });
    }

    let result;

    switch (normalizedPlatform) {
      case "twitter":
        result = await publishToTwitter(content);
        break;

      case "linkedin":
      case "instagram":
      case "email":
      case "blog":
        result = { success: true, simulated: true };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported platform",
        });
    }

    // -------- SAVE PUBLISH STATUS --------
    campaign.platformsPublished = campaign.platformsPublished || [];

    if (!campaign.platformsPublished.includes(normalizedPlatform)) {
      campaign.platformsPublished.push(normalizedPlatform);
    }

    campaign.publishedAt = new Date();
    campaign.published =
      campaign.platformsPublished.length > 0;

    await campaign.save();

    res.json({
      success: true,
      message: `Content published to ${normalizedPlatform}`,
      result,
    });

  } catch (error) {
    console.error("❌ Publish error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Publishing failed",
    });
  }
};

module.exports = {
  publishContent,
};
