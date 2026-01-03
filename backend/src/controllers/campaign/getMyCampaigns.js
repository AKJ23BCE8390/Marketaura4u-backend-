const Campaign = require("../../models/Campaign");

const getMyCampaigns = async (req, res) => {
  try {
    console.log("🔥 /campaign/my HIT");
    console.log("REQ.USER:", req.user);

    const campaigns = await Campaign.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    console.log("FOUND CAMPAIGNS:", campaigns.length);

    res.status(200).json({
      status: 200,
      data: campaigns,
    });
  } catch (err) {
    console.error("❌ FETCH CAMPAIGNS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

module.exports = getMyCampaigns;
