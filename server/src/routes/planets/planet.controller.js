const { getAllPlanets } = require("../../model/planet.model");

async function httpGetAllPlanets(req, res) {
  res.status(200).json(await getAllPlanets());
}

module.exports = {
  httpGetAllPlanets,
};
