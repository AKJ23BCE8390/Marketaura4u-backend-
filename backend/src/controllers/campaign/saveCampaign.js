const Campaign = require("../../models/Campaign");

const saveCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, prompt, content, imageUrl } = req.body;

    if (!title || !prompt || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const campaign = await Campaign.create({
      userId,
      title,
      prompt,
      content,
      imageUrl,
    });

    res.status(201).json({
      status: 201,
      data: campaign,
    });
  } catch (err) {
    console.error("SAVE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Failed to save campaign" });
  }
};

module.exports = saveCampaign;
