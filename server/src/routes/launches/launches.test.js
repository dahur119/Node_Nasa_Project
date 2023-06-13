const request = require("supertest");
const app = require("../../app");

describe("Test Get /launches", () => {
  test("oit should respond with 200 success", async () => {
    const response = await request(app)
      .get("/v1/launches")
      .expect("Content-Type", /json/)
      .expect(200);
    // expect(response.statusCode).toBe(200);
  });
});
describe("Test POST /launch", () => {
  const completerLaunchData = {
    mission: "USS Enterprise",
    rocket: "NCC 1701-D",
    target: "Kepler-186 f",
    launchDate: "January 4, 2028",
  };
  const launchDataWithoutDate = {
    mission: "USS Enterprise",
    rocket: "NCC 1701-D",
    target: "Kepler-186 f",
    launchDate: new Date(completerLaunchData.launchDate).toISOString(),
  };

  test("it should respond with 200 success", async () => {
    const response = await request(app)
      .post("/v1/launches")
      .send(completerLaunchData)
      .expect("Content-Type", /json/)
      .expect(201);

    const requestDate = new Date(completerLaunchData.launchDate).valueOf();
    const responseDate = new Date(response.body.launchDate).valueOf();
    expect(responseDate).toBe(requestDate);

    expect(response.body).toMatchObject(launchDataWithoutDate);
  });

  test("it should catch missing required properties", async () => {
    const invalidLaunchData = {
      mission: "USS Enterprise",
      rocket: "NCC 1701-D",
      target: "Kepler-186 f",
      // launchDate is intentionally missing
    };

    const response = await request(app)
      .post("/v1/launches")
      .send(invalidLaunchData)
      .expect("Content-Type", /json/)
      .expect(400);
    expect(response.body).toStrictEqual({
      error: "Missing required launch property",
    });
  });
  // Placeholder implementation
  // Add code to test the desired behavior
});

test("it should catch invalid dates", async () => {
  const launchDataWithInvalidData = {
    mission: "USS Enterprise",
    rocket: "NCC 1701-D",
    target: "Kepler-186 f",
    launchDate: "zooks", // Invalid date format
  };

  const response = await request(app)
    .post("/v1/launches")
    .send(launchDataWithInvalidData)
    .expect("Content-Type", /json/)
    .expect(400);

  expect(response.body).toStrictEqual({
    error: "Invalid launch date",
  });
});
