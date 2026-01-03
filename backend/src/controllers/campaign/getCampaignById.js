const Campaign = require("../../models/Campaign");

const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.status(200).json({
      status: 200,
      data: campaign,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
};

module.exports = getCampaignById;
