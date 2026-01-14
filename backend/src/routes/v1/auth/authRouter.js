const authRouter = require("express").Router();

const auth = require("../../../utils/auth");
const signup = require("../../../controllers/auth/signUp");
const onBoard = require("../../../controllers/auth/onBoard");
const logout = require("../../../controllers/auth/logout");
const login = require("../../../controllers/auth/login");
const getUserProfile = require("../../../controllers/auth/profile");


authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);


authRouter.post("/onboarding", auth, onBoard);
authRouter.get("/profile", auth,  getUserProfile);          

module.exports = authRouter;
