/** Precompute the existing background at the app's fixed 1000×800 projection. */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as d3 from "d3";

const directory = new URL("../static/map/", import.meta.url);
const extent = JSON.parse(fs.readFileSync(new URL("grid_3px.geojson", directory), "utf8"));
const background = JSON.parse(fs.readFileSync(new URL("grid_5px.geojson", directory), "utf8"));
const projection = d3.geoMercator().fitExtent([[0, 0], [1000, 800]], extent);
const path = d3.geoPath(projection);
const groups = new Map();
const cells = new Set();
for (const feature of background.features) {
  const type = feature.properties.type;
  if (!["park", "street", "water", "other"].includes(type)) throw new Error(`Unknown map type: ${type}`);
  // Group only the disjoint grid tiles; do not merge overlapping map layers.
  const cell = JSON.stringify(feature.geometry.coordinates);
  if (cells.has(cell)) throw new Error("Duplicate background tile");
  cells.add(cell);
  if (!groups.has(type)) groups.set(type, []);
  groups.get(type).push(path(feature));
}
const result = {
  projection: { scale: projection.scale(), translate: projection.translate() },
  paths: [...groups].map(([type, paths]) => ({ type, d: paths.join("") })),
};
const target = new URL("render.json", directory);
fs.writeFileSync(target, JSON.stringify(result));
console.log(`Prepared ${background.features.length.toLocaleString()} background tiles as ${result.paths.length} paths (${fs.statSync(target).size.toLocaleString()} bytes): ${fileURLToPath(target)}`);
