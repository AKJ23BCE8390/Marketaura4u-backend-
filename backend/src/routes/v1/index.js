const v1Router = require("express").Router();

const authRouter = require("./auth/authRouter");
const contentRouter = require("./content/genrate");
const campaignRouter = require("./campaign/campaignRouter");

// /api/v1/auth
v1Router.use("/auth", authRouter);

// /api/v1/content
v1Router.use("/content", contentRouter);

// /api/v1/campaign
v1Router.use("/campaign", campaignRouter);

module.exports = v1Router;
