const Campaign = require("../../models/Campaign");
const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");

// ===============================================================
// 🐦 TWITTER PUBLISH (TEXT + IMAGE)
// ===============================================================

const publishToTwitter = async (twitterContent) => {
  console.log("🐦 Publishing to Twitter");

  let tweetText;
  let imageUrl = null;

  // -------- HANDLE DIFFERENT CONTENT SHAPES --------
  if (typeof twitterContent === "string") {
    tweetText = twitterContent;
  } else if (typeof twitterContent === "object") {
    tweetText = twitterContent.text || twitterContent.caption;
    imageUrl =
      twitterContent.imageUrl ||
      twitterContent.image_url ||
      null;
  } else if (Array.isArray(twitterContent)) {
    tweetText = twitterContent[0]?.text;
    imageUrl =
      twitterContent[0]?.imageUrl ||
      twitterContent[0]?.image_url ||
      null;
  }

  if (!tweetText) {
    throw new Error("No tweet text found");
  }

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
    });

    const imageBuffer = Buffer.from(response.data);
    const mimeType = response.headers["content-type"];

    if (!mimeType) {
      throw new Error("Unable to detect image MIME type");
    }

    // Twitter size limit
    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new Error("Image exceeds Twitter 5MB limit");
    }

    mediaId = await twitterClient.v1.uploadMedia(imageBuffer, {
      mimeType,
    });

    console.log("✅ Image uploaded:", mediaId);
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

    console.log(`📦 Publishing campaign ${campaignId} → ${platform}`);

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

    const content = campaign.content?.[platform];
    if (!content) {
      return res.status(400).json({
        success: false,
        message: `No ${platform} content found`,
      });
    }

    let result;

    switch (platform) {
      case "twitter":
        result = await publishToTwitter(content);
        break;

      case "linkedin":
        result = { success: true, simulated: true };
        break;

      case "instagram":
        result = { success: true, simulated: true };
        break;

      case "email":
        result = { success: true, simulated: true };
        break;

      case "blog":
        result = { success: true, simulated: true };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported platform",
        });
    }

    // -------- OPTIONAL: SAVE PUBLISH STATUS --------
    campaign.published = true;
    campaign.publishedAt = new Date();
    campaign.platformsPublished =
      campaign.platformsPublished || [];
    campaign.platformsPublished.push(platform);
    await campaign.save();

    res.json({
      success: true,
      message: "Content published successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Publish error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  publishContent,
};
