import { useEffect, useState } from "react";

export default function Filters({ locations, visits, onFilter }) {
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("all");
  const [city, setCity] = useState("all");
  const [citySearch, setCitySearch] = useState("");

  const visitedStoreNumbers = new Set(visits.map((v) => v.storeNumber));
  const filteredLocations = locations.filter((l) => {
  if (state !== "all" && l.state !== state) return false;
  if (city !== "all" && l.city !== city) return false;
  return true;
});

const total = filteredLocations.length;
const visited = filteredLocations.filter((l) =>
  visitedStoreNumbers.has(l.storeNumber)
).length;

const percent = total ? Math.round((visited / total) * 100) : 0;


  const allStates = Array.from(new Set(locations.map((l) => l.state))).sort();

  const filteredCities = Array.from(
    new Set(
      locations
        .filter((l) => state === "all" || l.state === state)
        .map((l) => l.city)
    )
  )
    .filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
    .sort();

  useEffect(() => {
    onFilter({ status, city, state });
  }, [status, city, state]);

  return (
    <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-medium">Filter:</span>
        {["all", "visited", "unvisited"].map((opt) => (
          <button
            key={opt}
            className={`btn ${status === opt ? (opt === "visited" ? "btn-success" : opt === "unvisited" ? "btn-danger" : "btn-primary") : "btn-outline"}`}
            onClick={() => setStatus(opt)}
          >
            {opt === "all"
              ? "All"
              : opt === "visited"
              ? "Visited"
              : "Not Visited"}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <label className="font-medium">State:</label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity("all");
              setCitySearch("");
            }}
            className="w-auto"
          >
            <option value="all">All</option>
            {allStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <label className="font-medium">City:</label>
          <input
            type="text"
            list="city-options"
            placeholder="Search or pick city"
            className="w-full md:w-48"
            value={city === "all" ? "" : city}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || val.toLowerCase() === "all") {
                setCity("all");
              } else {
                setCity(val);
              }
            }}
          />
          <datalist id="city-options">
            <option value="All" />
            {filteredCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="flex flex-col md:items-end w-full md:w-auto">
        <div className="w-full md:w-64" style={{ background: 'var(--brand-gray)', borderRadius: '8px', height: '1.1rem', overflow: 'hidden' }}>
          <div style={{ background: 'var(--brand-success)', height: '100%', width: `${percent}%`, transition: 'width 0.4s' }} />
        </div>
        <p className="text-xs mt-1 text-center md:text-right" style={{ color: 'var(--brand-accent)' }}>
          {visited} of {total} stores visited ({percent}%)
        </p>
      </div>
    </div>
  );
}
