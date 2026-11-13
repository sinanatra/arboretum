/** Execute current Svelte calculation code against every growth-form filter.
 * node scripts/audit_visualization.mjs
 * Reads component ASTs so the audit does not substitute a second implementation.
 * This checks calculations and SVG attributes, not browser layout or events.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "svelte/compiler";
import * as d3 from "d3";
import { HABIT_GROUPS, habitGroup } from "../src/lib/habits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const plants = json("static/data/plants.json");
const curators = json("static/data/relations.json");
const geo = json("static/map/grid_3px.geojson");
// Resolve just the repository alias in the unmodified, pure color module.
const colorsSource = read("src/lib/colors.js").replaceAll(
  '"@lib/habits.js"', JSON.stringify(pathToFileURL(path.join(root, "src/lib/habits.js")).href)
);
const { COLOR_MODES, colorModeByKey, cellValue } = await import(
  `data:text/javascript;base64,${Buffer.from(colorsSource).toString("base64")}`
);
const vizSource = read("src/lib/components/Viz.svelte");
const viz = parse(vizSource);
const pageSource = read("src/routes/+page.svelte");
const page = parse(pageSource);

function declaration(ast, name, source) {
  const fn = ast.instance.content.body.find((n) => n.type === "FunctionDeclaration" && n.id.name === name);
  if (!fn) throw new Error(`Cannot locate component function: ${name}`);
  return source.slice(fn.start, fn.end);
}
function assignment(name) {
  const statement = viz.instance.content.body.find((n) => n.type === "LabeledStatement"
    && n.body.expression?.left?.name === name);
  if (!statement) throw new Error(`Cannot locate reactive assignment: ${name}`);
  const expression = statement.body.expression.right;
  return vizSource.slice(expression.start, expression.end);
}
const constants = ["minDiameter", "maxDiameter"].map((name) => {
  const statement = viz.instance.content.body.find((n) => n.type === "VariableDeclaration"
    && n.declarations.some((d) => d.id.name === name));
  if (!statement) throw new Error(`Cannot locate component constant: ${name}`);
  return vizSource.slice(statement.start, statement.end);
}).join("\n");
const computeNodes = new Function("data", "projection", "currentYear", "annotationsByPlant", "gridSize = 10",
  `${constants}\n${declaration(viz, "computeNodes", vizSource)}\nreturn computeNodes(data, projection, currentYear, annotationsByPlant, gridSize);`);
const countAnnotations = new Function(
  `${declaration(page, "countAnnotations", pageSource)}\nreturn countAnnotations;`
)();
const indexNodes = new Function("nodes", `return (${assignment("nodeByPlant")});`);
const highlight = new Function("selectedCuratorData", "nodeByPlant",
  `return [...(${assignment("highlightedSet")})];`);

function findCircle(node) {
  if (node.type === "Element" && node.name === "circle") return node;
  for (const child of node.children ?? []) {
    const match = findCircle(child);
    if (match) return match;
  }
}
const circle = findCircle(viz.html);
const opacityExpression = circle.attributes.find((a) => a.name === "fill-opacity").value[0].expression;
const opacity = new Function("node", "highlightedNodes", "highlightedSet", "selectedCuratorData = null",
  `return (${vizSource.slice(opacityExpression.start, opacityExpression.end)});`);
const projection = d3.geoMercator().fitExtent([[0, 0], [1000, 800]], geo);
const annotations = countAnnotations(curators);
const year = 2012;
const results = [];
const check = (name, passed) => results.push({ check: name, passed: Boolean(passed) });
const failures = () => results.filter((r) => !r.passed);
const currentNodes = computeNodes(plants, projection, year, annotations);
const currentById = new Map(currentNodes.map((n) => [n.id, n]));
check("Inherited object names cannot become saved color modes", ["constructor", "__proto__", "toString"].every(key => colorModeByKey[key] === undefined));
function findVariable(node, name) {
  if (!node || typeof node !== "object") return null;
  if (node.type === "VariableDeclarator" && node.id.name === name) return node.init;
  for (const child of Object.values(node)) {
    const found = findVariable(child, name);
    if (found) return found;
  }
  return null;
}
const fitBinding = findVariable(viz.instance.content, "fitNodes");
const initialFitNodes = new Function("fitData", "data", "nodes", "projection", "currentYear", "annotationsByPlant", "gridSize", "computeNodes",
  `return (${vizSource.slice(fitBinding.start, fitBinding.end)});`);
for (const filtered of [[], plants.filter(p => habitGroup(p.HABIT) === "herb")]) {
  const fitted = initialFitNodes(plants, filtered, computeNodes(filtered, projection, year, annotations), projection, year, annotations, 10, computeNodes);
  check(`Initial fit retains the full extent with ${filtered.length} filtered plants`,
    JSON.stringify(fitted.map(n => n.id)) === JSON.stringify(currentNodes.map(n => n.id)));
}
const fitView = new Function("d3", "nodes", "width", "height", "minScale", "maxScale",
  `${declaration(viz, "fitView", vizSource)}\nreturn fitView(nodes, width, height, minScale, maxScale);`).bind(null, d3);
const scaleLimits = vizSource.match(/\.scaleExtent\(\[([\d.]+),\s*([\d.]+)\]\)/).slice(1).map(Number);
for (const width of [180, 400, 1000]) {
  for (const height of [300, 800]) {
    const view = fitView(currentNodes, width, height, ...scaleLimits);
    check(`Initial fit keeps all circle centers inside ${width}×${height} available space`, currentNodes.every((n) => {
      const [x, y] = view.apply([n.x, n.y]);
      return x >= 0 && x <= width && y >= 0 && y <= height;
    }));
  }
}
check("Empty map fit stays finite", [fitView([], 400, 300, ...scaleLimits)].every(t => [t.x,t.y,t.k].every(Number.isFinite)));
const resizedNodes = computeNodes(plants, ([lon, lat]) => [lon * 200, lat * 200], year, annotations);
check("Metric cell membership is independent of viewport projection", JSON.stringify(currentNodes.map(n => [n.id, n.plantIDs])) === JSON.stringify(resizedNodes.map(n => [n.id, n.plantIDs])));
const degreesPerMeter = 180 / (6371008.8 * Math.PI);
const metricExample = computeNodes([1, 9, 11].map((meters, i) => ({
  PLANTID: `metric-${i}`, ACC_YR: 2000,
  LONGITUDE: -71.125 + meters * degreesPerMeter / Math.cos(42.3 * Math.PI / 180),
  LATITUDE: 42.3 + degreesPerMeter,
})), projection, year, new Map());
check("Ten-meter cells group 1m and 9m but separate 11m", metricExample.length === 2 && metricExample[0].count === 2 && metricExample[1].count === 1);
for (const meters of [5, 10, 20]) {
  const a = computeNodes(plants, projection, year, annotations, meters);
  const b = computeNodes(plants, ([x,y]) => [x * 3, y * 3], year, annotations, meters);
  check(`${meters}m grid preserves all plants and viewport-independent membership`, a.reduce((n,c) => n+c.count,0) === plants.length && JSON.stringify(a.map(n => [n.id,n.plantIDs])) === JSON.stringify(b.map(n => [n.id,n.plantIDs])));
}
// Regression: 140 and 0 elapsed years in one cell must average to 70, then
// scale to radius 1.9. Capping individual ages first incorrectly yields 1.5.
const ageExample = computeNodes([
  { PLANTID: "old", ACC_YR: 1872, LONGITUDE: 0, LATITUDE: 0 },
  { PLANTID: "new", ACC_YR: 2012, LONGITUDE: 0, LATITUDE: 0 },
], () => [10, 10], 2012, new Map());
check("Mean elapsed years are aggregated before display capping", Math.abs(ageExample[0].radius - 1.9) < 1e-10);
check("No selection preserves translucent circle fills", opacity(currentNodes[0], [], new Set()) === 0.1);
check("Empty selection remains contextual background", opacity(currentNodes[0], [], new Set(), { PlantDates: [] }) === 0.1);
check("Selected circles retain 0.7 opacity", opacity(currentNodes[0], [], new Set([currentNodes[0]])) === 0.7);
check("Recovered multi-label shrubs remain in the shrub group", habitGroup("shrub; dwarf shrub") === "shrub");
for (const mode of COLOR_MODES.filter((m) => !m.numeric)) {
  check(`${mode.key}: categorical colors are independent of input order`, currentNodes.every((n) =>
    cellValue(mode, n.rows) === cellValue(mode, [...n.rows].reverse())));
}
let curatorFilterCases = 0;
let nonemptyFiltersWithoutSelectedPlants = 0;
let unchangedCellsWithDifferentDensitySize = 0;

for (const meters of [5, 10, 20]) {
  for (let mask = 0; mask < 2 ** HABIT_GROUPS.length; mask++) {
    const groups = new Set(HABIT_GROUPS.filter((_, i) => mask & (1 << i)).map((g) => g.key));
    const rows = plants.filter((p) => groups.has(habitGroup(p.HABIT)));
    const nodes = computeNodes(rows, projection, year, annotations, meters);
    const nodeIndex = indexNodes(nodes);
    check(`${meters}m filter ${mask}: each visible plant appears exactly once`, nodeIndex.size === rows.length
      && nodes.reduce((n, c) => n + c.count, 0) === rows.length
      && rows.every((p) => nodeIndex.has(p.PLANTID.toLowerCase())));
    check(`${meters}m filter ${mask}: geometry, sizes and colors are finite`, nodes.every((n) =>
      [n.x, n.y, n.radius, n.radiusAttention, n.radiusCount, n.radiusSum].every(Number.isFinite)
      && [n.radius, n.radiusAttention, n.radiusCount, n.radiusSum].every((r) => r > 0)
      && COLOR_MODES.every((m) => /^#[0-9a-f]{6}$/i.test(m.color(cellValue(m, n.rows))))));
    let validHighlights = true;
    for (const curator of curators) {
      curatorFilterCases++;
      const actual = highlight(curator, nodeIndex);
      const ids = new Set(curator.PlantDates.map((p) => p.PlantID.toLowerCase()));
      const expected = nodes.filter((n) => n.plantIDs.some((id) => ids.has(id)));
      const selected = new Set(actual);
      validHighlights &&= actual.length === expected.length && expected.every((n) => selected.has(n));
      if (nodes.length && !actual.length) nonemptyFiltersWithoutSelectedPlants++;
    }
    check(`${meters}m filter ${mask}: every curator highlights exactly the intersecting cells`, validHighlights);
    for (const n of nodes) {
      const old = currentById.get(n.id);
      if (meters === 10 && old && n.plantIDs.length === old.plantIDs.length
          && n.plantIDs.every((id, i) => id === old.plantIDs[i])
          && Math.abs(n.radiusCount - old.radiusCount) > 1e-10) unchangedCellsWithDifferentDensitySize++;
    }
  }
}

const colorDiagnostics = {};
for (const mode of COLOR_MODES) {
  if (mode.numeric) {
    colorDiagnostics[mode.key] = {
      cellsWhoseColorBinContainsNoneOfTheirPlants: currentNodes.filter((n) =>
        !n.rows.some((p) => mode.color(mode.value(p)) === mode.color(cellValue(mode, n.rows)))).length,
    };
  } else {
    let mixed = 0, tied = 0, changedByReversingInput = 0, withoutMajority = 0;
    for (const n of currentNodes) {
      const counts = d3.rollup(n.rows, (rs) => rs.length, mode.value);
      if (counts.size > 1) mixed++;
      const max = Math.max(...counts.values());
      if ([...counts.values()].filter((v) => v === max).length > 1) tied++;
      if (max * 2 <= n.count) withoutMajority++;
      if (cellValue(mode, n.rows) !== cellValue(mode, [...n.rows].reverse())) changedByReversingInput++;
    }
    colorDiagnostics[mode.key] = { mixed, tied, withoutMajority, changedByReversingInput };
  }
}
const report = {
  checks: results, failures: failures(),
  counts: {
    plants: plants.length, cells: currentNodes.length, filters: 2 ** HABIT_GROUPS.length,
    gridSizes: [5, 10, 20],
    curatorFilterCases, nonemptyFiltersWithoutSelectedPlants, unchangedCellsWithDifferentDensitySize,
    cellsWithNoAttributedCurator: currentNodes.filter((n) => n.attention === 0).length,
    plantsWithNoAttributedCurator: plants.filter((p) => !annotations.has(p.PLANTID.toLowerCase())).length,
  },
  display: {
    noSelectionOpacity: opacity(currentNodes[0], [], new Set()),
    noMatchingPlantsOpacity: opacity(currentNodes[0], [], new Set(), { PlantDates: [] }),
    highlightedOpacity: opacity(currentNodes[0], [currentNodes[0]], new Set([currentNodes[0]])),
    colorDiagnostics,
  },
  scope: "Executes component functions and opacity expression for current data; excludes browser layout, fetch failures and event dispatch.",
};
// Keep reports private, outside shipped static assets.
const target = path.join(root, "reports/visualization-audit-report.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${results.length - failures().length}/${results.length} calculation checks pass`);
console.log(JSON.stringify({ counts: report.counts, display: report.display }, null, 2));
console.log(`Report: ${path.relative(root, target)}`);
if (failures().length) {
  console.error(failures());
  process.exitCode = 1;
}
