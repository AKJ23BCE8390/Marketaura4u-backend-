const contentRouter=require("express").Router();
const auth=require("../../../utils/auth");
const { publishContent}=require("../../../controllers/content/publishContent");
const {generateContent}=require("../../../controllers/content/generateContent");
const {getGeneratedContent}=require("../../../controllers/content/getGeneratedContent");

contentRouter.post('/generate',auth,generateContent);
contentRouter.post('/publish',auth,publishContent);
contentRouter.get('/history',auth,getGeneratedContent);

module.exports=contentRouter;

