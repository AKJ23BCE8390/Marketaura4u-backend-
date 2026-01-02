const authRouter = require("express").Router();

const auth = require("../../../utils/auth");
const signup = require("../../../controllers/auth/signUp");
const onBoard = require("../../../controllers/auth/onBoard");
const logout = require("../../../controllers/auth/logout");
const login = require("../../../controllers/auth/login");
const profile = require("../../../controllers/auth/profile");

// 🔓 Public routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// 🔐 Protected routes
authRouter.post("/onboarding", auth, onBoard);
authRouter.get("/profile", auth, profile); // ✅ THIS IS THE KEY LINE

module.exports = authRouter;
