const fs = require("fs");
const csv = require("csv-parser");

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
      zip: data["Zip"] || data["Zip Code"],
      phone: data["Phone"],
      latitude: parseFloat(data["Latitude"]),
      longitude: parseFloat(data["Longitude"]),
      amenities: {
        carWash: data["Car Wash"] === "Yes",
        gas: data["Sells Gas"] === "Yes",
        diesel: data["Sells Diesel"] === "Yes",
        cng: data["Sells CNG"] === "Yes",
        lng: data["Sells LNG"] === "Yes",
        def: data["Sells DEF"] === "Yes",
        e85: data["Sells E85"] === "Yes",
      }
    });
  })
  .on("end", () => {
    fs.writeFileSync("backend/locations.json", JSON.stringify(results, null, 2));
    console.log("✅ Converted CSV to locations.json");
  });
