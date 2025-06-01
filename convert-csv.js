const fs = require("fs");
const csv = require("./frontend/node_modules/csv-parser");

const results = [];

fs.createReadStream("stores.csv")
  .pipe(csv())
  .on("data", (data) => {
    results.push({
      storeNumber: data["Store Number"],
      name: data["Store Name"],
      address: data["Address"],
      city: data["City"],
      state: data["State"],
      zip: data["Zip Code"],
      latitude: parseFloat(data["Latitude"]),
      longitude: parseFloat(data["Longitude"]),
    });
  })
  .on("end", () => {
    fs.writeFileSync("locations.json", JSON.stringify(results, null, 2));
    console.log("✅ Converted CSV to locations.json");
  });
