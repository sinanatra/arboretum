<script>
  import { onMount, tick } from "svelte";
  import * as d3 from "d3";
  import BaseMap from "@components/BaseMap.svelte";
  import { COLOR_MODES, colorModeByKey, cellValue } from "@lib/colors.js";

  export let data = [];
  export let fitData = []; // full dataset, independent of restored filters
  export let currentYear;
  export let selectedCuratorData = null;
  export let projection;
  export let backgroundPaths = [];
  // Dot size: "attention" = curator annotations per plant in the cell,
  // "density" = number of plants in the cell, "sum" = total of the plants'
  // ages, "age" = their average age
  export let sizeMode = "attention";
  export let colorMode = "accession"; // see COLOR_MODES in @lib/colors.js
  export let annotationsByPlant = new Map(); // lower-case plant ID → annotations

  let svg;
  let transform = d3.zoomIdentity;
  let zoom;
  let nodes = [];

  export let gridSize = 10; // meters in a local grid centered on the Arboretum
  const maxDiameter = 5;
  const minDiameter = 1;

  $: mode = colorModeByKey[colorMode] ?? COLOR_MODES[0];
  // cell id → fill color for the current color mode
  $: fillById = new Map(
    nodes.map((n) => [n.id, mode.color(cellValue(mode, n.rows))])
  );

  $: transformString = `translate(${transform.x}, ${transform.y}) scale(${transform.k})`;

  function computeNodes(data, projection, currentYear, annotationsByPlant, gridSize) {
    if (!data.length || !projection || currentYear == null) return [];

    const cellSize = gridSize;
    const gridMap = new Map();

    // Local metric grid centered on the Arboretum.
    const originLon = -71.125;
    const originLat = 42.3;
    const metersPerDegree = 6371008.8 * Math.PI / 180;
    const longitudeScale = metersPerDegree * Math.cos(originLat * Math.PI / 180);

    data.forEach((row, i) => {
      const lon = parseFloat(row.LONGITUDE);
      const lat = parseFloat(row.LATITUDE);
      const accYear = parseInt(row.ACC_YR, 10);
      if (isNaN(lon) || isNaN(lat) || isNaN(accYear)) return;

      const col = Math.floor((lon - originLon) * longitudeScale / cellSize);
      const rowIdx = Math.floor((lat - originLat) * metersPerDegree / cellSize);
      const key = `${col}-${rowIdx}`;
      if (!gridMap.has(key)) {
        const [x, y] = projection([
          originLon + (col + 0.5) * cellSize / longitudeScale,
          originLat + (rowIdx + 0.5) * cellSize / metersPerDegree,
        ]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        gridMap.set(key, { x, y, records: [] });
      }

      const age = Math.max(0, currentYear - accYear);
      const plantID = row.PLANTID ? String(row.PLANTID).toLowerCase() : String(i);
      const rec = {
        age,
        annotations: annotationsByPlant.get(plantID) ?? 0,
        plantID,
        row,
      };

      gridMap.get(key).records.push(rec);
    });

    const aggregated = [];
    for (const [id, cell] of gridMap) {
      const { x, y, records } = cell;
      const n = records.length;
      const plantIDs = records.map((r) => r.plantID);
      const rows = records.map((r) => r.row);
      const sumAge = records.reduce((s, r) => s + r.age, 0);
      // Aggregate elapsed years before applying the 100-year display cap.
      const meanAge = sumAge / n;
      const avgRadius = (minDiameter + Math.min(meanAge / 100, 1) * (maxDiameter - minDiameter)) / 2;
      const attention = records.reduce((s, r) => s + r.annotations, 0) / n;

      aggregated.push({ id, x, y, radius: avgRadius, sumAge, attention, count: n, plantIDs, rows });
    }

    // "attention" and "density": area-proportional above a visible minimum,
    // with the top 2% of cells sharing the largest size.
    const areaRadius = (value, cap) =>
      Math.max(minDiameter / 2, maxDiameter / 2 * Math.sqrt(Math.min(value / cap, 1)));
    const p98 = (key) => {
      const v = aggregated.map((n) => n[key]).sort((a, b) => a - b);
      return Math.max(1, v[Math.floor(0.98 * (v.length - 1))] ?? 1);
    };
    const capAttention = p98("attention");
    const capCount = p98("count");
    for (const n of aggregated) {
      n.radiusAttention = areaRadius(n.attention, capAttention);
      n.radiusCount = areaRadius(n.count, capCount);
    }

    // "sum" size: dot area proportional to the cell's total plant-years,
    // relative to the cell with the most (so it rescales with the filter)
    const maxSum = Math.max(1, ...aggregated.map((n) => n.sumAge));
    for (const n of aggregated) {
      n.radiusSum = areaRadius(n.sumAge, maxSum);
    }
    return aggregated;
  }

  // recomputed when the (filtered) plant list changes
  $: nodes = computeNodes(data, projection, currentYear, annotationsByPlant, gridSize);

  // plant ID → grid node, so selecting a curator is a lookup rather than a scan
  $: nodeByPlant = new Map(
    nodes.flatMap((n) => n.plantIDs.map((id) => [id, n]))
  );

  $: highlightedSet = new Set(
    (selectedCuratorData?.PlantDates ?? [])
      .map((pd) => nodeByPlant.get(String(pd.PlantID).toLowerCase()))
      .filter(Boolean)
  );

  function fitView(nodes, width, height, minScale, maxScale) {
    const margin = Math.min(40, width / 4, height / 4);
    const [x0, x1] = d3.extent(nodes, (n) => n.x);
    const [y0, y1] = d3.extent(nodes, (n) => n.y);
    const k = nodes.length
      ? Math.max(minScale, Math.min(maxScale,
          (width - 2 * margin) / (x1 - x0 || 1),
          (height - 2 * margin) / (y1 - y0 || 1)))
      : minScale;
    const cx = nodes.length ? (x0 + x1) / 2 : width / 2;
    const cy = nodes.length ? (y0 + y1) / 2 : height / 2;
    return d3.zoomIdentity.translate(width / 2 - k * cx, height / 2 - k * cy).scale(k);
  }

  onMount(async () => {
    await tick();
    if (!svg) return;

    zoom = d3
      .zoom()
      .scaleExtent([0.1, 14])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    d3.select(svg).call(zoom);

    // Fit all plants into the part of the map not covered by the sidebar
    // (with a margin), then centre them there.
    const w = svg.clientWidth,
      h = svg.clientHeight;
    const panel = document.querySelector(".curator-sidebar");
    const svgLeft = svg.getBoundingClientRect().left;
    const freeW = Math.max(1, panel ? panel.getBoundingClientRect().left - svgLeft : w);
    const fitNodes = fitData === data ? nodes : computeNodes(fitData, projection, currentYear, annotationsByPlant, gridSize);
    const initial = fitView(fitNodes, freeW, h, ...zoom.scaleExtent());
    d3.select(svg).call(zoom.transform, initial);
  });

</script>

<svg bind:this={svg} width="100%" height="100vh">
  <g transform={transformString}>
    <BaseMap paths={backgroundPaths} />

    {#each nodes as node (node.id)}
      <circle
        cx={node.x}
        cy={node.y}
        r={sizeMode === "attention"
          ? node.radiusAttention
          : sizeMode === "density"
            ? node.radiusCount
            : sizeMode === "sum"
            ? node.radiusSum
            : node.radius}
        fill={fillById.get(node.id)}
        fill-opacity={highlightedSet.has(node) ? 0.7 : 0.1}
        stroke={fillById.get(node.id)}
        stroke-width="0.1"
        class="dot"
      />
    {/each}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100vh;
  }
  .dot {
    pointer-events: none;
  }
</style>
