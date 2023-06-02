const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
let initializingDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is starting at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializingDbandServer();
//api to post
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  insert into district(district_name, state_id,cases,cured,active,deaths)
  values (
     ' ${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );`;

  const dbResponse = await db.run(addDistrictQuery);
  const district_id = dbResponse.lastID;
  response.send("District Successfully Added");
});

//convert snake-case to camelCase
let convertSnakeCasetoCamelCase = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

//API to get all states list from the Database
app.get("/states/", async (request, response) => {
  let selectQuery = `
    select 
    *
    from
    state;`;
  let result = await db.all(selectQuery);
  response.send(
    result.map((eachState) => convertSnakeCasetoCamelCase(eachState))
  );
});

//convert snake-case to camelCase
let convertDetailsFromSnakeCasetoCamelCase = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

// creating an API to get required state details from database
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  let newQuery = `
  select 
  *
  from state where state_id = ${stateId};`;
  const resultantState = await db.get(newQuery);
  response.send(convertDetailsFromSnakeCasetoCamelCase(resultantState));
});

//convert snake-case to camelCase for District database
let convertDetailsFromSnakeCasetoCamelCaseDistrict = (eachState) => {
  return {
    districtId: eachState.district_id,
    districtName: eachState.district_name,
    stateId: eachState.stateId,
    stateId: eachState.state_id,
    cases: eachState.cases,
    cured: eachState.cured,
    active: eachState.active,
    deaths: eachState.deaths,
  };
};
// creating an API to get required district details from database based on ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  let newQuery = `
  select 
  *
  from district where district_id = ${districtId};`;
  const resultantDistrict = await db.get(newQuery);
  response.send(
    convertDetailsFromSnakeCasetoCamelCaseDistrict(resultantDistrict)
  );
});

//geting object containing a state name
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
   
   select state_id from district
where district_id = ${districtId};`;

  const stateIdR = await db.get(getStateIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${stateIdR.state_id};
`;
  const responseOfName = await db.get(getStateNameQuery);
  response.send({
    stateName: responseOfName.stateName,
  });
});

//get statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `select sum(cases),sum(cured),sum(active),sum(deaths) from district where state_id=${stateId};
   `;

  const stats = await db.get(getStatsQuery);
  response.send({
    totalCases: stats["sum(cases)"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active)"],
    totalDeaths: stats["sum(deaths)"],
  });
});

// creating an API to add new district details into the Database
// app.post("/districts/", async (request, response) => {
//   const movieDetails = request.body;
//   const { districtName, stateId, cases, cured, active, deaths } = movieDetails;
//   let insertQuery = `
//     insert
//     into
//     district
//     (district_name, state_id, cases, cured, active, deaths)
//     values
//     ("${districtName}",
//     ${stateId},
//     ${cases},
//     ${cured},
//     ${active}
//     ${deaths});`;
//   let dbResult = await db.run(insertQuery);
//   const districtId = dbResult.lastID;
//   response.send("Movie Successfully Added");
// });

//creating an API for updating the details of the movie in movie table database
app.put("/districts/:districtId/", async (request, response) => {
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const { districtId } = request.params;
  const updateQuery = `
  update
  district
  set
  district_name = "${districtName}",
  state_id = ${stateId}, 
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  where 
  district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
}); //sending the required response

// //creating an API for deleting the details from the movie database
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
  delete from district where district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});
// //--------------------------------------------------------------

module.exports = app;
