const fs = require("fs");
const csv = require("csv-parser");

const path = require("path");
const STORES_CSV = path.resolve("stores.csv");
const OUT_JSON = path.resolve("backend", "locations.json");

// Note: always read CSV and merge any new store entries into the existing JSON.
// We no longer exit early when output is newer — we still want to ensure
// any missing stores from the CSV are added to `backend/locations.json`.
try {
  fs.statSync(STORES_CSV);
} catch (e) {
  console.error("stores.csv not found:", e.message);
  process.exit(1);
}

const results = [];

fs.createReadStream(STORES_CSV)
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
      },
    });
  })
  .on("end", () => {
    // ensure backend dir exists
    const outDir = path.dirname(OUT_JSON);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Load existing locations.json if present
    let existing = [];
    try {
      if (fs.existsSync(OUT_JSON)) {
        const raw = fs.readFileSync(OUT_JSON, "utf8");
        existing = JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading existing locations.json:", e.message);
      // proceed with empty existing list
      existing = [];
    }

    const existingMap = new Set(existing.map((r) => String(r.storeNumber)));
    let added = 0;

    for (const r of results) {
      const sn = String(r.storeNumber);
      if (!existingMap.has(sn)) {
        existing.push(r);
        existingMap.add(sn);
        added++;
      }
    }

    if (added > 0 || existing.length === 0) {
      fs.writeFileSync(OUT_JSON, JSON.stringify(existing, null, 2));
      console.log(`✅ Wrote ${OUT_JSON} — added ${added} new store(s).`);
    } else {
      console.log("No new stores to add — backend/locations.json unchanged.");
    }
  });
