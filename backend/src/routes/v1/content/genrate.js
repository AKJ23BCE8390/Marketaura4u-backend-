const contentRouter=require("express").Router();
const auth=require("../../../utils/auth");
const { publishContent}=require("../../../controllers/content/publishContent");
const {generateContent}=require("../../../controllers/content/generateContent");
contentRouter.post('/generate',auth,generateContent);
contentRouter.post('/publish',auth,publishContent);

module.exports=contentRouter;