const router = require("express").Router();
const auth = require("../../../utils/auth");

const saveCampaign = require("../../../controllers/campaign/saveCampaign");
const getMyCampaigns = require("../../../controllers/campaign/getMyCampaigns");
const getCampaignById = require("../../../controllers/campaign/getCampaignById");

// Save campaign
router.post("/save", auth, saveCampaign);

// 🔥 FETCH USER CAMPAIGNS (THIS WAS MISSING)
router.get("/my", auth, getMyCampaigns);

router.get("/:id", auth, getCampaignById);


module.exports = router;
