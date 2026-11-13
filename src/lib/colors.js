// Dot color modes for the map. Each grid cell holds several plants, so a
// numeric mode ("decade") colors a cell by the decade of its plants' average
// year, and a categorical mode by the most common category in the cell.
import { HABIT_GROUPS, habitGroup } from "@lib/habits.js";

const UNKNOWN = "#CCCCCC";

// accession decades (the original palette)
const ACCESSION_DECADES = {
  "1870s": "#184A2C", // deep forest green
  "1880s": "#2A5D34", // fir green
  "1890s": "#3C713C", // pine green
  "1900s": "#4F8646", // mossy green
  "1910s": "#6A9E50", // leaf green
  "1920s": "#8DB85E", // olive green
  "1930s": "#B5CC6A", // yellow-green
  "1940s": "#D6D772", // pale yellow
  "1950s": "#EBD06A", // straw
  "1960s": "#E8BB5E", // golden
  "1970s": "#D49F55", // ochre
  "1980s": "#BF7A48", // cedar bark
  "1990s": "#A2573C", // rich soil
  "2000s": "#80342F", // redwood
  "2010s": "#662426", // dark mulch
};

// last status year, binned by year: almost all of it falls in 1990–2012 and
// half of it in 2010–12, so decades would leave only three colors.
// Progress from purple through blue, teal and gold to red so periods remain
// distinguishable by hue even with translucent circle fills.
const OBSERVATION_BINS = [
  { label: "Before 1990", max: 1989, color: "#5E3C99" },
  { label: "1990–1994", max: 1994, color: "#4063B0" },
  { label: "1995–1999", max: 1999, color: "#2785B0" },
  { label: "2000–2004", max: 2004, color: "#1B9E89" },
  { label: "2005–2007", max: 2007, color: "#73A543" },
  { label: "2008–2009", max: 2009, color: "#C4A52C" },
  { label: "2010", max: 2010, color: "#E17C24" },
  { label: "2011", max: 2011, color: "#D44832" },
  { label: "2012", max: Infinity, color: "#A51C40" },
];

const STATUS = {
  alive: { label: "Alive", color: "#3C713C" },
  removed: { label: "Removed", color: "#8A7A6A" },
  lost: { label: "Lost", color: "#D9A23A" },
  dead: { label: "Dead", color: "#9C2F2F" },
};

const HABIT_COLORS = {
  tree: "#2A5D34",
  shrub: "#9DC46C",
  "shrub/tree": "#4F9A8A",
  vine: "#8A5A9C",
  herb: "#E1C169",
  unknown: UNKNOWN,
};

const COORD_SOURCES = {
  nad83: { label: "NAD83 lat/lon", color: "#5A7FA0" },
  "nad83-xy": { label: "NAD83 X/Y", color: "#8A5A9C" },
  nad27: { label: "NAD27 X/Y", color: "#D9822B" },
};

const decade = (y) => `${Math.floor(y / 10) * 10}s`;

const decadeMode = (key, label, field, palette) => ({
  key,
  label,
  numeric: true,
  value: (d) => parseInt(d[field], 10),
  color: (avg) => (isNaN(avg) ? UNKNOWN : palette[decade(avg)] ?? UNKNOWN),
  legend: [
    ...Object.entries(palette).map(([label, color]) => ({ label, color })),
    { label: "Unknown", color: UNKNOWN },
  ],
});

const binnedMode = (key, label, field, bins) => ({
  key,
  label,
  numeric: true,
  value: (d) => parseInt(d[field], 10),
  color: (avg) => (isNaN(avg) ? UNKNOWN : bins.find((b) => avg <= b.max).color),
  legend: [
    ...bins.map(({ label, color }) => ({ label, color })),
    { label: "Unknown", color: UNKNOWN },
  ],
});

const categoryMode = (key, label, value, categories) => ({
  key,
  label,
  numeric: false,
  value,
  color: (cat) => cat === "__tied__" ? "#667085" : categories[cat]?.color ?? UNKNOWN,
  legend: [...Object.values(categories), { label: "Mixed / tied", color: "#667085" }],
});

export const COLOR_MODES = [
  decadeMode("accession", "Mean accession year", "ACC_YR", ACCESSION_DECADES),
  binnedMode("observed", "Mean last status year", "last_date", OBSERVATION_BINS),
  categoryMode("status", "Status", (d) => d.STATUS, STATUS),
  categoryMode(
    "habit",
    "Growth form",
    (d) => habitGroup(d.HABIT),
    Object.fromEntries(
      HABIT_GROUPS.map((g) => [g.key, { label: g.label, color: HABIT_COLORS[g.key] }])
    )
  ),
  categoryMode("coords", "Coordinate source", (d) => d.COORD_SOURCE, COORD_SOURCES),
];

export const colorModeByKey = Object.assign(
  Object.create(null), Object.fromEntries(COLOR_MODES.map((m) => [m.key, m]))
);

export const colorExplanation = (key) => colorModeByKey[key]?.numeric
  ? "Each dot groups plant records. Color shows their mean year, grouped into the periods below; individual years can differ."
  : "Each dot groups plant records. Color shows the most frequent category; tied categories are marked Mixed / tied.";

// The value a cell is colored by: the average of a numeric mode, or the most
// common category. Ties are explicit and independent of file order.
export function cellValue(mode, plants) {
  if (mode.numeric) {
    const vals = plants.map(mode.value).filter((v) => !isNaN(v));
    return vals.length ? Math.floor(vals.reduce((s, v) => s + v, 0) / vals.length) : NaN;
  }
  const counts = new Map();
  for (const p of plants) {
    const v = mode.value(p);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best, bestN = 0;
  for (const [v, n] of counts) if (n > bestN) [best, bestN] = [v, n];
  return [...counts.values()].filter((n) => n === bestN).length > 1 ? "__tied__" : best;
}
