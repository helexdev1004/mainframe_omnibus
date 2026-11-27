// Builds the compact dot masks used by the hero globe and the Europe map.
// Output is committed to src/data, so this only needs re-running when the
// dot density or the list of markets changes:  npm run geo
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoContains, geoBounds, geoAzimuthalEqualArea } from "d3-geo";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "src/data");
mkdirSync(outDir, { recursive: true });

const load = (file) =>
  JSON.parse(readFileSync(require.resolve(`world-atlas/${file}`), "utf8"));

// ISO 3166-1 numeric → single-letter key used in the masks
const MARKETS = {
  250: { key: "F", name: "France" },
  276: { key: "D", name: "Germany" },
  380: { key: "I", name: "Italy" },
  724: { key: "E", name: "Spain" },
  616: { key: "P", name: "Poland" },
  792: { key: "T", name: "Turkey" },
};
const MARKET_BY_NAME = Object.fromEntries(
  Object.values(MARKETS).map((m) => [m.name, m]),
);
MARKET_BY_NAME["Türkiye"] = MARKETS[792];

function indexCountries(topology) {
  return feature(topology, topology.objects.countries).features.map((f) => {
    const name = f.properties?.name ?? "";
    return {
      f,
      name,
      market: MARKETS[Number(f.id)] ?? MARKET_BY_NAME[name] ?? null,
      bounds: geoBounds(f),
    };
  });
}

function inBounds([[w, s], [e, n]], lon, lat) {
  if (lat < s || lat > n) return false;
  return w <= e ? lon >= w && lon <= e : lon >= w || lon <= e;
}

function countryAt(countries, lon, lat) {
  for (const c of countries) {
    if (inBounds(c.bounds, lon, lat) && geoContains(c.f, [lon, lat])) return c;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Globe: latitude rings, each a string of 0 (sea) 1 (land) 2 (market) */
/* ------------------------------------------------------------------ */
function buildGlobe() {
  const RINGS = 150;
  const countries = indexCountries(load("countries-110m.json"));
  const rows = [];
  let land = 0;
  let total = 0;

  for (let i = 0; i < RINGS; i++) {
    const lat = -90 + ((i + 0.5) * 180) / RINGS;
    const n = Math.max(
      1,
      Math.round(Math.cos((lat * Math.PI) / 180) * RINGS * 2),
    );
    let row = "";
    for (let j = 0; j < n; j++) {
      const lon = -180 + ((j + 0.5) * 360) / n;
      const hit = countryAt(countries, lon, lat);
      total++;
      if (!hit) row += "0";
      else {
        land++;
        // lat > 34 keeps overseas territories out of the highlight
        row += hit.market && lat > 34 ? "2" : "1";
      }
    }
    rows.push(row);
  }

  writeFileSync(
    resolve(outDir, "globe.json"),
    JSON.stringify({ rings: RINGS, rows }),
  );
  console.log(`globe.json   ${land} land dots of ${total} (${RINGS} rings)`);
}

/* ------------------------------------------------------------------ */
/* Europe: a projected dot grid. "." sea · "," neighbouring land ·     */
/* "o" other European land · F D I E P T the six markets               */
/* ------------------------------------------------------------------ */
function buildEurope() {
  const W = 104;
  const H = 74;
  const countries = indexCountries(load("countries-50m.json"));

  const NEIGHBOURS = new Set([
    "Morocco", "Algeria", "Tunisia", "Libya", "Egypt", "Syria", "Iraq", "Iran",
    "Lebanon", "Israel", "Jordan", "Saudi Arabia", "Palestine", "Kuwait",
    "Kazakhstan", "Georgia", "Armenia", "Azerbaijan", "Greenland",
    "W. Sahara", "Turkmenistan", "Uzbekistan",
    // kept as faint context so the eastern edge doesn't read as a solid block
    "Russia",
  ]);

  const frame = {
    type: "MultiPoint",
    coordinates: [
      [-9.6, 36.9], [-9.4, 43.2], [-10.6, 52],
      [14, 68.6], [25.7, 71.2],
      [44.9, 39.6], [44, 37.2],
      [33, 35.9], [24, 34.8], [12, 36.5], [-5.6, 35.9],
    ],
  };
  const projection = geoAzimuthalEqualArea()
    .rotate([-16, -52])
    .fitExtent([[1.5, 1.5], [W - 1.5, H - 1.5]], frame);

  const rows = [];
  let dots = 0;
  for (let y = 0; y < H; y++) {
    let row = "";
    for (let x = 0; x < W; x++) {
      const ll = projection.invert([x + 0.5, y + 0.5]);
      const hit = ll ? countryAt(countries, ll[0], ll[1]) : null;
      if (!hit) row += ".";
      else {
        dots++;
        if (hit.market && ll[1] > 34) row += hit.market.key;
        else row += NEIGHBOURS.has(hit.name) ? "," : "o";
      }
    }
    rows.push(row);
  }

  const CITIES = [
    { key: "F", city: "Paris", at: [2.35, 48.86] },
    { key: "D", city: "Berlin", at: [13.4, 52.52] },
    { key: "I", city: "Rome", at: [12.5, 41.9] },
    { key: "E", city: "Madrid", at: [-3.7, 40.42] },
    { key: "P", city: "Warsaw", at: [21.01, 52.23] },
    { key: "T", city: "Ankara", at: [32.86, 39.93] },
  ].map(({ key, city, at }) => {
    const [x, y] = projection(at);
    return { key, city, x: +x.toFixed(2), y: +y.toFixed(2) };
  });

  writeFileSync(
    resolve(outDir, "europe.json"),
    JSON.stringify({ w: W, h: H, rows, cities: CITIES }),
  );
  console.log(`europe.json  ${dots} land dots on a ${W}×${H} grid`);
}

buildGlobe();
buildEurope();
