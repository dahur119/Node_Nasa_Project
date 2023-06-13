const axios = require("axios");
const launchesDatabase = require("./launches.mongo");
const planets = require("./planet.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;
const launches = new Map();

let latestFlightNumber = 100;

const launch = {
  flightNumber: 100, // flightNumber
  mission: "Kepler Exploration X", // name
  rocket: "Explorer ISI", // rocket.name
  launchDate: new Date("December 27, 2030"), // data_local
  target: "Kepler-296 A f", //not applicable
  customer: ["ZTM", "NASA"], //payload.customers for each apyload
  upcoming: true, // upcoming
  success: true, // success
};

saveLunch(launch);

const SPACE_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("Downloading launch data...");
  const response = await axios.post(SPACE_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });
  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];

    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(launch);
    // console.log(launch);
    await saveLunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FlaconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already exist");
  } else {
    await populateLaunches();
  }
}

// launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

async function getLatestFlightNumber() {
  const latestLunch = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestLunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLunch.flightNumber;
}
async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find(
      {},
      {
        _id: 0,
        __v: 0,
      }
    )
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne(
    {
      keplerName: launch.target,
    },
    {
      _id: 0,
      __v: 0,
    }
  );
  if (!planet) {
    throw new Error("No matching planet found");
  }
  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customer: ["Zero to Mastery", "NASA"],
    flightNumber: newFlightNumber,
  });
  await saveLunch(newLaunch);
}

async function abortLaunchById(launchdId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchdId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.ok === 1 && aborted.nModified === 1;
}

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
