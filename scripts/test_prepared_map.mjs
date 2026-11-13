import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import * as d3 from "d3";

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../static/${name}`, import.meta.url), "utf8"));
const prepared = read("map/render.json");
const original = d3.geoMercator().fitExtent([[0, 0], [1000, 800]], read("map/grid_3px.geojson"));
const restored = d3.geoMercator().scale(prepared.projection.scale).translate(prepared.projection.translate);

test("prepared projection preserves every plant's original screen coordinates", () => {
  for (const row of read("data/plants.json")) {
    const point = [+row.LONGITUDE, +row.LATITUDE];
    assert.deepEqual(restored(point), original(point), row.PLANTID);
  }
});

test("batched paths preserve every original background tile and its type", () => {
  const path = d3.geoPath(original);
  const expected = new Map();
  for (const feature of read("map/grid_5px.geojson").features) {
    const type = feature.properties.type;
    expected.set(type, (expected.get(type) ?? "") + path(feature));
  }
  assert.deepEqual(prepared.paths, [...expected].map(([type, d]) => ({ type, d })));
});

test("background tiles form a disjoint rectangular grid so type batching preserves layers", () => {
  const bounds = read("map/grid_5px.geojson").features.map((feature) => {
    assert.equal(feature.geometry.type, "Polygon");
    assert.equal(feature.geometry.coordinates.length, 1);
    const ring = feature.geometry.coordinates[0];
    assert.equal(ring.length, 5);
    assert.deepEqual(ring[0], ring[4]);
    const points = ring.map(original);
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    const width = Math.max(...xs) - x, height = Math.max(...ys) - y;
    for (const [px, py] of points) {
      assert.ok(Math.min(Math.abs(px-x), Math.abs(px-x-width)) < 1e-6);
      assert.ok(Math.min(Math.abs(py-y), Math.abs(py-y-height)) < 1e-6);
    }
    return { x, y, width, height };
  });
  const first = bounds[0], cells = new Set();
  for (const b of bounds) {
    assert.ok(Math.abs(b.width-first.width) < 1e-6 && Math.abs(b.height-first.height) < 1e-6);
    const col = (b.x-first.x)/first.width, row = (b.y-first.y)/first.height;
    assert.ok(Math.abs(col-Math.round(col)) < 1e-6 && Math.abs(row-Math.round(row)) < 1e-6);
    const id = `${Math.round(col)}:${Math.round(row)}`;
    assert.ok(!cells.has(id));
    cells.add(id);
  }
});
