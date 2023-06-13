const express = require("express");

const { httpGetAllPlanets } = require("./planet.controller");

const planetsRouter = express.Router();

planetsRouter.get("/", httpGetAllPlanets);

module.exports = planetsRouter;
